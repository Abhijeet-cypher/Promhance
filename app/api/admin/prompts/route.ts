import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { adminOrError } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const MAX_SEARCH_LENGTH = 200;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Cap on how many profiles we resolve an email search to. A specific email
// matches a handful of accounts, so this never truncates realistic results.
const MAX_USER_MATCHES = 100;

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function escapeForOrFilter(value: string): string {
  return value.replace(/[\\%_,()*]/g, (char) => `\\${char}`);
}

function escapeForLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Accepts a `YYYY-MM-DD` date; returns null for anything else. */
function cleanDate(value: string | null): string | null {
  const trimmed = (value ?? "").trim();
  return DATE_RE.test(trimmed) ? trimmed : null;
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

async function emailMap(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const ids = Array.from(new Set(userIds.filter((id): id is string => Boolean(id))));
  if (ids.length === 0) return map;

  const { data } = await supabase.from("profiles").select("id, email").in("id", ids);
  for (const row of (data ?? []) as { id: string; email: string | null }[]) {
    if (row.email) map.set(row.id, row.email);
  }
  return map;
}

/**
 * GET /api/admin/prompts
 *
 * Paginated, filterable list of every enhancement.
 *
 * Filters:
 *   ?q=          text match on original / enhanced / mode
 *   ?mode=       exact mode
 *   ?intensity=  exact intensity (low | medium | high)
 *   ?identity=   "anon" (user_id IS NULL) | "user" (registered)
 *   ?user=       profile email search, or an exact user UUID
 *   ?from=       created_at >= from (YYYY-MM-DD)
 *   ?to=         created_at <= to (YYYY-MM-DD, end of day)
 *   ?sort=       "newest" (default) | "oldest"
 */
export async function GET(req: Request) {
  const guard = await adminOrError();
  if (!guard.ok) return guard.response;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const limit = clampInt(searchParams.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);
  const offset = clampInt(searchParams.get("offset"), 0, 0, 1_000_000);
  const search = (searchParams.get("q") ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
  const mode = (searchParams.get("mode") ?? "").trim().slice(0, 60);
  const intensity = (searchParams.get("intensity") ?? "").trim().slice(0, 40);
  const identity = (searchParams.get("identity") ?? "").trim();
  const user = (searchParams.get("user") ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
  const from = cleanDate(searchParams.get("from"));
  const to = cleanDate(searchParams.get("to"));
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";

  // User filter: exact UUID, or resolve an email search to account ids first.
  let userIds: string[] | null = null;
  if (user) {
    if (UUID_RE.test(user)) {
      userIds = [user];
    } else {
      const { data: matches, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", `%${escapeForLike(user)}%`)
        .limit(MAX_USER_MATCHES);

      if (userError) {
        console.error("Admin prompt user filter failed:", userError.message);
        return NextResponse.json({ error: "Could not filter by user." }, { status: 500 });
      }

      userIds = (matches ?? []).map((row) => row.id as string);
      if (userIds.length === 0) {
        return NextResponse.json({ prompts: [], total: 0, limit, offset });
      }
    }
  }

  let query = supabase.from("prompts").select("*", { count: "exact" });

  if (mode) query = query.eq("mode", mode);
  if (intensity) query = query.eq("intensity", intensity);
  if (identity === "anon") query = query.is("user_id", null);
  if (identity === "user") query = query.not("user_id", "is", null);
  if (userIds) query = query.in("user_id", userIds);
  if (from) query = query.gte("created_at", `${from}T00:00:00.000Z`);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999Z`);
  if (search) {
    const term = escapeForOrFilter(search);
    query = query.or(
      `original_prompt.ilike.%${term}%,enhanced_prompt.ilike.%${term}%,mode.ilike.%${term}%`
    );
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: sort === "oldest" })
    .range(offset, offset + limit - 1)
    .returns<PromptRow[]>();

  if (error) {
    console.error("Admin prompts failed:", error.message);
    return NextResponse.json({ error: "Could not load prompts." }, { status: 500 });
  }

  const rows = data ?? [];
  const emails = await emailMap(
    supabase,
    rows.map((r) => r.user_id).filter((id): id is string => Boolean(id))
  );

  return NextResponse.json({
    prompts: rows.map((r) => ({
      ...r,
      user_email: r.user_id ? emails.get(r.user_id) ?? null : null,
    })),
    total: count ?? rows.length,
    limit,
    offset,
  });
}
