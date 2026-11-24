import { getSupabaseAdmin } from "@/lib/supabase/server";
import { PLAN_LIMITS, type PlanLimits, type TierId } from "@/lib/plans";

export type Entitlements = {
  tier: TierId;
  limits: PlanLimits;
  /** Counter bucket key, e.g. "2026-11-01". Changes when the quota resets. */
  period: string;
  /** ISO timestamp when the quota resets. */
  resetsAt: string;
};

/** How long a past_due / just-expired subscription keeps paid access. */
const GRACE_MS = 5 * 24 * 60 * 60 * 1000;
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: Entitlements; expires: number }>();

/** Calendar-month period (UTC) used by anonymous and Free users. */
function calendarPeriod(now = new Date()): { period: string; resetsAt: string } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { period: start.toISOString().slice(0, 10), resetsAt: next.toISOString() };
}

function build(tier: TierId, period: string, resetsAt: string): Entitlements {
  return { tier, limits: PLAN_LIMITS[tier], period, resetsAt };
}

type SubscriptionRow = {
  plan: "pro" | "power";
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
};

/**
 * Resolves what a visitor is entitled to. No user id = anonymous; a signed-in
 * user without an active subscription = Free. Paid periods follow the billing
 * cycle so usage resets on the renewal date, not the 1st of the month.
 */
export async function getEntitlements(userId: string | null): Promise<Entitlements> {
  const cal = calendarPeriod();
  if (!userId) return build("anonymous", cal.period, cal.resetsAt);

  const cached = cache.get(userId);
  if (cached && cached.expires > Date.now()) return cached.value;

  let value = build("free", cal.period, cal.resetsAt);

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_start, current_period_end")
      .eq("user_id", userId)
      .maybeSingle<SubscriptionRow>();

    if (error) {
      // Table missing (migration not run) or transient failure: treat as Free.
      console.error("Subscription lookup failed:", error.message);
    } else if (data && ACTIVE_STATUSES.has(data.status) && data.current_period_start) {
      const end = data.current_period_end ? Date.parse(data.current_period_end) : null;
      const withinPeriod = end === null || end + GRACE_MS > Date.now();
      if (withinPeriod) {
        const start = new Date(data.current_period_start);
        const resets = end ? new Date(end) : new Date(cal.resetsAt);
        value = build(data.plan, start.toISOString().slice(0, 10), resets.toISOString());
      }
    }
  }

  if (cache.size > 5_000) cache.clear();
  cache.set(userId, { value, expires: Date.now() + CACHE_TTL_MS });
  return value;
}
