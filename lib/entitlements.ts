import { getSupabaseAdmin } from "@/lib/supabase/server";
import { PLAN_LIMITS, type PlanLimits, type TierId } from "@/lib/plans";
import { grantsAccess, isRenewing } from "@/lib/billing-state";
import { isBillingConfigured, paypalEnv } from "@/lib/paypal";

export type Entitlements = {
  tier: TierId;
  limits: PlanLimits;
  /** Counter bucket key, e.g. "2026-11-01". Changes when the quota resets. */
  period: string;
  /** ISO timestamp when the quota resets. */
  resetsAt: string;
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: Entitlements; expires: number }>();

/** Drop the cached plan so a billing change shows up immediately. */
export function clearEntitlements(userId: string): void {
  cache.delete(userId);
}

/** Last PayPal re-check per subscription, so a stale row is not re-read on every request. */
const reconciledAt = new Map<string, number>();
const RECONCILE_EVERY_MS = 10 * 60 * 1000;

/** If a renewal webhook was missed, ask PayPal before downgrading anyone. */
async function reconcileIfOverdue(row: SubscriptionRow): Promise<boolean> {
  const id = row.provider_subscription_id;
  const end = row.current_period_end ? Date.parse(row.current_period_end) : null;
  if (row.provider !== "paypal" || !id || !isBillingConfigured()) return false;
  if (!isRenewing(row.status) || end === null || end > Date.now()) return false;
  if (Date.now() - (reconciledAt.get(id) ?? 0) < RECONCILE_EVERY_MS) return false;

  reconciledAt.set(id, Date.now());
  try {
    const { syncSubscription } = await import("@/lib/billing");
    return (await syncSubscription(id)).synced;
  } catch (error) {
    console.error("Subscription re-check failed:", error);
    return false;
  }
}

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
  provider: string | null;
  environment: string;
  provider_subscription_id: string | null;
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
    const load = () =>
      supabase
        .from("subscriptions")
        .select(
          "plan, status, current_period_start, current_period_end, provider, environment, provider_subscription_id"
        )
        .eq("user_id", userId)
        .maybeSingle<SubscriptionRow>();

    let { data, error } = await load();
    // Sandbox test purchases never unlock a live deployment, and vice versa.
    const usable = (row: SubscriptionRow) =>
      row.provider !== "paypal" || row.environment === paypalEnv();
    if (data && usable(data) && (await reconcileIfOverdue(data))) {
      ({ data, error } = await load());
    }

    if (error) {
      // Table missing (migration not run) or transient failure: treat as Free.
      console.error("Subscription lookup failed:", error.message);
    } else if (data && usable(data) && data.current_period_start && grantsAccess(data)) {
      const start = new Date(data.current_period_start);
      const resets = data.current_period_end
        ? new Date(data.current_period_end)
        : new Date(cal.resetsAt);
      value = build(data.plan, start.toISOString().slice(0, 10), resets.toISOString());
    }
  }

  if (cache.size > 5_000) cache.clear();
  cache.set(userId, { value, expires: Date.now() + CACHE_TTL_MS });
  return value;
}
