-- Promhance: initial schema (auth + prompts + feedback)
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- This is a single, from-scratch migration. It creates the final shape of
-- all tables — there is no separate "feedback" migration to run.
--
-- Identity model: every event row carries anon_id (always) and user_id
-- (nullable). Anonymous history is keyed by anon_id; signing in re-parents
-- only unclaimed (user_id IS NULL) rows to the account (append, not overwrite).

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- profiles — mirror of auth.users for display data
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- prompts — every enhancement, anonymous or authenticated
-- ─────────────────────────────────────────────────────────────
create table if not exists public.prompts (
  id              uuid primary key default gen_random_uuid(),
  anon_id         uuid not null,
  user_id         uuid references auth.users(id) on delete cascade,
  original_prompt text not null,
  enhanced_prompt text not null,
  mode            text,
  intensity       text,
  created_at      timestamptz not null default now()
);

create index if not exists prompts_user_created_idx
  on public.prompts (user_id, created_at desc);

create index if not exists prompts_anon_created_idx
  on public.prompts (anon_id, created_at desc);

-- Fast lookups for the claim step (unclaimed rows only).
create index if not exists prompts_anon_unclaimed_idx
  on public.prompts (anon_id)
  where user_id is null;

alter table public.prompts enable row level security;

comment on table public.prompts is 'Every prompt enhancement, tagged with a device anon_id and (when signed in) a user_id.';

-- ─────────────────────────────────────────────────────────────
-- feedback — references prompts and carries identity
-- ─────────────────────────────────────────────────────────────
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  reaction    text not null,
  comment     text,
  prompt_id   uuid references public.prompts(id) on delete set null,
  anon_id     uuid not null,
  user_id     uuid references auth.users(id) on delete cascade,
  page_path   text,
  user_agent  text,
  metadata    jsonb not null default '{}'::jsonb,
  status      text not null default 'new',

  constraint feedback_reaction_check check (reaction in ('great', 'meh', 'bad')),
  constraint feedback_status_check check (status in ('new', 'reviewed', 'archived'))
);

create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);

create index if not exists feedback_reaction_idx
  on public.feedback (reaction);

create index if not exists feedback_status_idx
  on public.feedback (status);

create index if not exists feedback_prompt_idx
  on public.feedback (prompt_id);

create index if not exists feedback_user_created_idx
  on public.feedback (user_id, created_at desc);

create index if not exists feedback_anon_created_idx
  on public.feedback (anon_id, created_at desc);

alter table public.feedback enable row level security;

comment on table public.feedback is 'Reaction + optional comment feedback, linked to the prompt it was given on.';

-- RLS is enabled on every table, with no anon policies. The app only
-- accesses these tables through server API routes using the service role
-- key (which bypasses RLS), so the public anon key cannot read or write.
