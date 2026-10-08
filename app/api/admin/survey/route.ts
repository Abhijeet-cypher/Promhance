import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
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

async function emailMap(
  supabase: SupabaseClient,
  userIds: (string | null)[]
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

type SurveyRow = {
  id: string;
  created_at: string;
  usage_frequency: string;
  desired_features: string[] | null;
  desired_features_other: string | null;
  regular_use_reason: string | null;
  price_likelihood: string;
  additional_notes: string | null;
  user_id: string | null;
  anon_id: string;
  user_agent: string | null;
};

/** GET /api/admin/survey — aggregates plus a paginated list of responses. */
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

  const [breakdown, list] = await Promise.all([
    supabase.rpc("admin_survey_breakdown"),
    supabase
      .from("survey_responses")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
      .returns<SurveyRow[]>(),
  ]);

  if (list.error) {
    console.error("Admin survey failed:", list.error.message);
    return NextResponse.json({ error: "Could not load survey responses." }, { status: 500 });
  }

  const rows = list.data ?? [];
  const emails = await emailMap(
    supabase,
    rows.map((r) => r.user_id)
  );

  return NextResponse.json({
    breakdown: breakdown.data ?? { usage: [], price: [], features: [] },
    responses: rows.map((r) => ({
      ...r,
      user_email: r.user_id ? emails.get(r.user_id) ?? null : null,
    })),
    total: list.count ?? rows.length,
    limit,
    offset,
  });
}
