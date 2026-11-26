/**
 * Pure rules that turn a PayPal subscription into Promhance access. No I/O, so
 * the money-critical logic can be reasoned about (and tested) on its own.
 */

export type BillingStatus = "pending" | "active" | "past_due" | "canceled" | "suspended" | "expired";

/** The subset of PayPal's subscription resource that we read. */
export type PayPalSubscription = {
  id: string;
  plan_id: string;
  status: string;
  custom_id?: string;
  create_time?: string;
  subscriber?: { payer_id?: string };
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { time?: string };
    failed_payments_count?: number;
    outstanding_balance?: { value?: string };
  };
};

export type SubscriptionState = {
  status: BillingStatus;
  periodStart: string | null;
  periodEnd: string | null;
};

/** How long a renewing subscription keeps access after its paid period ends. */
export const GRACE_MS = 5 * 24 * 60 * 60 * 1000;

/** Same day next month, clamped (31 Jan -> 28/29 Feb). */
export function addOneMonth(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d.toISOString();
}

export function deriveState(sub: PayPalSubscription): SubscriptionState {
  const info = sub.billing_info ?? {};
  const paidAt = info.last_payment?.time ?? null;

  // No money received yet: never grant anything, whatever the status says.
  if (!paidAt) {
    return { status: "pending", periodStart: null, periodEnd: null };
  }

  const paidThrough = addOneMonth(paidAt);
  const owes =
    (info.failed_payments_count ?? 0) > 0 || Number(info.outstanding_balance?.value ?? 0) > 0;

  switch (sub.status) {
    case "ACTIVE":
      return owes
        ? { status: "past_due", periodStart: paidAt, periodEnd: paidThrough }
        : { status: "active", periodStart: paidAt, periodEnd: info.next_billing_time ?? paidThrough };
    // A stopped subscription keeps what was already paid for, nothing more.
    case "CANCELLED":
      return { status: "canceled", periodStart: paidAt, periodEnd: paidThrough };
    case "SUSPENDED":
      return { status: "suspended", periodStart: paidAt, periodEnd: paidThrough };
    case "EXPIRED":
      return { status: "expired", periodStart: paidAt, periodEnd: paidThrough };
    default:
      return { status: "pending", periodStart: null, periodEnd: null };
  }
}

/** True while PayPal will keep charging (so the user must cancel to stop). */
export function isRenewing(status: string): boolean {
  return status === "active" || status === "past_due" || status === "trialing";
}

/** Whether a stored subscription currently unlocks its paid plan. */
export function grantsAccess(
  row: { status: string; current_period_start: string | null; current_period_end: string | null },
  now = Date.now()
): boolean {
  if (!row.current_period_start) return false;
  const end = row.current_period_end ? Date.parse(row.current_period_end) : null;
  if (isRenewing(row.status)) return end === null || end + GRACE_MS > now;
  if (row.status === "canceled" || row.status === "suspended" || row.status === "expired") {
    return end !== null && end > now;
  }
  return false;
}
