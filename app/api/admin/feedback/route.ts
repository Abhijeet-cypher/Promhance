import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { adminOrError } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const STATUSES = ["new", "reviewed", "archived"] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function parseBody(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

type FeedbackRow = {
  id: string;
  created_at: string;
  reaction: string;
  comment: string | null;
  prompt_id: string | null;
  anon_id: string;
  user_id: string | null;
  page_path: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  status: string;
};

/** GET /api/admin/feedback — paginated, filterable by status/reaction. */
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
  const status = searchParams.get("status");
  const reaction = searchParams.get("reaction");

  let query = supabase.from("feedback").select("*", { count: "exact" });
  if (status && (STATUSES as readonly string[]).includes(status)) {
    query = query.eq("status", status);
  }
  if (reaction) query = query.eq("reaction", reaction);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
    .returns<FeedbackRow[]>();

  if (error) {
    console.error("Admin feedback failed:", error.message);
    return NextResponse.json({ error: "Could not load feedback." }, { status: 500 });
  }

  const rows = data ?? [];
  const emails = await emailMap(
    supabase,
    rows.map((r) => r.user_id)
  );

  return NextResponse.json({
    feedback: rows.map((r) => ({
      ...r,
      user_email: r.user_id ? emails.get(r.user_id) ?? null : null,
    })),
    total: count ?? rows.length,
    limit,
    offset,
  });
}

/** PATCH /api/admin/feedback — update a feedback item's triage status. */
export async function PATCH(req: Request) {
  const guard = await adminOrError();
  if (!guard.ok) return guard.response;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const payload = parseBody(await req.json().catch(() => null));
  const id = typeof payload?.id === "string" ? payload.id : "";
  const status = typeof payload?.status === "string" ? payload.status : "";

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid feedback id." }, { status: 400 });
  }
  if (!(STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const { error } = await supabase.from("feedback").update({ status }).eq("id", id);
  if (error) {
    console.error("Admin feedback update failed:", error.message);
    return NextResponse.json({ error: "Could not update feedback." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
