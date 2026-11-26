/**
 * Creates the PayPal product, the monthly Pro/Power plans and (optionally) the
 * webhook, then prints the lines to add to your environment variables.
 *
 *   node --env-file=.env.local scripts/paypal-setup.mjs
 *   node --env-file=.env.local scripts/paypal-setup.mjs --webhook https://host/api/billing/webhook
 *   node --env-file=.env.local scripts/paypal-setup.mjs --webhook <url> --webhook-only
 *
 * Uses PAYPAL_ENV (default sandbox), PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET.
 * Add --daily (sandbox only) for plans that renew every day, to test renewals.
 * Live requires the extra --live flag. Every plan run creates NEW plans, so run
 * it once per environment. Prices are read from lib/plans.ts.
 */
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const live = process.env.PAYPAL_ENV === "live";
const webhookOnly = args.includes("--webhook-only");
// Sandbox only: charge every day so renewals can be tested without waiting a month.
const daily = args.includes("--daily");
const webhookAt = args.indexOf("--webhook");
const webhookUrl = webhookAt === -1 ? null : args[webhookAt + 1];

function die(message) {
  console.error(message);
  process.exit(1);
}

const { PAYPAL_CLIENT_ID: id, PAYPAL_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) die("Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET first.");
if (live && daily) die("--daily is for sandbox testing only.");
if (live && !args.includes("--live")) die("PAYPAL_ENV=live: re-run with --live to confirm.");
if (webhookAt !== -1 && !webhookUrl?.startsWith("https://")) die("--webhook needs an https:// URL.");
if (webhookOnly && !webhookUrl) die("--webhook-only needs --webhook <url>.");

const base = live ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

const auth = await fetch(`${base}/v1/oauth2/token`, {
  method: "POST",
  headers: {
    Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: "grant_type=client_credentials",
});
if (!auth.ok) die(`Authentication failed (${auth.status}). Do the keys match ${live ? "live" : "sandbox"}?`);
const { access_token: token } = await auth.json();

async function post(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) die(`${path} failed (${res.status}):\n${JSON.stringify(data, null, 2)}`);
  return data;
}

function price(plan) {
  const source = readFileSync(new URL("../lib/plans.ts", import.meta.url), "utf8");
  const match = source.match(new RegExp(`id: "${plan}",[\\s\\S]*?priceMonthly: ([0-9.]+)`));
  if (!match) die(`Could not read the ${plan} price from lib/plans.ts.`);
  return Number(match[1]).toFixed(2);
}

const lines = [];

if (!webhookOnly) {
  const product = await post("/v1/catalogs/products", {
    name: "Promhance subscription",
    description: "AI prompt enhancement",
    type: "SERVICE",
    category: "SOFTWARE",
  });

  for (const [plan, name] of [["pro", "Pro"], ["power", "Power"]]) {
    const value = price(plan);
    const created = await post("/v1/billing/plans", {
      product_id: product.id,
      name: `Promhance ${name} (${daily ? "daily test" : "monthly"})`,
      billing_cycles: [
        {
          frequency: { interval_unit: daily ? "DAY" : "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // 0 = renews until cancelled
          pricing_scheme: { fixed_price: { value, currency_code: "USD" } },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        // Suspend after this many consecutive failed charges.
        payment_failure_threshold: 2,
      },
    });
    console.log(`Created ${name} plan at $${value}/${daily ? "day" : "month"}`);
    lines.push(`PAYPAL_PLAN_${plan.toUpperCase()}=${created.id}`);
  }
}

if (webhookUrl) {
  const webhook = await post("/v1/notifications/webhooks", {
    url: webhookUrl,
    event_types: [
      "BILLING.SUBSCRIPTION.ACTIVATED",
      "BILLING.SUBSCRIPTION.UPDATED",
      "BILLING.SUBSCRIPTION.CANCELLED",
      "BILLING.SUBSCRIPTION.SUSPENDED",
      "BILLING.SUBSCRIPTION.EXPIRED",
      "BILLING.SUBSCRIPTION.RE-ACTIVATED",
      "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
      "PAYMENT.SALE.COMPLETED",
      "PAYMENT.SALE.REFUNDED",
      "PAYMENT.SALE.REVERSED",
    ].map((name) => ({ name })),
  });
  lines.push(`PAYPAL_WEBHOOK_ID=${webhook.id}`);
}

console.log(`\nAdd to your ${live ? "LIVE" : "sandbox"} environment variables.`);
console.log('Replace the whole existing line, so the name is not repeated after "=":\n');
console.log(lines.join("\n"));
