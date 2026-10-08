-- Promhance: admin analytics functions
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- The admin dashboard needs grouped/time-series aggregates (per-day counts,
-- mode breakdowns, geographic distribution, per-user totals). PostgREST caps
-- responses at 1000 rows and has no GROUP BY, so aggregation lives in SQL and
-- is exposed via RPC.
--
-- These functions read auth.users (for signups), so they are SECURITY DEFINER
-- with a pinned search_path. EXECUTE is revoked from anon/authenticated and
-- granted only to service_role — the admin API routes call them server-side.

-- ─────────────────────────────────────────────────────────────
-- Headline totals for the overview cards
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_overview_totals()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'totalUsers',      (select count(*) from auth.users),
    'totalProfiles',   (select count(*) from public.profiles),
    'totalPrompts',    (select count(*) from public.prompts),
    'totalVersions',   (select count(*) from public.prompt_versions),
    'totalRefinements',(select count(*) from public.prompt_versions where action is distinct from 'base'),
    'totalFeedback',   (select count(*) from public.feedback),
    'totalSurvey',     (select count(*) from public.survey_responses),
    'newsletterSubs',  (select count(*) from public.profiles where newsletter_opt_in is true),
    'promptsToday',    (select count(*) from public.prompts where created_at >= date_trunc('day', now())),
    'prompts7d',       (select count(*) from public.prompts where created_at >= now() - interval '7 days'),
    'prompts30d',      (select count(*) from public.prompts where created_at >= now() - interval '30 days'),
    'signups7d',       (select count(*) from auth.users where created_at >= now() - interval '7 days'),
    'signups30d',      (select count(*) from auth.users where created_at >= now() - interval '30 days'),
    'feedback7d',      (select count(*) from public.feedback where created_at >= now() - interval '7 days'),
    'active7d',        (select count(distinct coalesce(user_id::text, anon_id::text)) from public.prompts where created_at >= now() - interval '7 days'),
    'active30d',       (select count(distinct coalesce(user_id::text, anon_id::text)) from public.prompts where created_at >= now() - interval '30 days'),
    'anonPrompts',     (select count(*) from public.prompts where user_id is null),
    'authPrompts',     (select count(*) from public.prompts where user_id is not null)
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Daily time series (enhancements, signups, feedback, survey)
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_daily_series(p_days int default 30)
returns table (
  day      date,
  prompts  bigint,
  signups  bigint,
  feedback bigint,
  survey   bigint
)
language sql
security definer
set search_path = public
as $$
  with span as (
    select generate_series(
      (date_trunc('day', now()) - make_interval(days => greatest(p_days, 1) - 1))::date,
      date_trunc('day', now())::date,
      interval '1 day'
    )::date as day
  )
  select
    s.day,
    (select count(*) from public.prompts p          where p.created_at::date = s.day),
    (select count(*) from auth.users u              where u.created_at::date = s.day),
    (select count(*) from public.feedback f         where f.created_at::date = s.day),
    (select count(*) from public.survey_responses r where r.created_at::date = s.day)
  from span s
  order by s.day;
$$;

-- ─────────────────────────────────────────────────────────────
-- Mode + intensity distribution of enhancements
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_prompts_breakdown()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'modes', (
      select coalesce(jsonb_agg(jsonb_build_object('label', mode, 'count', count) order by count desc), '[]'::jsonb)
      from (
        select coalesce(mode, 'Unknown') as mode, count(*) as count
        from public.prompts group by 1
      ) m
    ),
    'intensities', (
      select coalesce(jsonb_agg(jsonb_build_object('label', intensity, 'count', count) order by count desc), '[]'::jsonb)
      from (
        select coalesce(intensity, 'Unknown') as intensity, count(*) as count
        from public.prompts group by 1
      ) i
    )
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Feedback reactions
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_reaction_breakdown()
returns table (reaction text, count bigint)
language sql
security definer
set search_path = public
as $$
  select reaction, count(*)
  from public.feedback
  group by reaction
  order by count desc;
$$;

-- ─────────────────────────────────────────────────────────────
-- Geographic distribution (from self-reported / inferred profiles)
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_country_breakdown()
returns table (country text, count bigint)
language sql
security definer
set search_path = public
as $$
  select coalesce(country, 'Unknown') as country, count(*)
  from public.profiles
  group by 1
  order by count desc;
$$;

-- ─────────────────────────────────────────────────────────────
-- Survey aggregates (frequency, price likelihood, feature popularity)
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_survey_breakdown()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'usage', (
      select coalesce(jsonb_agg(jsonb_build_object('label', usage_frequency, 'count', count) order by count desc), '[]'::jsonb)
      from (
        select usage_frequency, count(*) as count
        from public.survey_responses group by 1
      ) u
    ),
    'price', (
      select coalesce(jsonb_agg(jsonb_build_object('label', price_likelihood, 'count', count) order by count desc), '[]'::jsonb)
      from (
        select price_likelihood, count(*) as count
        from public.survey_responses group by 1
      ) p
    ),
    'features', (
      select coalesce(jsonb_agg(jsonb_build_object('label', feature, 'count', count) order by count desc), '[]'::jsonb)
      from (
        select feature, count(*) as count
        from public.survey_responses s,
             jsonb_array_elements_text(s.desired_features) as feature
        group by 1
      ) f
    )
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Paginated users table with per-user activity counts
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_users_page(
  p_limit  int,
  p_offset int,
  p_search text default null
)
returns table (
  id                uuid,
  email             text,
  display_name      text,
  country           text,
  country_source    text,
  newsletter_opt_in boolean,
  created_at        timestamptz,
  prompt_count      bigint,
  version_count     bigint,
  feedback_count    bigint,
  survey_count      bigint,
  last_active       timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    pr.id,
    pr.email,
    pr.display_name,
    pr.country,
    pr.country_source,
    pr.newsletter_opt_in,
    pr.created_at,
    (select count(*) from public.prompts p where p.user_id = pr.id),
    (select count(*) from public.prompt_versions v
       join public.prompts p on p.id = v.prompt_id
      where p.user_id = pr.id),
    (select count(*) from public.feedback f where f.user_id = pr.id),
    (select count(*) from public.survey_responses s where s.user_id = pr.id),
    (select max(p.created_at) from public.prompts p where p.user_id = pr.id)
  from public.profiles pr
  where p_search is null
     or p_search = ''
     or pr.email ilike '%' || p_search || '%'
     or pr.display_name ilike '%' || p_search || '%'
  order by pr.created_at desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

-- ─────────────────────────────────────────────────────────────
-- Lock these down to the service role (the admin server routes).
-- ─────────────────────────────────────────────────────────────
revoke all on function public.admin_overview_totals()        from public, anon, authenticated;
revoke all on function public.admin_daily_series(int)        from public, anon, authenticated;
revoke all on function public.admin_prompts_breakdown()      from public, anon, authenticated;
revoke all on function public.admin_reaction_breakdown()     from public, anon, authenticated;
revoke all on function public.admin_country_breakdown()      from public, anon, authenticated;
revoke all on function public.admin_survey_breakdown()       from public, anon, authenticated;
revoke all on function public.admin_users_page(int, int, text) from public, anon, authenticated;

grant execute on function public.admin_overview_totals()        to service_role;
grant execute on function public.admin_daily_series(int)        to service_role;
grant execute on function public.admin_prompts_breakdown()      to service_role;
grant execute on function public.admin_reaction_breakdown()     to service_role;
grant execute on function public.admin_country_breakdown()      to service_role;
grant execute on function public.admin_survey_breakdown()       to service_role;
grant execute on function public.admin_users_page(int, int, text) to service_role;
