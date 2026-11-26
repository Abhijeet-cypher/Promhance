import { NextResponse } from "next/server";
import { getSubscriptionRow, syncSubscription } from "@/lib/billing";
import { cancelSubscription, getSubscription, isBillingConfigured, PayPalError } from "@/lib/paypal";
import { enforceRateLimit } from "@/lib/rate-limit";
import { resolveUserId } from "@/lib/supabase/identity";

export const runtime = "nodejs";

/**
 * POST /api/billing/cancel — stops renewal of the caller's own subscription.
 * Access continues to the end of the paid period. Stays available even if new
 * sales are switched off.
 */
export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, "billing-cancel", 5, 30);
  if (limited) return limited;

  const userId = await resolveUserId();
  if (!userId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!isBillingConfigured()) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  try {
    const row = await getSubscriptionRow(userId);
    const id = row?.provider === "paypal" ? row.provider_subscription_id : null;
    if (!id) return NextResponse.json({ error: "No subscription to cancel." }, { status: 404 });

    try {
      await cancelSubscription(id, "Cancelled by the customer on Promhance");
    } catch (error) {
      // 422 = already cancelled (e.g. from PayPal's own site): just re-sync.
      const alreadyStopped =
        error instanceof PayPalError &&
        error.status === 422 &&
        (await getSubscription(id)).status === "CANCELLED";
      if (!alreadyStopped) throw error;
    }

    await syncSubscription(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Cancellation failed:", error);
    return NextResponse.json(
      { error: "Could not cancel. Please try again, or cancel from your PayPal account." },
      { status: 502 }
    );
  }
}
