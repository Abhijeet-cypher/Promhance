-- Promhance: Pro survey responses
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- Stores responses to the "would you pay for advanced features?" survey that
-- is emailed to subscribed users (served at /survey).
--
-- Identity model matches the rest of the app: every row carries anon_id
-- (always) and user_id (nullable, set when the respondent is signed in).

create table if not exists public.survey_responses (
  id                     uuid primary key default gen_random_uuid(),
  created_at             timestamptz not null default now(),

  -- Q1. How often do you use Promhance?
  usage_frequency        text not null,

  -- Q2. What would you most like us to add? (multi-select; ids from the app)
  desired_features       jsonb not null default '[]'::jsonb,
  desired_features_other text,

  -- Q3. What would make you most likely to use Promhance regularly?
  regular_use_reason     text,

  -- Q4. If Promhance Pro was $1.99/month, how likely would you be to subscribe?
  price_likelihood       text not null,

  -- Q5. Anything else you'd like us to know?
  additional_notes       text,

  -- Identity / provenance
  anon_id                uuid not null,
  user_id                uuid references auth.users(id) on delete set null,
  user_agent             text,
  metadata               jsonb not null default '{}'::jsonb,

  constraint survey_usage_frequency_check
    check (usage_frequency in ('first_time', 'monthly', 'weekly', 'daily')),
  constraint survey_price_likelihood_check
    check (price_likelihood in ('definitely', 'probably', 'not_sure', 'probably_not', 'definitely_not'))
);

create index if not exists survey_responses_created_at_idx
  on public.survey_responses (created_at desc);

create index if not exists survey_responses_usage_frequency_idx
  on public.survey_responses (usage_frequency);

create index if not exists survey_responses_price_likelihood_idx
  on public.survey_responses (price_likelihood);

create index if not exists survey_responses_user_created_idx
  on public.survey_responses (user_id, created_at desc);

create index if not exists survey_responses_anon_created_idx
  on public.survey_responses (anon_id, created_at desc);

alter table public.survey_responses enable row level security;

comment on table public.survey_responses is 'Responses to the Pro pricing / advanced-features survey shared by email.';

-- RLS is enabled with no anon policies. The app only writes through the
-- server API route using the service role key (which bypasses RLS), so the
-- public anon key cannot read or write responses.
