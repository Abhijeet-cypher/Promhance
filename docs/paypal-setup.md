# PayPal subscriptions: setup, testing, go-live

Monthly Pro ($4.99) and Power ($9.99) subscriptions that renew until cancelled.

## How it works

1. The buyer clicks Subscribe on `/pricing`. The server creates a PayPal subscription tagged with their account id and sends them to PayPal to approve it.
2. PayPal returns them to `/profile`, which asks the server to confirm. The server re-reads the subscription from PayPal.
3. Renewals, failures, cancellations and refunds arrive on `/api/billing/webhook`. Each one makes the server re-read from PayPal.
4. Access is granted only after PayPal reports a payment.

| Situation | What happens |
|---|---|
| Cancel (on `/profile` or in PayPal) | No more charges. Access lasts until the paid period ends. |
| Renewal payment fails | 5-day grace after the period ends, then Free until a payment succeeds. |
| 2 failures in a row | PayPal suspends the subscription. |
| Upgrade Pro to Power | Power charged in full now, Pro cancelled, no proration. |
| Switch Power to Pro | Cancel Power, subscribe to Pro after it ends. |
| Full refund or chargeback | Access ends and the subscription is cancelled. |
| Partial refund | Access unchanged. |

## 0. Check these before anything else (live account)

These depend on your account and country. Confirm them with PayPal; the code cannot.

- [ ] The business account can accept **subscriptions** (Pay & Get Paid > Subscriptions in the PayPal dashboard).
- [ ] **If the account is registered in India:** as far as we know, PayPal India only accepts payments from buyers **outside India**, so Indian customers could not subscribe. Ask PayPal support to confirm, and also ask about USD recurring billing, the export **purpose code**, and auto-withdrawal. If Indian buyers matter, you need a second provider (for example Razorpay).
- [ ] Look up the fees for your country. A fixed fee takes a noticeable share of a $4.99 charge.
- [ ] Ask your accountant about GST/VAT and invoicing. PayPal is not a merchant of record: sales tax is your responsibility.

## 1. Database

In the Supabase SQL Editor, run any of these not yet applied, in order:

1. `20261124000000_subscriptions_usage.sql`
2. `20261124010000_app_settings.sql`
3. `20261125000000_research_quota.sql`
4. `20261128000000_paypal_billing.sql` (new)

## 2. Sandbox setup

1. Go to <https://developer.paypal.com/dashboard/> and sign in with your PayPal business login. Switch the toggle to **Sandbox**.
2. **Apps & Credentials > Create App** (type: Merchant). Copy the Client ID and Secret.
3. **Testing Tools > Sandbox Accounts.** You get a *Business* (seller) and a *Personal* (buyer) account. The app must belong to the sandbox business account. Note the buyer's email and password. If your account is Indian, create the test buyer with a **non-India** country.
4. Add to `.env.local`:

   ```ini
   PAYPAL_ENV=sandbox
   PAYPAL_CLIENT_ID=...
   PAYPAL_CLIENT_SECRET=...
   BILLING_ADMIN_ONLY=false
   ```

5. Create the product and plans (once):

   ```powershell
   npm run paypal:setup
   ```

   Copy the printed `PAYPAL_PLAN_PRO` and `PAYPAL_PLAN_POWER` lines into `.env.local`.

6. Restart `npm run dev`. `/pricing` now shows Subscribe buttons and a "sandbox mode" banner.

### Webhooks on your own computer

PayPal cannot reach `localhost`, so open a public tunnel (leave it running):

```powershell
cloudflared tunnel --url http://localhost:3000
```

(Install with `winget install Cloudflare.cloudflared`, or use ngrok.) Then register the webhook with the URL it prints:

```powershell
npm run paypal:setup -- --webhook https://YOUR-TUNNEL.trycloudflare.com/api/billing/webhook --webhook-only
```

Add the printed `PAYPAL_WEBHOOK_ID` to `.env.local` and restart. The tunnel URL changes each run, so re-register (or edit the URL in the app's webhook list). Keep browsing the app on `http://localhost:3000`.

Checkout works without a webhook, because the return page confirms directly. Renewals, refunds and outside cancellations need it.

**Do not use the dashboard's Webhooks Simulator to judge success.** Its mock events cannot pass signature verification, so this app rejects them with 400 by design. Test with real sandbox actions.

### Shared database warning

If local development uses your production Supabase project, sandbox rows are tagged `sandbox` and never unlock the live site. Test with a separate account anyway, or better, a separate Supabase project.

## 3. Test checklist (sandbox)

Sign in to Promhance with a test account. At PayPal, log in as the sandbox **buyer**. Check results on `/profile`, in the Supabase tables `subscriptions`, `billing_payments`, `billing_events`, and in the app's webhook event log.

| # | Do this | Expect |
|---|---|---|
| 1 | Signed out, open `/pricing` | "Sign in to subscribe" |
| 2 | Subscribe to Pro, approve | `/profile` shows "Payment received", plan Pro, renewal date |
| 3 | Check tables (webhook on) | `status=active`, a `completed` payment row, events with no `error` |
| 4 | Click Subscribe, then cancel on PayPal's page | Back on `/pricing`, still Free, no row |
| 5 | Upgrade Pro to Power | Warning shown; plan Power; old subscription **Cancelled** in the sandbox buyer's PayPal |
| 6 | Cancel on `/profile` | "Access ends on ...", plan kept, PayPal shows Cancelled |
| 7 | Try to subscribe to the same plan again | Refused with the end date |
| 8 | New subscription, cancel it from the **buyer's PayPal** (Settings > Payments > Automatic payments) | Webhook updates `/profile` |
| 9 | Refund the payment in full from the **sandbox business** account | Plan drops to Free, subscription cancelled |
| 10 | Partial refund on another subscription | Plan unchanged |
| 11 | Open `/api/billing/subscription` signed out | No personal data |
| 12 | POST `/api/billing/webhook` with made-up JSON | 400 |
| 13 | Turn on limits at `/admin/settings`, use a Free and a Pro account | Free capped at 30, Pro at 300; Detail unlocked for Pro. Turn it off afterwards if not launching |
| 14 | Stop the tunnel, make a refund, restart it | PayPal redelivers; state catches up (or resend from the event log) |

To send a made-up event for test 12:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/billing/webhook -ContentType application/json -Body '{"id":"fake","event_type":"PAYMENT.SALE.COMPLETED"}'
```

### Renewals without waiting a month

Create **daily** sandbox plans, put their ids in `.env.local`, restart, and subscribe:

```powershell
npm run paypal:setup -- --daily
```

Next day expect a second `completed` row in `billing_payments`, a later `current_period_start`, and usage reset. PayPal's sandbox billing run can lag by hours. Put the monthly plan ids back afterwards.

### Failed payments

We found no documented way to force a declined renewal in the sandbox. The grace and suspension rules were checked with stubbed data only. To try it for real: use a daily plan, then before the next charge remove or break the sandbox buyer's funding source (and set its balance to zero). Treat the first real failed renewal in production as something to watch closely.

## 4. Preview deployment (optional, recommended)

In Vercel, add the sandbox variables to the **Preview** environment only. Never put sandbox keys in Production (the app refuses them there anyway). Preview URLs behind Vercel's deployment protection block PayPal's webhook, so use a branch domain with protection off, or rely on the local tunnel.

## 5. Go live

1. Finish section 0.
2. In the developer dashboard switch to **Live**, create a live app, copy its Client ID and Secret.
3. Create live plans and the webhook. In PowerShell, set the live values for this window only so `.env.local` stays sandbox (these override the file):

   ```powershell
   $env:PAYPAL_ENV="live"; $env:PAYPAL_CLIENT_ID=Read-Host "Live client id"; $env:PAYPAL_CLIENT_SECRET=Read-Host "Live secret"
   ```

   ```powershell
   npm run paypal:setup -- --live --webhook https://www.promhance.com/api/billing/webhook
   ```

   Close that window afterwards.
4. In Vercel > Settings > Environment Variables (**Production**): `PAYPAL_ENV=live`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_PLAN_PRO`, `PAYPAL_PLAN_POWER`, `PAYPAL_WEBHOOK_ID`, `BILLING_ADMIN_ONLY=true`, `SITE_URL=https://www.promhance.com`. Redeploy.
5. **Soft launch.** Only `ADMIN_EMAILS` accounts see checkout; everyone else sees the waitlist. Buy Pro with a **different** PayPal account (you cannot pay yourself), ideally a friend abroad if your account is Indian. Check the webhook log and tables, cancel, then refund. Fees may not be fully returned.
6. Launch: set `BILLING_ADMIN_ONLY=false`, redeploy (the pricing, terms and privacy text switch to "live"), then turn on plan limits at `/admin/settings`. Without limits, paying gives nothing extra.

**Roll back:** set `BILLING_ADMIN_ONLY=true` and redeploy to stop new sales. Keep the keys and webhook so existing subscribers keep renewing and can cancel.

## Operating notes

- **Deleting an account:** cancel the PayPal subscription **first**. Deleting the Supabase user removes the row but does not stop PayPal charging.
- **Refunds:** do them in the PayPal dashboard. A full refund of the latest charge revokes access automatically.
- **Logs:** search for `DOUBLE BILLING RISK` (an old subscription could not be cancelled) and look for `billing_events.error`.
- **Price change:** run the setup script again after editing `lib/plans.ts`, then set the variable to `NEW_ID,OLD_ID` so existing subscribers keep working. They stay on the old price.
