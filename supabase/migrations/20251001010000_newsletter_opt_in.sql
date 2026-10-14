-- Promhance: newsletter opt-in column
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- For now the newsletter preference lives on profiles (one boolean per user).
-- A dedicated subscribers table (for non-account emails) can be added later.
--
-- Existing users default to opted in (true). New sign-ups can pass
-- newsletter_opt_in in their auth metadata; when absent it defaults to true.

alter table public.profiles
  add column if not exists newsletter_opt_in boolean not null default true;

comment on column public.profiles.newsletter_opt_in is
  'Whether the user receives the Promhance newsletter. Defaults to true; users can opt out at /unsubscribe or via the sign-in form.';

-- Re-create the signup trigger so a new user's newsletter preference (passed
-- through auth metadata on sign-up) is respected instead of always defaulting.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, newsletter_opt_in)
  values (
    new.id,
    new.email,
    case
      when new.raw_user_meta_data->>'newsletter_opt_in' = 'false' then false
      else true
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
