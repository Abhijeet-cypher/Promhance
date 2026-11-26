import type { PayPalSubscription } from "@/lib/billing-state";

/**
 * Minimal server-only PayPal REST client (no SDK). Sandbox and live differ only
 * by environment variables; see docs/paypal-setup.md.
 */

export type PayPalEnv = "sandbox" | "live";
export type PaidPlanId = "pro" | "power";

export function paypalEnv(): PayPalEnv {
  return process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
}

function baseUrl(): string {
  return paypalEnv() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

/**
 * PAYPAL_PLAN_PRO / PAYPAL_PLAN_POWER may be comma separated: the first id is
 * sold to new subscribers, the rest are older plans (e.g. a previous price)
 * that existing subscribers are still on.
 */
function planIds(plan: PaidPlanId): string[] {
  const raw = plan === "pro" ? process.env.PAYPAL_PLAN_PRO : process.env.PAYPAL_PLAN_POWER;
  return (raw ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => {
      if (/^P-[A-Z0-9]+$/.test(id)) return true;
      if (id) {
        console.error(
          `PAYPAL_PLAN_${plan.toUpperCase()} is not a plan id (expected "P-..."). Check for a repeated variable name.`
        );
      }
      return false;
    });
}

export function planForPayPalId(planId: string): PaidPlanId | null {
  if (planIds("pro").includes(planId)) return "pro";
  if (planIds("power").includes(planId)) return "power";
  return null;
}

export function checkoutPlanId(plan: PaidPlanId): string | null {
  return planIds(plan)[0] ?? null;
}

/** True when billing can run at all on this deployment. */
export function isBillingConfigured(): boolean {
  // Guard against sandbox keys reaching the public production site, where
  // anyone could "buy" a plan with fake money.
  if (process.env.VERCEL_ENV === "production" && paypalEnv() !== "live") return false;

  return Boolean(
    process.env.PAYPAL_CLIENT_ID &&
      process.env.PAYPAL_CLIENT_SECRET &&
      checkoutPlanId("pro") &&
      checkoutPlanId("power") &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/** Soft launch: only ADMIN_EMAILS accounts can see and use checkout. */
export function isBillingAdminOnly(): boolean {
  return process.env.BILLING_ADMIN_ONLY === "true";
}

/** Whether the public can buy a plan (drives legal and pricing copy). */
export function isBillingPublic(): boolean {
  return isBillingConfigured() && !isBillingAdminOnly();
}

export class PayPalError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown
  ) {
    super(message);
  }
}

let token: { value: string; expires: number; key: string } | null = null;

async function accessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PayPal credentials are not configured.");

  const key = `${paypalEnv()}:${id}`;
  if (token && token.key === key && token.expires > Date.now()) return token.value;

  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new PayPalError("PayPal authentication failed.", res.status, null);

  const data = (await res.json()) as { access_token: string; expires_in: number };
  token = {
    key,
    value: data.access_token,
    expires: Date.now() + Math.max(0, data.expires_in - 60) * 1000,
  };
  return token.value;
}

async function request<T>(method: "GET" | "POST", path: string, body?: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) {
    // Spell out PayPal's reason: logged objects collapse to "[Object]".
    const info = data as {
      name?: string;
      details?: { field?: string; issue?: string }[];
      debug_id?: string;
    } | null;
    const reasons = (info?.details ?? [])
      .map((d) => [d.field, d.issue].filter(Boolean).join(" "))
      .join("; ");
    throw new PayPalError(
      `PayPal ${method} ${path} failed: ${res.status} ${info?.name ?? ""}` +
        (reasons ? ` (${reasons})` : "") +
        (info?.debug_id ? ` debug_id=${info.debug_id}` : ""),
      res.status,
      data
    );
  }
  return data as T;
}

export function getSubscription(id: string): Promise<PayPalSubscription> {
  return request<PayPalSubscription>("GET", `/v1/billing/subscriptions/${encodeURIComponent(id)}`);
}

export async function createSubscription(opts: {
  planId: string;
  userId: string;
  email: string | null;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; approvalUrl: string }> {
  const data = await request<{ id: string; links?: { rel: string; href: string }[] }>(
    "POST",
    "/v1/billing/subscriptions",
    JSON.stringify({
      plan_id: opts.planId,
      // Set server-side and echoed back by PayPal: this is how a subscription
      // is tied to an account. Never taken from the browser.
      custom_id: opts.userId,
      ...(opts.email ? { subscriber: { email_address: opts.email } } : {}),
      application_context: {
        brand_name: "Promhance",
        user_action: "SUBSCRIBE_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: opts.returnUrl,
        cancel_url: opts.cancelUrl,
      },
    })
  );

  const approvalUrl = data.links?.find((l) => l.rel === "approve")?.href;
  if (!approvalUrl) throw new Error("PayPal did not return an approval link.");
  return { id: data.id, approvalUrl };
}

export async function cancelSubscription(id: string, reason: string): Promise<void> {
  await request(
    "POST",
    `/v1/billing/subscriptions/${encodeURIComponent(id)}/cancel`,
    JSON.stringify({ reason: reason.slice(0, 128) })
  );
}

export type PayPalSale = {
  id: string;
  state: string;
  billing_agreement_id?: string;
  amount?: { total?: string; currency?: string };
  create_time?: string;
};

export function getSale(id: string): Promise<PayPalSale> {
  return request<PayPalSale>("GET", `/v1/payments/sale/${encodeURIComponent(id)}`);
}

/**
 * Asks PayPal whether a webhook delivery is genuine. The event is spliced in as
 * the raw received text: re-serialising it can break the signature check.
 */
export async function verifyWebhook(headers: Headers, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const fields = {
    auth_algo: headers.get("paypal-auth-algo"),
    cert_url: headers.get("paypal-cert-url"),
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_sig: headers.get("paypal-transmission-sig"),
    transmission_time: headers.get("paypal-transmission-time"),
    webhook_id: webhookId,
  };
  if (!webhookId || Object.values(fields).some((v) => !v)) return false;

  const head = JSON.stringify(fields).slice(0, -1);
  const result = await request<{ verification_status?: string }>(
    "POST",
    "/v1/notifications/verify-webhook-signature",
    `${head},"webhook_event":${rawBody}}`
  );
  return result.verification_status === "SUCCESS";
}
