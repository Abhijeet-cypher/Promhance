-- Promhance: Deep Research quota
-- Run in the Supabase SQL Editor AFTER 20261124000000_subscriptions_usage.sql.
--
-- Adds a `research` counter to usage_counters and replaces consume_quota /
-- refund_quota with versions that understand kind = 'research'
-- (counted against p_research_limit only; the route reserves a normal
-- enhancement unit separately).

alter table public.usage_counters
  add column if not exists research integer not null default 0;

-- Old 6-argument signature is replaced by the 7-argument one below.
drop function if exists public.consume_quota(text, text, text, integer, integer, integer);

create or replace function public.consume_quota(
  p_owner text,
  p_period text,
  p_kind text,
  p_total_limit integer,
  p_detail_limit integer,
  p_refine_limit integer,
  p_research_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.usage_counters;
begin
  if p_kind not in ('basic', 'detail', 'refine', 'research') then
    raise exception 'invalid quota kind: %', p_kind;
  end if;

  insert into public.usage_counters (owner_key, period)
  values (p_owner, p_period)
  on conflict do nothing;

  -- The UPDATE takes a row lock, so concurrent callers serialize here.
  update public.usage_counters u
  set total    = u.total    + case when p_kind in ('basic', 'detail') then 1 else 0 end,
      detail   = u.detail   + case when p_kind = 'detail' then 1 else 0 end,
      refine   = u.refine   + case when p_kind = 'refine' then 1 else 0 end,
      research = u.research + case when p_kind = 'research' then 1 else 0 end,
      updated_at = now()
  where u.owner_key = p_owner
    and u.period = p_period
    and (
      (p_kind = 'refine' and u.refine < p_refine_limit)
      or (p_kind = 'research' and u.research < p_research_limit)
      or (p_kind = 'basic' and u.total < p_total_limit)
      or (p_kind = 'detail'
          and u.total < p_total_limit
          and (p_detail_limit is null or u.detail < p_detail_limit))
    )
  returning * into rec;

  if found then
    return jsonb_build_object(
      'allowed', true, 'total', rec.total, 'detail', rec.detail,
      'refine', rec.refine, 'research', rec.research
    );
  end if;

  select * into rec
  from public.usage_counters
  where owner_key = p_owner and period = p_period;

  return jsonb_build_object(
    'allowed', false, 'total', rec.total, 'detail', rec.detail,
    'refine', rec.refine, 'research', rec.research
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
  set total    = greatest(0, u.total    - case when p_kind in ('basic', 'detail') then 1 else 0 end),
      detail   = greatest(0, u.detail   - case when p_kind = 'detail' then 1 else 0 end),
      refine   = greatest(0, u.refine   - case when p_kind = 'refine' then 1 else 0 end),
      research = greatest(0, u.research - case when p_kind = 'research' then 1 else 0 end),
      updated_at = now()
  where u.owner_key = p_owner and u.period = p_period;
$$;

revoke all on function public.consume_quota(text, text, text, integer, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_quota(text, text, text, integer, integer, integer, integer)
  to service_role;
-- refund_quota keeps its signature; grants from the first migration still apply.
