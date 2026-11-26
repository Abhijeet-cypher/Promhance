# Subscription limits — implementation plan

Status: **limits implemented; PayPal billing built (see docs/paypal-setup.md, which supersedes §6).** Every number lives in `PLAN_LIMITS` in `lib/plans.ts` — change them there (the `/pricing` copy in `PLANS` is separate and must be edited to match). Enforcement: `lib/quota.ts` + `lib/entitlements.ts`, migration `20261124000000_subscriptions_usage.sql` (run it in the Supabase SQL Editor; until then quota fails open). Anonymous = 10/month, no Detail, no refinements, plus a per-IP monthly ceiling of 3x. **Enforcement is OFF by default**: a master switch at `/admin/settings` (`app_settings` row `quota_enforcement`, migration `20261124010000_app_settings.sql`) must be turned on. While off, nothing is counted or blocked. Flip it only after billing works. Without billing, everyone signed in is Free until a `subscriptions` row exists.

## 1. Plan → limits (source: `PLAN_LIMITS` in `lib/plans.ts`)

| | Anonymous | Free | Pro ($4.99) | Power ($9.99) |
|---|---|---|---|---|
| Enhancements / month | 10 (see §3) | 30 | 300 | 1,000 |
| Detail Mode (`high` intensity) | 0 | 5 / month | included | included |
| Basic Mode (`low`/`medium`) | counts in total | counts in total | fair-use, counts in total | counts in total |
| Burst (per minute) | 5 | 5 | 15 | 30 |
| Save history | 24h local only | current behaviour (see §6) | full | full + library/export |
| Refinements (quick actions) | not allowed | 5/month | 60/month | 200/month |
| Processing priority | standard | standard | faster | priority |

"Unlimited Basic Mode" for Pro is a marketing promise bounded by the 300 total. Keep it honest: the total is the hard cap, fair-use is a soft guard (flag, don't block, accounts over ~3x median).

Open decisions (needs your call): does a refinement count as an enhancement? Proposal above gives refinements their own small bucket so Free users can't burn the whole quota on them. Which intensity is "Detail"? `INTENSITY_INSTRUCTIONS` has `low`, `medium` and a third level — treat `high` as Detail.

## 2. Identity — who owns a quota

Reuse existing ownership rules: `user_id` from `resolveUserId()` if signed in, else `anon_id` (`parseAnonId`). Quota key = `u:<user_id>` or `a:<anon_id>`.

`anon_id` is client-generated and trivially reset, so it is **not** a security boundary. Back it with the existing IP limiter (`enforceRateLimit`) and a lower anonymous cap. The real incentive: sign in to get the 30.

## 3. Data model (new migration `2026XXXX_subscriptions_usage.sql`)

```sql
create table subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  plan text not null check (plan in ('pro','power')),
  status text not null,                 -- active | past_due | canceled | trialing
  provider text not null,               -- 'stripe' | 'razorpay' | 'lemonsqueezy'
  provider_customer_id text,
  provider_subscription_id text unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  updated_at timestamptz default now()
);

create table usage_counters (
  owner_key text not null,              -- 'u:<uuid>' | 'a:<uuid>'
  period text not null,                 -- billing-period start, e.g. '2026-11-24'
  total int not null default 0,
  detail int not null default 0,
  refine int not null default 0,
  primary key (owner_key, period)
);
```

Absence of a `subscriptions` row (or a status not in active/trialing/past_due-grace) = Free. No row per free user.

**Atomic consume.** A Postgres function `consume_quota(owner_key, period, kind, total_limit, detail_limit, refine_limit)` does a single `insert ... on conflict do update ... where counter < limit returning` and returns allowed/remaining. This is the important part: counting rows in `prompts` and then checking is racy (two parallel requests both pass), and failed generations are stored in `prompts` too. Service-role only, EXECUTE revoked from anon/authenticated, as with the admin functions.

**Refunds.** If the model call fails (`persistFailure` path), call `refund_quota(...)` so users aren't charged for errors.

**Period.** Free/anonymous: calendar month (UTC). Paid: `current_period_start` from the subscription, so reset aligns with billing.

## 4. Enforcement point

All in the server — never trust the client or extension.

1. `lib/entitlements.ts` — `getEntitlements(userId)`: reads `subscriptions` (cache ~60s per instance), returns `{ plan, limits, periodStart }`.
2. `lib/quota.ts` — `consume(ownerKey, entitlements, kind)` wrapping the RPC; returns `{ ok, remaining, resetsAt }`.
3. `app/api/enhance/route.ts`: after body parsing and mode/intensity validation, **before** the Gemini call:
   - `kind = intensity === 'high' ? 'detail' : 'basic'`
   - Detail on a plan with `detailPerMonth === 0` → 402/403 `upgrade_required`.
   - Quota exhausted → HTTP **402** `{ error:'quota_exceeded', plan, limit, resetsAt, upgradeUrl:'/pricing' }`.
   - On any model failure → refund.
   - Keep `enforceRateLimit` (IP) in front; add per-identity burst using `PLAN_LIMITS[plan].perMinute`.
4. `app/api/prompts/refine/route.ts`: same, `kind='refine'`.
5. `/api/promai` (chat): not in the pricing table. Decide: free-tier chat cap (e.g. 20 msgs/day) or leave on IP limiter only. Recommend a small daily cap so chat isn't an unmetered model endpoint.
6. Dedupe: the `inFlight` map in enhance already collapses identical requests — consume quota once per job, not once per caller.

`GET /api/usage` returns `{ plan, used, limit, detailUsed, detailLimit, resetsAt }` for the UI (CORS-enabled for the extension via `lib/cors.ts`).

## 5. Client / extension UX

- `PromptEnhancer.tsx`: usage meter ("12 / 30 this month"), lock icon on Detail for Free with upsell, and handle 402 with an upgrade card instead of a generic error.
- Header account menu: plan badge + usage.
- `/profile`: current plan, usage, renewal date, "Manage billing" (provider portal).
- Extension: background worker already proxies `/api/enhance`; map 402 to a widget message linking `/pricing`. Extension is unreleased, so no compatibility burden — but it must send the session identity. Today it only sends an anon ID, so **extension users are always Anonymous/Free until auth is added** (cookies don't cross to `chrome-extension://`). Plan: a token handoff from the web app (`/api/extension/token`) later; until then, extension = anonymous limits.
- Admin dashboard: add plan and usage columns to Users; new SQL function for revenue/MRR in a later phase.

## 6. Billing

Pick a provider (recommendation: **Stripe** if you can invoice in your region; **Razorpay/Lemon Squeezy** if not — merchant-of-record handles VAT/GST, which matters for a $4.99 product).

- `POST /api/billing/checkout` → hosted checkout session (plan id → price id, `client_reference_id = user_id`). Requires sign-in.
- `POST /api/billing/webhook` → verifies signature, upserts `subscriptions` on created/updated/deleted and payment-failed events. **The webhook is the only writer of plan state.** Make it idempotent.
- `POST /api/billing/portal` → customer portal for cancel/upgrade/invoices.
- Failed payment: keep access during a 3–7 day `past_due` grace, then drop to Free.
- Downgrade: history beyond Free retention is kept read-only/hidden, not deleted.
- New env: provider secret, webhook secret, price ids. Document in `AGENTS.md`.

## 7. Rollout order

1. **Done:** plans config + `/pricing` (waitlist CTA → `/survey`).
2. Migration + `consume_quota`; `getEntitlements` returns Free for everyone. Enforce Free limits in **shadow mode** (log would-be blocks, don't block) for ~1 week to validate the numbers against real usage in the admin dashboard.
3. Turn on enforcement for Free + anonymous; ship usage meter and 402 UX.
4. Billing: checkout, webhook, portal; test in provider test mode.
5. Gate Pro/Power features one at a time (history, templates, preferences, variations, model-specific optimization, library/export). Several of these are net-new product work — don't sell them on `/pricing` as live until built.
6. Switch pricing CTAs from waitlist to checkout.

## 8. Risks

- Anonymous abuse by clearing `anon_id` → IP cap + low anon quota.
- Race conditions → atomic RPC only, never read-then-write.
- Model cost (DeepSeek): Power at 1,000/month × token cost should be checked against $9.99 before launch; Detail runs are the expensive ones.
- Feature promises on the pricing page (templates, library, variations, model-specific optimization) don't exist yet — roadmap them or soften the copy before charging.
- Webhook trust: verify signatures; never grant plans from client redirects.

## 9. Deep Research (beta, open to everyone)

Research step before enhancement, labelled **Beta** in the UI. Open to every user with monthly caps (`researchPerMonth` in `lib/plans.ts`): signed out 3, Free 5, Pro 15, Power 60. Signed-out visitors are also capped per IP (3x). Each run also uses one normal enhancement.

- **Always enforced**, even while the admin "plan limits" switch is off (it is the costliest feature). Admins (`ADMIN_EMAILS`) bypass the cap. Fails closed if usage storage is down.
- Needs migration `20261125000000_research_quota.sql` (run after `20261124000000`).
- Flow: `/api/enhance` with `research: true` -> `reserveResearch` -> `runResearch` (`lib/research.ts`, one DeepSeek call, 26s cap; no web search, so no sources yet; set `DEEPSEEK_RESEARCH_THINKING=enabled` for deeper but slower and costlier briefs) -> enhancement with the brief in the system instruction. Research failure refunds its credit and falls back to a normal enhancement; an enhancement failure refunds both.
- Research notes are returned to the UI but not stored in history.
- `GET /api/usage` tells the UI when the monthly allowance is used up.
- **Announcement modal** (`components/FeatureAnnouncementModal.tsx`): Deep Research (Beta) announcement plus, for signed-out visitors, the Google sign-in prompt. Signed-out visitors see it once per device; signed-in accounts see it once on first login (stored in `user_metadata.announcements_seen`). Change `ANNOUNCEMENT_ID` to announce something new.
