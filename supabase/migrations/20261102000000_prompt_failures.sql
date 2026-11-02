-- Record failed enhancements alongside successful ones.
-- Failed rows have enhanced_prompt = '' and are hidden from user history.
alter table public.prompts
  add column if not exists status text not null default 'success',
  add column if not exists error_message text;

alter table public.prompts
  drop constraint if exists prompts_status_check;
alter table public.prompts
  add constraint prompts_status_check check (status in ('success', 'failed'));

create index if not exists prompts_status_created_idx
  on public.prompts (status, created_at desc);
