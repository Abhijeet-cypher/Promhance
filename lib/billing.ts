import { getAdmin } from "@/lib/admin";
import { deriveState, grantsAccess, isRenewing, type PayPalSubscription } from "@/lib/billing-state";
import { clearEntitlements } from "@/lib/entitlements";
import {
  cancelSubscription,
  getSale,
  getSubscription,
  isBillingAdminOnly,
  isBillingConfigured,
  paypalEnv,
  planForPayPalId,
  type PaidPlanId,
} from "@/lib/paypal";
import { isValidUuid } from "@/lib/supabase/identity";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Keeps our `subscriptions` table in step with PayPal. Every path (webhook,
 * checkout return, cancel button) calls {@link syncSubscription}, which re-reads
 * the subscription from PayPal. That makes it safe to run twice or out of order,
 * and means nothing sent by a browser or webhook body is trusted for access.
 */

export type SubscriptionRow = {
  user_id: string;
  plan: PaidPlanId;
  status: string;
  provider: string | null;
  environment: string;
  provider_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

const ROW_COLUMNS =
  "user_id, plan, status, provider, environment, provider_subscription_id, current_period_start, current_period_end, cancel_at_period_end";

function db() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Database is not configured.");
  return supabase;
}

/** The user's subscription in the current PayPal environment, if any. */
export async function getSubscriptionRow(userId: string): Promise<SubscriptionRow | null> {
  const { data, error } = await db()
    .from("subscriptions")
    .select(ROW_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle<SubscriptionRow>();
  if (error) throw new Error(`Subscription lookup failed: ${error.message}`);
  if (!data || (data.provider === "paypal" && data.environment !== paypalEnv())) return null;
  return data;
}

/** Whether this visitor may start a checkout. */
export async function canPurchase(): Promise<boolean> {
  if (!isBillingConfigured()) return false;
  if (!isBillingAdminOnly()) return true;
  return (await getAdmin()).admin;
}

/** True when the latest recorded charge was refunded or charged back. */
async function latestPaymentReturned(subscriptionId: string): Promise<boolean> {
  const { data, error } = await db()
    .from("billing_payments")
    .select("status")
    .eq("subscription_id", subscriptionId)
    .order("paid_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ status: string }>();
  if (error) throw new Error(`Payment lookup failed: ${error.message}`);
  return data?.status === "refunded" || data?.status === "reversed";
}

/** Best effort: stop an old subscription so nobody is billed twice. */
async function stopSubscription(sub: PayPalSubscription, reason: string): Promise<void> {
  if (sub.status !== "ACTIVE" && sub.status !== "SUSPENDED") return;
  try {
    await cancelSubscription(sub.id, reason);
  } catch (error) {
    // Surfaces in logs for manual cleanup in the PayPal dashboard.
    console.error(`DOUBLE BILLING RISK: could not cancel ${sub.id}:`, error);
  }
}

export type SyncResult =
  | { synced: true; userId: string; state: ReturnType<typeof deriveState> }
  | { synced: false; reason: "pending" | "foreign" | "superseded" };

export async function syncSubscription(
  subscriptionId: string,
  fetched?: PayPalSubscription
): Promise<SyncResult> {
  const sub = fetched ?? (await getSubscription(subscriptionId));
  const userId = sub.custom_id;
  const plan = planForPayPalId(sub.plan_id);
  if (!userId || !isValidUuid(userId) || !plan) {
    console.error(`Ignoring PayPal subscription ${sub.id}: unknown account or plan.`);
    return { synced: false, reason: "foreign" };
  }

  let state = deriveState(sub);
  if (state.status === "pending") return { synced: false, reason: "pending" };

  // A full refund or chargeback ends access now and stops future billing.
  const returned = await latestPaymentReturned(sub.id);
  if (returned) {
    await stopSubscription(sub, "Payment refunded or reversed");
    state = { ...state, status: "canceled", periodEnd: new Date().toISOString() };
  }

  const existing = await getSubscriptionRow(userId);
  const otherId =
    existing?.provider === "paypal" && existing.provider_subscription_id !== sub.id
      ? existing.provider_subscription_id
      : null;

  // Once a subscription stops or falls overdue PayPal no longer says when the
  // paid period ends, so keep the end date recorded while it was healthy.
  if (
    !returned &&
    state.status !== "active" &&
    existing?.provider_subscription_id === sub.id &&
    existing.current_period_end &&
    Date.parse(existing.current_period_start ?? "") === Date.parse(state.periodStart ?? "")
  ) {
    state = { ...state, periodEnd: existing.current_period_end };
  }

  if (existing && otherId) {
    // Two subscriptions for one account (upgrade, or a double checkout).
    const incoming = {
      status: state.status,
      current_period_start: state.periodStart,
      current_period_end: state.periodEnd,
    };
    // An ended subscription never displaces anything.
    if (!grantsAccess(incoming)) return { synced: false, reason: "superseded" };

    const other = await getSubscription(otherId);
    const incomingIsNewer =
      Date.parse(sub.create_time ?? "") > Date.parse(other.create_time ?? "");
    if (!incomingIsNewer && grantsAccess(existing)) {
      await stopSubscription(sub, "Replaced by a newer subscription");
      return { synced: false, reason: "superseded" };
    }
    await stopSubscription(other, "Replaced by a newer subscription");
  }

  const { error } = await db().from("subscriptions").upsert({
    user_id: userId,
    plan,
    status: state.status,
    provider: "paypal",
    environment: paypalEnv(),
    provider_customer_id: sub.subscriber?.payer_id ?? null,
    provider_subscription_id: sub.id,
    current_period_start: state.periodStart,
    current_period_end: state.periodEnd,
    cancel_at_period_end: !isRenewing(state.status),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Subscription save failed: ${error.message}`);

  clearEntitlements(userId);
  return { synced: true, userId, state };
}

/** Records a charge (or its refund) from PayPal's own copy, then re-syncs. */
export async function syncSale(saleId: string): Promise<void> {
  const sale = await getSale(saleId);
  const subscriptionId = sale.billing_agreement_id;
  if (!subscriptionId) return; // not a subscription charge

  const sub = await getSubscription(subscriptionId);
  const userId = sub.custom_id && isValidUuid(sub.custom_id) ? sub.custom_id : null;

  const { error } = await db()
    .from("billing_payments")
    .upsert({
      id: sale.id,
      user_id: userId,
      subscription_id: subscriptionId,
      environment: paypalEnv(),
      status: sale.state,
      amount: sale.amount?.total ?? null,
      currency: sale.amount?.currency ?? null,
      paid_at: sale.create_time ?? null,
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(`Payment save failed: ${error.message}`);

  await syncSubscription(subscriptionId, sub);
}
