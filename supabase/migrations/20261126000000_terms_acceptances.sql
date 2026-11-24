-- Promhance: record of Terms of Service / Privacy Policy acceptances
-- Run in the Supabase SQL Editor. RLS is on with no policies, so only the
-- service role (used by /api/consent) can read or write.
--
-- One row per person per terms version, so there is evidence of who agreed to
-- what, when, and where. Anonymous visitors are keyed by their anon device id;
-- once they sign in, a later row ties the same version to their user id.

create table if not exists public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  anon_id uuid,
  version text not null,
  -- Where the agreement was given: 'signup' / 'signup_google' (ticked the
  -- "I agree" box), 'enhance_notice' (used the tool after being shown the
  -- "By enhancing you agree..." line), or 'login_sync' (an earlier acceptance
  -- linked to an account).
  source text not null,
  accepted_at timestamptz not null default now(),
  ip text,
  user_agent text
);

create index if not exists terms_acceptances_user_idx
  on public.terms_acceptances (user_id, version);
create index if not exists terms_acceptances_anon_idx
  on public.terms_acceptances (anon_id, version);

alter table public.terms_acceptances enable row level security;
