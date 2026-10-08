import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { adminOrError } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const MAX_SEARCH_LENGTH = 200;

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function escapeForLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * GET /api/admin/users
 *
 * Paginated profiles with per-user activity counts, country and last activity.
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

  const [page, total] = await Promise.all([
    supabase.rpc("admin_users_page", {
      p_limit: limit,
      p_offset: offset,
      p_search: search || null,
    }),
    (() => {
      let countQuery = supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (search) {
        const term = escapeForLike(search);
        countQuery = countQuery.or(`email.ilike.%${term}%,display_name.ilike.%${term}%`);
      }
      return countQuery;
    })(),
  ]);

  if (page.error) {
    console.error("Admin users failed:", page.error.message);
    return NextResponse.json(
      { error: "Could not load users. Has the admin migration been run?" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    users: page.data ?? [],
    total: total.count ?? (page.data?.length ?? 0),
    limit,
    offset,
  });
}
