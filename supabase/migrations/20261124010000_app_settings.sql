-- Promhance: runtime feature switches (admin-controlled)
-- Run in the Supabase SQL Editor. RLS is on with no policies, so only the
-- service role (used by the server routes) can read or write.
--
-- Key in use: 'quota_enforcement' → {"enabled": true|false}. Missing row = off.

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.app_settings enable row level security;
