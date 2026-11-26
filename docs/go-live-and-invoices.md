# Subscriptions: user scenarios, go-live, invoices

Setup details are in [paypal-setup.md](paypal-setup.md). The "Expected" column below comes from reading the code. Run each one in the sandbox before going live.

## 1. Before testing

- Start `npm run dev` **and** the ngrok tunnel, and keep both running.
- `.env.local` has `BILLING_ADMIN_ONLY=true`, so only `ADMIN_EMAILS` accounts see Subscribe buttons. Set it to `false` to test as a normal user.
- Use one sandbox **Personal** account as the buyer.
- After each scenario check `/profile` and the Supabase tables `subscriptions`, `billing_payments`, `billing_events`.

## 2. User scenarios

| # | User does | How to do it in sandbox | Expected |
|---|---|---|---|
| 1 | Visits signed out | Open `/pricing` in a private window | "Sign in to subscribe" |
| 2 | Buys Pro | Subscribe and approve | "Payment received", Pro, renewal date, one row in each table |
| 3 | Buys Power | Same, second test account | Power |
| 4 | Backs out at PayPal | Click cancel on PayPal's page | Back on `/pricing`, still Free |
| 5 | Closes the tab right after paying | Approve, close before the redirect finishes | Webhook activates the plan |
| 6 | PayPal is slow | Hard to force | "PayPal has not reported your payment yet… Do not pay again" |
| 7 | Pays twice in two tabs | Open checkout in two tabs, approve both | Older subscription cancelled, but **both charges taken**. Refund the older one by hand |
| 8 | Upgrades Pro to Power | Subscribe to Power while on Pro | Warning, Power charged in full, Pro cancelled |
| 9 | Starts an upgrade, then backs out | Cancel on PayPal's page | Stays on Pro |
| 10 | Wants Power to Pro | Open `/pricing` while on Power | "Manage plan"; cancel first, buy Pro after the end date |
| 11 | Cancels in the app | `/profile` > Cancel subscription | No more charges, access until the end date |
| 12 | Cancels inside PayPal | Buyer account > Automatic payments | `/profile` updates through the webhook |
| 13 | Re-buys the same plan before it ends | Try after 11 | Refused ("Your current plan") |
| 14 | Renewal succeeds | Daily test plans (`npm run paypal:setup -- --daily`) | Second payment row, new period, usage reset |
| 15 | Renewal fails | Break the buyer's funding source on a daily plan | 5 days of grace, then Free with "Your last payment failed" |
| 16 | Fails twice | Leave 15 unfixed | PayPal suspends the subscription |
| 17 | Gets a full refund | Refund from the sandbox business account | Free immediately, subscription cancelled |
| 18 | Gets a partial refund | Refund $1 | Plan unchanged |
| 19 | Files a chargeback | Hard to force | Access ends when PayPal reverses the payment. An open dispute changes nothing |
| 20 | Hits the monthly limit | Turn limits on at `/admin/settings` | A message saying the limit is reached and when it resets |
| 21 | Pays with a different PayPal email | Any buyer account | Works: the plan follows the Promhance account |
| 22 | Pays while your webhook is down | Stop ngrok, refund, restart | PayPal redelivers (retries for about 3 days) |
| 23 | Asks to delete their account | Manual | **Cancel in PayPal first**, or they keep being charged |

Careful: refunding a duplicate charge that belongs to the **same, current** subscription also ends its access, because a full refund of the latest charge is treated as "money returned".

## 3. Go live

1. **Confirm PayPal can take your money.** PayPal India does [not accept domestic payments](https://paypal.com/in/cshelp/article/can-i-use-paypal-to-receive-payments-from-indian-customers-help1049). If your account is Indian, only buyers outside India can pay. Also confirm with PayPal that subscriptions are enabled on your account.
2. **Do one clean sandbox purchase** (scenario 2) and see the rows appear in all three tables.
3. **Fix the pricing copy** so you only sell what exists:
   - "Access to supported AI platforms" refers to the browser extension, which is not released.
   - "Access to new Pro features" and "Early access to experimental features" have nothing behind them yet.
   - "Save prompt history" is listed under Pro, but Free users get it too.
4. **Create a PayPal live app** at developer.paypal.com (switch to Live) and copy the Client ID and Secret.
5. **Create live plans and the webhook** in a fresh PowerShell window, so `.env.local` stays sandbox:

   ```powershell
   $env:PAYPAL_ENV="live"; $env:PAYPAL_CLIENT_ID=Read-Host "Live client id"; $env:PAYPAL_CLIENT_SECRET=Read-Host "Live secret"
   ```

   ```powershell
   npm run paypal:setup -- --live --webhook https://www.promhance.com/api/billing/webhook
   ```

6. **Vercel > Settings > Environment Variables (Production):** `PAYPAL_ENV=live`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_PLAN_PRO`, `PAYPAL_PLAN_POWER`, `PAYPAL_WEBHOOK_ID`, `BILLING_ADMIN_ONLY=true`, `SITE_URL=https://www.promhance.com`. Check the Supabase variables and `ADMIN_EMAILS` are there too.
7. **Database:** make sure production Supabase has all migrations in `supabase/migrations/`.
8. **Deploy** (commit, push).
9. **Soft launch:** with your admin account, buy Pro using a different real PayPal account. Check the tables, cancel, refund.
10. **Open sales:** set `BILLING_ADMIN_ONLY=false`, redeploy.
11. **Turn on plan limits** at `/admin/settings`. While off, a paying user gets only the extra Deep Research runs.

**Roll back:** set `BILLING_ADMIN_ONLY=true` and redeploy. Keep the keys and webhook so existing subscribers keep working.

**Never replace a live plan id.** If you create new plans, set `PAYPAL_PLAN_PRO=NEW_ID,OLD_ID`. Dropping the old id means its subscribers' renewals are ignored.

**Known limit:** each IP address is capped at 10 enhancements a minute and 200 a day, whatever the plan. That is below Power's 30 a minute.

## 4. Invoices

**A PayPal invoice template does not send anything by itself.** And do **not** set up a PayPal *recurring invoice* for subscribers: an invoice asks for payment, so they could pay twice.

PayPal normally emails the buyer its own receipt for each subscription charge. Check that in your test. For your own branded invoice, use the steps below.

### Create the templates (once)

1. In your PayPal business account open **Invoicing**.
2. In its settings, add your business name, logo, address, `admin@promhance.com` and, if registered, your tax number.
3. Open **Templates** > **Create new template**.
4. Item: `Promhance Pro - monthly subscription`, quantity 1, price 4.99, currency USD.
5. Note to customer: `Thank you for subscribing to Promhance. This invoice is for a payment already received. No further payment is needed.`
6. Terms: `Renews monthly until cancelled. Cancel at https://www.promhance.com/profile. Refund policy: https://www.promhance.com/terms#refund-policy`
7. Save it as `Promhance Pro`.
8. Repeat for `Promhance Power` at 9.99.

Menu names can differ by country. See [PayPal's invoicing guide](https://www.paypal.com/us/brc/article/invoicing-create-professional-invoices).

### For each payment

1. Create an invoice from the matching template.
2. Add the customer's email, the payment date, and the PayPal transaction ID (the `id` in `billing_payments`).
3. Save it **without** emailing a payment request, then **mark it as paid** (record the payment).
4. Send the paid copy to the customer.

Try this on your own email first, to see exactly what the customer receives.

### Tax

If you are registered for GST in India, ask your accountant what an export-of-services invoice must carry (GSTIN, sequential invoice number, LUT wording, SAC code, exchange rate) before you use the template.

### Automating it

Doing this by hand is only workable for a few subscribers. The app can do it from the `PAYMENT.SALE.COMPLETED` webhook, either through PayPal's Invoicing API (create, then record as paid) or by emailing its own PDF through an email service. This is not built yet.
