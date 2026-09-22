-- Promhance: prompt versioning
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- AFTER the initial migration (20250917000000_init_auth_prompts_feedback.sql).
--
-- Every enhancement ("prompt") now owns an ordered list of versions:
--   v1      = the initial enhancement (action = 'base')
--   v2, v3… = quick-action refinements of the previous version
--
-- prompts.enhanced_prompt is kept as a cache of the latest version so the
-- existing flat-list code and copy paths keep working unchanged.

create table if not exists public.prompt_versions (
  id             uuid primary key default gen_random_uuid(),
  prompt_id      uuid not null references public.prompts(id) on delete cascade,
  version_number int  not null,
  text           text not null,
  action         text,
  action_label   text,
  created_at     timestamptz not null default now(),

  constraint prompt_versions_number_check check (version_number >= 1),
  unique (prompt_id, version_number)
);

create index if not exists prompt_versions_prompt_idx
  on public.prompt_versions (prompt_id, version_number);

alter table public.prompt_versions enable row level security;

comment on table public.prompt_versions is 'Ordered refinements of a prompt. v1 is the initial enhancement; v2+ are quick-action refinements.';

-- Backfill: every existing prompt's enhanced_prompt becomes its v1.
insert into public.prompt_versions (prompt_id, version_number, text, action, created_at)
select id, 1, enhanced_prompt, 'base', created_at
from public.prompts
on conflict (prompt_id, version_number) do nothing;

-- RLS is enabled with no anon policies. The app only touches this table
-- through server API routes using the service role key (which bypasses RLS).
