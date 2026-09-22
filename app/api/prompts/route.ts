import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isValidUuid, parseAnonId, resolveUserId } from "@/lib/supabase/identity";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const MAX_SEARCH_LENGTH = 200;

/** Escapes PostgREST `or`/`ilike` reserved characters in a search term. */
function escapeForOrFilter(value: string): string {
  return value.replace(/[\\%_,()*]/g, (char) => `\\${char}`);
}

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

type VersionRow = {
  id: string | null;
  version_number: number;
  text: string;
  action: string | null;
  action_label: string | null;
  created_at: string;
};

/**
 * Loads versions for the given prompts, grouped by prompt id. Returns an
 * empty map when the prompt_versions table is unavailable (e.g. the
 * migration has not been run yet) so history keeps working regardless.
 */
async function loadVersions(
  supabase: SupabaseClient,
  promptIds: string[]
): Promise<Map<string, VersionRow[]>> {
  const map = new Map<string, VersionRow[]>();
  if (promptIds.length === 0) return map;

  const { data, error } = await supabase
    .from("prompt_versions")
    .select("id, prompt_id, version_number, text, action, action_label, created_at")
    .in("prompt_id", promptIds)
    .order("version_number", { ascending: true });

  if (error) {
    console.error("Version list failed:", error.message);
    return map;
  }

  for (const row of (data ?? []) as (VersionRow & { prompt_id: string })[]) {
    const list = map.get(row.prompt_id) ?? [];
    list.push({
      id: row.id,
      version_number: row.version_number,
      text: row.text,
      action: row.action,
      action_label: row.action_label,
      created_at: row.created_at,
    });
    map.set(row.prompt_id, list);
  }

  return map;
}

/** Attaches versions, synthesizing v1 from the prompt when none are stored. */
function withVersions<T extends Pick<PromptRow, "id" | "enhanced_prompt" | "created_at">>(
  prompt: T,
  versions: VersionRow[]
): T & { versions: VersionRow[] } {
  return {
    ...prompt,
    versions:
      versions.length > 0
        ? versions
        : [
            {
              id: null,
              version_number: 1,
              text: prompt.enhanced_prompt,
              action: "base",
              action_label: null,
              created_at: prompt.created_at,
            },
          ],
  };
}

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

    const versionsByPrompt = await loadVersions(supabase, [data.id]);
    return NextResponse.json({
      prompt: withVersions(data, versionsByPrompt.get(data.id) ?? []),
    });
  }

  const limit = clampInt(searchParams.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);
  const offset = clampInt(searchParams.get("offset"), 0, 0, 100_000);
  const search = (searchParams.get("q") ?? "").trim().slice(0, MAX_SEARCH_LENGTH);

  let query = supabase.from("prompts").select("*", { count: "exact" });

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
    return NextResponse.json({ prompts: [], total: 0, limit, offset });
  }

  if (search) {
    const term = escapeForOrFilter(search);
    query = query.or(
      `original_prompt.ilike.%${term}%,enhanced_prompt.ilike.%${term}%,mode.ilike.%${term}%`
    );
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
    .returns<PromptRow[]>();

  if (error) {
    console.error("Prompt list failed:", error.message);
    return NextResponse.json({ error: "Could not load history." }, { status: 500 });
  }

  const rows = data ?? [];
  const versionsByPrompt = await loadVersions(
    supabase,
    rows.map((p) => p.id)
  );

  return NextResponse.json({
    prompts: rows.map((p) => withVersions(p, versionsByPrompt.get(p.id) ?? [])),
    total: count ?? rows.length,
    limit,
    offset,
  });
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
