import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/supabase/identity";
import { verifyUnsubscribeToken } from "@/lib/newsletter";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

function parseBody(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function cleanEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(trimmed)) return null;
  return trimmed;
}

/** Returns the signed-in user's current newsletter preference. */
export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "The newsletter is not configured yet." },
      { status: 503 }
    );
  }

  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("newsletter_opt_in")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Newsletter preference lookup failed:", error.message);
    return NextResponse.json({ error: "Could not load preference." }, { status: 500 });
  }

  return NextResponse.json({ optIn: data?.newsletter_opt_in ?? true }, { status: 200 });
}

/**
 * Supported actions:
 *  - "set"         (signed in): set the current user's preference to `optIn`.
 *  - "subscribe"   (signed out): opt the account matching `email` back in.
 *  - "unsubscribe": opt the account matching `email` out (token optional).
 */
export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, "newsletter", 10, 60);
  if (limited) return limited;

  const payload = parseBody(await req.json().catch(() => null));
  if (!payload) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "The newsletter is not configured yet." },
      { status: 503 }
    );
  }

  const action = typeof payload.action === "string" ? payload.action : "";

  if (action === "unsubscribe") {
    const email = cleanEmail(payload.email);
    if (!email) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const token = typeof payload.token === "string" ? payload.token : "";
    if (token && !verifyUnsubscribeToken(email, token)) {
      return NextResponse.json(
        { error: "This unsubscribe link is invalid or has expired." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update({ newsletter_opt_in: false })
      .eq("email", email);

    if (error) {
      console.error("Newsletter unsubscribe failed:", error.message);
      return NextResponse.json({ error: "Could not update your preference." }, { status: 500 });
    }

    // Always report success so we never reveal whether an email is registered.
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (action === "subscribe") {
    const userId = await resolveUserId();
    if (userId) {
      const { error } = await supabase
        .from("profiles")
        .update({ newsletter_opt_in: true })
        .eq("id", userId);
      if (error) {
        console.error("Newsletter subscribe failed:", error.message);
        return NextResponse.json({ error: "Could not subscribe." }, { status: 500 });
      }
      return NextResponse.json({ ok: true, optIn: true }, { status: 200 });
    }

    const email = cleanEmail(payload.email);
    if (!email) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ newsletter_opt_in: true })
      .eq("email", email)
      .select("id");

    if (error) {
      console.error("Newsletter subscribe failed:", error.message);
      return NextResponse.json({ error: "Could not subscribe." }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ ok: false, needsAccount: true }, { status: 200 });
    }

    return NextResponse.json({ ok: true, optIn: true }, { status: 200 });
  }

  if (action === "set") {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const optIn = payload.optIn !== false;
    const { error } = await supabase
      .from("profiles")
      .update({ newsletter_opt_in: optIn })
      .eq("id", userId);

    if (error) {
      console.error("Newsletter preference update failed:", error.message);
      return NextResponse.json({ error: "Could not update your preference." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, optIn }, { status: 200 });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
