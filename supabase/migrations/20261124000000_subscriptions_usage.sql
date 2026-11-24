-- Promhance: subscriptions + monthly usage quotas
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- subscriptions : one row per paying user. No row (or an inactive one) = Free.
--                 Written only by the billing webhook (service role).
-- usage_counters: per-identity, per-period counters. owner_key is
--                 'u:<user uuid>', 'a:<anon uuid>' or 'ip:<address>'.
-- consume_quota : atomic check-and-increment, so parallel requests can't both
--                 slip under the limit. refund_quota gives a unit back when
--                 the model call fails.
--
-- Both tables have RLS on with no policies: only the service role (which
-- bypasses RLS) can touch them. Functions are executable by service_role only.

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null check (plan in ('pro', 'power')),
  status text not null,
  provider text,
  provider_customer_id text,
  provider_subscription_id text unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_counters (
  owner_key text not null,
  period text not null,
  total integer not null default 0,
  detail integer not null default 0,
  refine integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (owner_key, period)
);

alter table public.subscriptions enable row level security;
alter table public.usage_counters enable row level security;

-- p_kind: 'basic' (total), 'detail' (total + detail), 'refine' (refine only).
-- A NULL p_detail_limit means "no separate detail cap".
create or replace function public.consume_quota(
  p_owner text,
  p_period text,
  p_kind text,
  p_total_limit integer,
  p_detail_limit integer,
  p_refine_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.usage_counters;
begin
  if p_kind not in ('basic', 'detail', 'refine') then
    raise exception 'invalid quota kind: %', p_kind;
  end if;

  insert into public.usage_counters (owner_key, period)
  values (p_owner, p_period)
  on conflict do nothing;

  -- The UPDATE takes a row lock, so concurrent callers serialize here.
  update public.usage_counters u
  set total  = u.total  + case when p_kind in ('basic', 'detail') then 1 else 0 end,
      detail = u.detail + case when p_kind = 'detail' then 1 else 0 end,
      refine = u.refine + case when p_kind = 'refine' then 1 else 0 end,
      updated_at = now()
  where u.owner_key = p_owner
    and u.period = p_period
    and (
      (p_kind = 'refine' and u.refine < p_refine_limit)
      or (p_kind = 'basic' and u.total < p_total_limit)
      or (p_kind = 'detail'
          and u.total < p_total_limit
          and (p_detail_limit is null or u.detail < p_detail_limit))
    )
  returning * into rec;

  if found then
    return jsonb_build_object(
      'allowed', true, 'total', rec.total, 'detail', rec.detail, 'refine', rec.refine
    );
  end if;

  select * into rec
  from public.usage_counters
  where owner_key = p_owner and period = p_period;

  return jsonb_build_object(
    'allowed', false, 'total', rec.total, 'detail', rec.detail, 'refine', rec.refine
  );
end;
$$;

create or replace function public.refund_quota(
  p_owner text,
  p_period text,
  p_kind text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.usage_counters u
  set total  = greatest(0, u.total  - case when p_kind in ('basic', 'detail') then 1 else 0 end),
      detail = greatest(0, u.detail - case when p_kind = 'detail' then 1 else 0 end),
      refine = greatest(0, u.refine - case when p_kind = 'refine' then 1 else 0 end),
      updated_at = now()
  where u.owner_key = p_owner and u.period = p_period;
$$;

revoke all on function public.consume_quota(text, text, text, integer, integer, integer)
  from public, anon, authenticated;
revoke all on function public.refund_quota(text, text, text)
  from public, anon, authenticated;
grant execute on function public.consume_quota(text, text, text, integer, integer, integer)
  to service_role;
grant execute on function public.refund_quota(text, text, text) to service_role;
