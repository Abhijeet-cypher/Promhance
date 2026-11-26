import { NextResponse } from "next/server";
import { canPurchase, getSubscriptionRow } from "@/lib/billing";
import { grantsAccess, isRenewing } from "@/lib/billing-state";
import { getEntitlements } from "@/lib/entitlements";
import { isBillingConfigured, paypalEnv } from "@/lib/paypal";
import { getUsage } from "@/lib/quota";
import { resolveUserId } from "@/lib/supabase/identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/billing/subscription — the caller's plan, for pricing and profile UI. */
export async function GET() {
  const configured = isBillingConfigured();
  const [userId, available] = await Promise.all([resolveUserId(), canPurchase()]);

  const base = {
    available,
    sandbox: configured && paypalEnv() === "sandbox",
    signedIn: Boolean(userId),
    subscription: null,
    usage: null,
  };
  if (!userId) return json(base);

  try {
    // Entitlements first: they re-check an overdue subscription with PayPal.
    const ent = await getEntitlements(userId);
    const row = await getSubscriptionRow(userId);
    const used = await getUsage(userId, null, ent);

    // Overdue and suspended subscriptions are still open at PayPal, so they stay
    // visible (and cancellable) even after access stops.
    const active = row ? grantsAccess(row) : false;
    const open = row ? isRenewing(row.status) || row.status === "suspended" : false;

    return json({
      ...base,
      subscription:
        row && (active || open)
          ? {
              plan: row.plan,
              status: row.status,
              renews: isRenewing(row.status),
              currentPeriodEnd: row.current_period_end,
              cancellable: configured && row.provider === "paypal" && open,
              lapsed: !active,
            }
          : null,
      usage: {
        tier: ent.tier,
        used: used.total,
        limit: ent.limits.enhancementsPerMonth,
        resetsAt: ent.resetsAt,
      },
    });
  } catch (error) {
    console.error("Billing status failed:", error);
    return NextResponse.json({ error: "Could not load your subscription." }, { status: 500 });
  }
}

function json(body: unknown) {
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
