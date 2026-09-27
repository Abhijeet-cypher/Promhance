-- Promhance: speed up history search.
-- Run in the Supabase SQL Editor. Safe to re-run.
--
-- /api/prompts?q= filters with `ilike '%term%'`, which cannot use a normal
-- btree index. Trigram GIN indexes make those lookups index-assisted as the
-- prompts table grows.

create extension if not exists pg_trgm;

create index if not exists prompts_original_trgm_idx
  on public.prompts using gin (original_prompt gin_trgm_ops);

create index if not exists prompts_enhanced_trgm_idx
  on public.prompts using gin (enhanced_prompt gin_trgm_ops);
