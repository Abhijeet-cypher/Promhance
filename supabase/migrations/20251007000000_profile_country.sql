-- Promhance: profile country
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- Adds a country to each profile so we can see where users are from.
-- The value is inferred from edge headers (Cloudflare CF-IPCountry or Vercel
-- x-vercel-ip-country) the first time a signed-in user's profile is read, and
-- can be corrected by the user on /profile (country_source = 'self').
--
-- country_source tracks provenance:
--   'inferred' — auto-detected from request headers
--   'self'     — chosen by the user (never overwritten automatically)

alter table public.profiles
  add column if not exists country text;

alter table public.profiles
  add column if not exists country_source text not null default 'inferred';

-- Collapse any unexpected value (e.g. from an older run) before adding the check.
update public.profiles
  set country_source = 'inferred'
  where country_source not in ('inferred', 'self');

alter table public.profiles
  drop constraint if exists profiles_country_source_check;

alter table public.profiles
  add constraint profiles_country_source_check
  check (country_source in ('inferred', 'self'));

comment on column public.profiles.country is
  'ISO-3166-1 alpha-2 country code (e.g. US, IN, GB). Inferred from edge headers or set by the user.';

comment on column public.profiles.country_source is
  'How country was determined: inferred from headers, or self-reported by the user.';
