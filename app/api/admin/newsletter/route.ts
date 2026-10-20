import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { adminOrError } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  country: string | null;
  newsletter_opt_in: boolean | null;
  created_at: string;
};

/** GET /api/admin/newsletter — subscriber stats and a paginated list. */
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
  const filter = searchParams.get("filter");

  const totalQuery = supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  const optedInQuery = supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("newsletter_opt_in", true);

  let listQuery = supabase
    .from("profiles")
    .select("id, email, display_name, country, newsletter_opt_in, created_at", {
      count: "exact",
    });
  if (filter === "subscribed") listQuery = listQuery.eq("newsletter_opt_in", true);
  if (filter === "unsubscribed") listQuery = listQuery.eq("newsletter_opt_in", false);

  const [total, optedIn, list] = await Promise.all([
    totalQuery,
    optedInQuery,
    listQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
      .returns<ProfileRow[]>(),
  ]);

  if (list.error) {
    console.error("Admin newsletter failed:", list.error.message);
    return NextResponse.json({ error: "Could not load subscribers." }, { status: 500 });
  }

  const totalCount = total.count ?? 0;
  const optedInCount = optedIn.count ?? 0;

  return NextResponse.json({
    stats: {
      subscribed: optedInCount,
      unsubscribed: Math.max(totalCount - optedInCount, 0),
      total: totalCount,
    },
    subscribers: list.data ?? [],
    total: list.count ?? 0,
    limit,
    offset,
  });
}
