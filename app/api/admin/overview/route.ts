import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { adminOrError } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clampDays(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return 30;
  return Math.min(Math.max(parsed, 7), 365);
}

/**
 * GET /api/admin/overview?days=30
 *
 * Headline totals, a daily time series and distribution breakdowns. All
 * aggregation happens in SQL (see the admin_analytics_functions migration).
 */
export async function GET(req: Request) {
  const guard = await adminOrError();
  if (!guard.ok) return guard.response;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const days = clampDays(new URL(req.url).searchParams.get("days"));

  const [totals, series, prompts, reactions, countries] = await Promise.all([
    supabase.rpc("admin_overview_totals"),
    supabase.rpc("admin_daily_series", { p_days: days }),
    supabase.rpc("admin_prompts_breakdown"),
    supabase.rpc("admin_reaction_breakdown"),
    supabase.rpc("admin_country_breakdown"),
  ]);

  const failure = [totals, series, prompts, reactions, countries].find((r) => r.error);
  if (failure?.error) {
    console.error("Admin overview failed:", failure.error.message);
    return NextResponse.json(
      { error: "Could not load analytics. Has the admin migration been run?" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    totals: totals.data ?? {},
    series: series.data ?? [],
    prompts: prompts.data ?? { modes: [], intensities: [] },
    reactions: reactions.data ?? [],
    countries: countries.data ?? [],
    days,
  });
}
