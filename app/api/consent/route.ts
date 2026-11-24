import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { parseAnonId, resolveUserId } from "@/lib/supabase/identity";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { CONSENT_SOURCES, TERMS_VERSION, type ConsentSource } from "@/lib/consent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/consent  { version, source, anonId }
 *
 * Stores who agreed to which version of the Terms and Privacy Policy, when, and
 * from where (IP + user agent), as evidence of acceptance. Idempotent: one row
 * per person per version and source-type, so repeated calls are harmless.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (await isRateLimited(`consent:${ip}`, 30, 3600)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Only the current version can be accepted; anything else is stale or forged.
  if (body.version !== TERMS_VERSION) {
    return NextResponse.json({ error: "Unknown terms version." }, { status: 400 });
  }
  const source = body.source as ConsentSource;
  if (!CONSENT_SOURCES.includes(source)) {
    return NextResponse.json({ error: "Invalid source." }, { status: 400 });
  }

  const anonId = parseAnonId(body.anonId);
  const userId = await resolveUserId();
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, recorded: false });
  if (!userId && !anonId) {
    return NextResponse.json({ error: "No identity to record against." }, { status: 400 });
  }

  // Skip if this person already has a row for this version.
  const existing = userId
    ? await supabase
        .from("terms_acceptances")
        .select("id")
        .eq("user_id", userId)
        .eq("version", TERMS_VERSION)
        .limit(1)
    : await supabase
        .from("terms_acceptances")
        .select("id")
        .eq("anon_id", anonId!)
        .is("user_id", null)
        .eq("version", TERMS_VERSION)
        .limit(1);
  if (existing.error) {
    console.error("Consent lookup failed:", existing.error.message);
    return NextResponse.json({ ok: false, recorded: false });
  }
  if ((existing.data ?? []).length > 0) {
    return NextResponse.json({ ok: true, recorded: false });
  }

  const { error } = await supabase.from("terms_acceptances").insert({
    user_id: userId,
    anon_id: anonId,
    version: TERMS_VERSION,
    source,
    ip,
    user_agent: (req.headers.get("user-agent") ?? "").slice(0, 400),
  });
  if (error) {
    console.error("Consent insert failed:", error.message);
    return NextResponse.json({ ok: false, recorded: false });
  }

  return NextResponse.json({ ok: true, recorded: true });
}
