-- Promhance: PayPal recurring billing
-- Run in the Supabase SQL Editor AFTER 20261124000000_subscriptions_usage.sql.
--
-- subscriptions.environment : 'sandbox' | 'live'. A row only grants access when
--                             it matches the server's PAYPAL_ENV, so sandbox
--                             tests can never unlock a live deployment.
-- billing_payments          : one row per PayPal charge (and its refund state).
-- billing_events            : webhook delivery log, for support and debugging.
--
-- RLS is on with no policies: only the service role can read or write.

alter table public.subscriptions
  add column if not exists environment text not null default 'live';

create table if not exists public.billing_payments (
  id text primary key,                    -- PayPal sale id
  user_id uuid references auth.users (id) on delete set null,
  subscription_id text not null,
  environment text not null,
  status text not null,                   -- completed | partially_refunded | refunded | reversed | ...
  amount numeric(10, 2),
  currency text,
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists billing_payments_subscription_idx
  on public.billing_payments (subscription_id, paid_at desc);
create index if not exists billing_payments_user_idx
  on public.billing_payments (user_id, paid_at desc);

create table if not exists public.billing_events (
  id text primary key,                    -- PayPal webhook event id
  event_type text not null,
  resource_id text,
  environment text not null,
  error text,                             -- null = processed successfully
  received_at timestamptz not null default now()
);

alter table public.billing_payments enable row level security;
alter table public.billing_events enable row level security;
