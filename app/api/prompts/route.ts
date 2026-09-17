import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isValidUuid, parseAnonId, resolveUserId } from "@/lib/supabase/identity";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

type PromptRow = {
  id: string;
  anon_id: string;
  user_id: string | null;
  original_prompt: string;
  enhanced_prompt: string;
  mode: string | null;
  intensity: string | null;
  created_at: string;
};

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

/**
 * GET /api/prompts           — list history for the caller
 * GET /api/prompts?id=<uuid> — fetch a single owned prompt
 *
 * Identity: the signed-in user (via session cookie) takes precedence;
 * otherwise the anonymous device id is used. Anonymous callers only see
 * unclaimed rows so an account's history is never exposed after sign-out.
 */
export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "History is not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const anonId = parseAnonId(searchParams.get("anon_id"));
  const userId = await resolveUserId();

  if (id) {
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: "Invalid prompt id." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .eq("id", id)
      .maybeSingle<PromptRow>();

    if (error) {
      console.error("Prompt fetch failed:", error.message);
      return NextResponse.json({ error: "Could not load prompt." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Prompt not found." }, { status: 404 });
    }

    const owned =
      (userId && data.user_id === userId) ||
      (anonId && data.user_id === null && data.anon_id === anonId);

    if (!owned) {
      return NextResponse.json({ error: "Prompt not found." }, { status: 404 });
    }

    return NextResponse.json({ prompt: data });
  }

  const limit = clampInt(searchParams.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);
  const offset = clampInt(searchParams.get("offset"), 0, 0, 100_000);

  let query = supabase.from("prompts").select("*");

  if (userId && anonId) {
    // Account history + any still-unclaimed rows for this device. This keeps
    // history intact even if it is read before the post-sign-in claim lands.
    query = query.or(
      `user_id.eq.${userId},and(anon_id.eq.${anonId},user_id.is.null)`
    );
  } else if (userId) {
    query = query.eq("user_id", userId);
  } else if (anonId) {
    query = query.eq("anon_id", anonId).is("user_id", null);
  } else {
    return NextResponse.json({ prompts: [] });
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
    .returns<PromptRow[]>();

  if (error) {
    console.error("Prompt list failed:", error.message);
    return NextResponse.json({ error: "Could not load history." }, { status: 500 });
  }

  return NextResponse.json({ prompts: data ?? [] });
}

/**
 * DELETE /api/prompts?id=<uuid> — delete a prompt owned by the caller.
 */
export async function DELETE(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "History is not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const anonId = parseAnonId(searchParams.get("anon_id"));
  const userId = await resolveUserId();

  if (!id || !isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid prompt id." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("prompts")
    .select("id, anon_id, user_id")
    .eq("id", id)
    .maybeSingle<Pick<PromptRow, "id" | "anon_id" | "user_id">>();

  if (error) {
    console.error("Prompt lookup failed:", error.message);
    return NextResponse.json({ error: "Could not delete prompt." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Prompt not found." }, { status: 404 });
  }

  const owned =
    (userId && data.user_id === userId) ||
    (anonId && data.user_id === null && data.anon_id === anonId);

  if (!owned) {
    return NextResponse.json({ error: "Prompt not found." }, { status: 404 });
  }

  const { error: deleteError } = await supabase.from("prompts").delete().eq("id", id);
  if (deleteError) {
    console.error("Prompt delete failed:", deleteError.message);
    return NextResponse.json({ error: "Could not delete prompt." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
