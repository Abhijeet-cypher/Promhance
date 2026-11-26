import { NextResponse } from "next/server";
import { syncSubscription } from "@/lib/billing";
import { getSubscription, isBillingConfigured } from "@/lib/paypal";
import { enforceRateLimit } from "@/lib/rate-limit";
import { resolveUserId } from "@/lib/supabase/identity";

export const runtime = "nodejs";

/**
 * POST /api/billing/confirm — body: { subscriptionId }
 * Called when the buyer returns from PayPal, so the plan unlocks without
 * waiting for the webhook. The id is only a lookup key: PayPal is asked for the
 * truth, and the subscription must belong to the signed-in account.
 */
export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, "billing-confirm", 30, 200);
  if (limited) return limited;

  const userId = await resolveUserId();
  if (!userId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!isBillingConfigured()) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const id = typeof body?.subscriptionId === "string" ? body.subscriptionId : "";
  if (!/^I-[A-Z0-9]{4,30}$/.test(id)) {
    return NextResponse.json({ error: "Invalid subscription id." }, { status: 400 });
  }

  try {
    const subscription = await getSubscription(id);
    if (subscription.custom_id !== userId) {
      return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
    }
    const result = await syncSubscription(id, subscription);
    // "pending": approved, but PayPal has not reported the first charge yet.
    return NextResponse.json({ status: result.synced ? result.state.status : result.reason });
  } catch (error) {
    console.error("Subscription confirm failed:", error);
    return NextResponse.json({ error: "Could not confirm the payment yet." }, { status: 502 });
  }
}
