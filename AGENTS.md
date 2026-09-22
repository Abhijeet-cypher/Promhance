# AGENTS.md

Promhance — a Next.js app that enhances rough prompts into engineered prompts via Google Gemini. Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4.

## Commands

- `npm install` — use npm (a `package-lock.json` is committed).
- `npm run dev` — dev server on http://localhost:3000
- `npm run build` / `npm start`
- `npm run lint` — ESLint flat config (`eslint`, no args)
- No test runner and no typecheck script exist. For types, run `npx tsc --noEmit`.

## Environment

- `/api/enhance` and `/api/prompts/refine` require `GEMINI_API_KEY` in `.env.local`; without it they return HTTP 500. `.env*` is gitignored.
- Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) power auth + persistence. Without them, history/refinements are disabled but enhancement still works.

## Architecture

- API routes (all `runtime = "nodejs"`):
  - `app/api/enhance/route.ts` — initial enhancement. Single **non-streaming** Gemini call (model string `gemini-3.1-flash-lite-preview`). Persists the prompt and its v1 version.
  - `app/api/prompts/route.ts` — GET history / single prompt (with versions), DELETE.
  - `app/api/prompts/refine/route.ts` — applies a quick-action refinement to a prompt, stores the next version.
  - `app/api/promai/route.ts` — PromAI chat. **Streaming** `text/plain` response (answer mode = assistant persona; test mode = run the prompt as-is). Ephemeral, no persistence. Uses `lib/ai.ts`.
  - `app/api/feedback/route.ts`, `app/api/auth/claim/route.ts` — feedback + anonymous-history claiming after sign-in.
  - Note: `README.md` is stale and claims `gemini-2.5-flash` + streaming.
- `lib/ai.ts` — shared `GoogleGenAI` client (`getGoogleGenAI()`) + `GEMINI_MODEL` constant, used by `/api/promai`.
- `lib/prompt-modes.ts` — mode + intensity system instructions (shared by enhance & refine). `lib/quick-actions.ts` — per-mode refinement actions (`id`/`label`/`instruction`), shared by the refine route and the client.
- `components/PromptEnhancer.tsx` — the core client tool, reused by every landing page via a `defaultMode` prop. Keep its `MODES` list in sync with `lib/prompt-modes.ts` and the quick-action sets (both `Marketing` and all modes have entries). Its output header has a "Try it" button that deep-links to `/promai?test=<prompt>`.
- `components/PromaiChat.tsx` + `app/promai/page.tsx` — PromAI chat UI/page (Ask + Test modes, streaming).
- Path alias `@/*` maps to the repo root (not `src/`).

## Prompt versioning & refinements

- `prompts` = one enhancement (original + latest enhanced + mode + intensity + identity). `prompt_versions` = ordered refinements: v1 is the initial enhancement (`action = 'base'`), v2+ are quick-action refinements. `prompts.enhanced_prompt` is a cache of the latest version.
- Migration: `supabase/migrations/20250922000000_prompt_versions.sql` (creates the table + backfills existing prompts as v1). Run it in the Supabase SQL Editor.
- Refinements are linear and refine the version the user is viewing (`from_version`), not always the base.
- If `prompt_versions` is missing, `/api/prompts` synthesizes v1 from `enhanced_prompt`, so history keeps working.
- Identity/ownership: service-role routes; a row is owned when `user_id` matches the session or `anon_id` matches with `user_id IS NULL`.

## Viral prompts data (two sources — only one is live)

- Live: `viral_prompts_structured.json`, imported by `lib/viral-prompts-data.ts` (type in `lib/viral-prompts-types.ts`). `app/viral-prompts/page.tsx` reads `allPrompts` from there.
- Dead: `lib/parse-viral-prompts.ts` and `VIRAL_PROMPTS_PROMHANCE_COLLECTION.txt` are unused. Editing the `.txt` does **not** change the page.

## Blog

- Posts are Markdown in `content/blog/*.md` with gray-matter frontmatter (`title`, `date`, `description`, `author`, `tags[]`, `image`, optional `faqSchema`).
- `lib/markdown.ts` renders Markdown to HTML and injects heading `id`s for TOC anchors. `.md` is stripped from the slug.
- `app/blog/[slug]/page.tsx` uses Next 15+ async route params (`params: Promise<{ slug: string }>`); await them.

## SEO conventions

- Every route exports `metadata` and inlines JSON-LD (`application/ld+json`). Follow existing page patterns when adding routes.
- `app/sitemap.ts` hardcodes static routes and `lastModified` dates — add new top-level pages there manually; blog posts are appended automatically.
- `public/llms.txt` and `public/llms-full.txt` are the GEO/AEO discovery files (llmstxt.org spec) — keep the tool/guide links and FAQs in sync when adding pages or posts.
- `app/robots.ts` explicitly allows search + AI crawlers (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, etc.); all disallow `/api/`.
- IndexNow key `4ec819a7ef58c72476f4947dc3a953f6` is served at `public/4ec819a7ef58c72476f4947dc3a953f6.txt`. To request indexing on Bing/Yandex/DuckDuckGo after publish, POST or GET the changed URLs, e.g. `https://api.indexnow.org/indexnow?url=https://www.promhance.com/&key=4ec819a7ef58c72476f4947dc3a953f6`. There is no deploy hook wired up yet.

## Styling

- Tailwind v4 is CSS-first: no `tailwind.config`; theme tokens and custom animations live in `app/globals.css` (`@import "tailwindcss"`, `@theme inline`).
- Reuse existing design tokens/utilities (`bg-[#111111]`, `text-[#a1a1a1]`, `.animate-fade-in-up`, `.btn-shimmer`) to stay consistent with the dark, blue-accent theme.
- `next.config.ts` redirects apex `promhance.com` to `www.promhance.com`.
