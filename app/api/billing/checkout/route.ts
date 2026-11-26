import { NextResponse } from "next/server";
import { canPurchase, getSubscriptionRow } from "@/lib/billing";
import { grantsAccess, isRenewing } from "@/lib/billing-state";
import { checkoutPlanId, createSubscription } from "@/lib/paypal";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RANK = { pro: 1, power: 2 } as const;

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/**
 * POST /api/billing/checkout — body: { plan: "pro" | "power" }
 * Creates a PayPal subscription and returns the approval link. Nothing is
 * granted here; access starts only once PayPal reports a payment.
 */
export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, "checkout", 5, 30);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const plan: unknown = body?.plan;
  if (plan !== "pro" && plan !== "power") return fail("Unknown plan.", 400);

  const supabase = await createServerSupabaseClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return fail("Sign in to subscribe.", 401);

  if (!(await canPurchase())) return fail("Paid plans are not available yet.", 503);

  try {
    const row = await getSubscriptionRow(user.id);
    // Only an upgrade may replace a subscription that still has paid access.
    // (A suspended or overdue one counts: the user should not pay twice.)
    if (row && grantsAccess(row) && RANK[plan] <= RANK[row.plan]) {
      const until = row.current_period_end
        ? new Date(row.current_period_end).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })
        : null;
      return fail(
        isRenewing(row.status)
          ? plan === row.plan
            ? "You already have this plan."
            : "To switch to Pro, cancel Power first, then subscribe to Pro when it ends."
          : `Your current plan is paid up${until ? ` until ${until}` : ""}. You can subscribe again after that.`,
        409
      );
    }

    const origin = (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
    const subscription = await createSubscription({
      planId: checkoutPlanId(plan) as string,
      userId: user.id,
      email: user.email ?? null,
      returnUrl: `${origin}/profile?checkout=success`,
      cancelUrl: `${origin}/pricing?checkout=cancelled`,
    });

    return NextResponse.json({ url: subscription.approvalUrl, subscriptionId: subscription.id });
  } catch (error) {
    console.error("Checkout failed:", error);
    return fail("Could not start checkout. Please try again.", 502);
  }
}
