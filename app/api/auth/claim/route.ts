import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { parseAnonId, resolveUserId } from "@/lib/supabase/identity";

export const runtime = "nodejs";

function parseBody(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/**
 * POST /api/auth/claim
 *
 * Called immediately after a successful sign-in/sign-up. Re-parents the
 * anonymous device's unclaimed history to the authenticated account.
 *
 * Merge semantics: only rows with `user_id IS NULL` for this anon_id are
 * claimed. Rows already belonging to an account are never touched, so if
 * this device was used anonymously before logging into an account that
 * already has history, the two histories are appended — never overwritten.
 */
export async function POST(req: Request) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const payload = parseBody(await req.json().catch(() => null));
  const anonId = parseAnonId(payload?.anonId);
  if (!anonId) {
    return NextResponse.json({ error: "Invalid device id." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 503 });
  }

  const { data: claimedPrompts, error: promptError } = await supabase
    .from("prompts")
    .update({ user_id: userId })
    .eq("anon_id", anonId)
    .is("user_id", null)
    .select("id");

  if (promptError) {
    console.error("Prompt claim failed:", promptError.message);
    return NextResponse.json({ error: "Could not claim history." }, { status: 500 });
  }

  const { error: feedbackError } = await supabase
    .from("feedback")
    .update({ user_id: userId })
    .eq("anon_id", anonId)
    .is("user_id", null);

  if (feedbackError) {
    // Prompts are the primary payload; log and continue.
    console.error("Feedback claim failed:", feedbackError.message);
  }

  return NextResponse.json({ ok: true, claimed: claimedPrompts?.length ?? 0 });
}
