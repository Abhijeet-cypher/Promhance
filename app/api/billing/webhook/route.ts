import { NextResponse } from "next/server";
import { syncSale, syncSubscription } from "@/lib/billing";
import { paypalEnv, verifyWebhook } from "@/lib/paypal";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BODY_BYTES = 256_000;

type WebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: { id?: string; sale_id?: string };
};

/**
 * POST /api/billing/webhook — PayPal's notifications: renewals, failures,
 * cancellations, refunds. The event only says *what to re-read*; state always
 * comes from PayPal's API. A non-2xx reply makes PayPal retry for ~3 days.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  try {
    if (!(await verifyWebhook(req.headers, raw))) {
      console.error("Rejected PayPal webhook: signature not verified.", event.event_type);
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return NextResponse.json({ error: "Verification unavailable." }, { status: 500 });
  }

  const type = event.event_type ?? "";
  const resource = event.resource ?? {};
  let failure: string | null = null;

  try {
    if (type.startsWith("BILLING.SUBSCRIPTION.") && resource.id) {
      await syncSubscription(resource.id);
    } else if (type.startsWith("PAYMENT.SALE.")) {
      // A refund event's resource is the refund; `sale_id` points at the charge.
      const saleId = resource.sale_id ?? resource.id;
      if (saleId) await syncSale(saleId);
    }
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
    console.error(`Webhook ${type} failed:`, failure);
  }

  await logEvent(event, failure);

  return failure
    ? NextResponse.json({ error: "Processing failed." }, { status: 500 })
    : NextResponse.json({ ok: true });
}

/** Best-effort audit trail; never changes the response. */
async function logEvent(event: WebhookEvent, failure: string | null) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !event.id) return;
  const { error } = await supabase.from("billing_events").upsert({
    id: event.id,
    event_type: event.event_type ?? "unknown",
    resource_id: event.resource?.id ?? null,
    environment: paypalEnv(),
    error: failure?.slice(0, 500) ?? null,
    received_at: new Date().toISOString(),
  });
  if (error) console.error("Webhook log failed:", error.message);
}
