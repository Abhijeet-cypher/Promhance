-- Promhance: remember which prompts used Deep Research
-- Run in the Supabase SQL Editor.
--
-- prompts.research_used is true when the enhancement was built on a Deep
-- Research brief (the research step ran and succeeded). A run where research
-- failed and fell back to a normal enhancement stays false, and its research
-- credit is refunded. The research notes themselves are not stored.

alter table public.prompts
  add column if not exists research_used boolean not null default false;

-- Lets the admin Prompts view filter on it quickly.
create index if not exists prompts_research_used_idx
  on public.prompts (created_at desc)
  where research_used;
