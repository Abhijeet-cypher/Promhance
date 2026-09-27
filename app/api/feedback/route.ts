import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isValidUuid, parseAnonId, resolveUserId } from "@/lib/supabase/identity";

export const runtime = "nodejs";

const REACTIONS = ["great", "meh", "bad"] as const;
type Reaction = (typeof REACTIONS)[number];

const MAX_COMMENT_LENGTH = 1000;
const MAX_FIELD_LENGTH = 200;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanString(value: unknown, maxLength = MAX_FIELD_LENGTH): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function parseBody(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, "feedback", 15, 200);
  if (limited) return limited;

  const payload = parseBody(await req.json().catch(() => null));
  if (!payload) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: real users never fill this hidden field.
  if (cleanString(payload.website)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const reaction = cleanString(payload.reaction, 20);
  if (!reaction || !REACTIONS.includes(reaction as Reaction)) {
    return NextResponse.json({ error: "Invalid reaction." }, { status: 400 });
  }

  const anonId = parseAnonId(payload.anonId);
  if (!anonId) {
    return NextResponse.json({ error: "Missing device id." }, { status: 400 });
  }

  const promptId = isValidUuid(payload.promptId) ? payload.promptId : null;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Feedback is not configured yet. Add your Supabase keys to .env.local." },
      { status: 503 }
    );
  }

  const userId = await resolveUserId();

  const { data, error } = await supabase
    .from("feedback")
    .insert({
      reaction,
      comment: cleanString(payload.comment, MAX_COMMENT_LENGTH),
      prompt_id: promptId,
      anon_id: anonId,
      user_id: userId,
      page_path: cleanString(payload.pagePath),
      user_agent: cleanString(req.headers.get("user-agent"), 500),
      metadata: {
        referrer: cleanString(req.headers.get("referer"), 500),
      },
    })
    .select("id")
    .single();

  if (error) {
    console.error("Feedback insert failed:", error.message);
    return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}

export async function PATCH(req: Request) {
  const limited = await enforceRateLimit(req, "feedback", 15, 200);
  if (limited) return limited;

  const payload = parseBody(await req.json().catch(() => null));
  if (!payload) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const id = cleanString(payload.id, 64);
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid feedback id." }, { status: 400 });
  }

  const comment = cleanString(payload.comment, MAX_COMMENT_LENGTH);
  if (!comment) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Feedback is not configured yet. Add your Supabase keys to .env.local." },
      { status: 503 }
    );
  }

  // Only fills an empty comment, so an existing entry can never be overwritten.
  const { error } = await supabase
    .from("feedback")
    .update({ comment })
    .eq("id", id)
    .is("comment", null);

  if (error) {
    console.error("Feedback comment update failed:", error.message);
    return NextResponse.json({ error: "Could not save comment." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
