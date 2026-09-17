# AGENTS.md

Promhance — a Next.js app that enhances rough prompts into engineered prompts via Google Gemini. Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4.

## Commands

- `npm install` — use npm (a `package-lock.json` is committed).
- `npm run dev` — dev server on http://localhost:3000
- `npm run build` / `npm start`
- `npm run lint` — ESLint flat config (`eslint`, no args)
- No test runner and no typecheck script exist. For types, run `npx tsc --noEmit`.

## Environment

- `/api/enhance` requires `GEMINI_API_KEY` in `.env.local`; without it the route returns HTTP 500. `.env*` is gitignored.

## Architecture

- `app/api/enhance/route.ts` — the only API route. Single **non-streaming** Gemini call (model string `gemini-3.1-flash-lite-preview`). All mode/intensity system prompts live here. Note: `README.md` is stale and claims `gemini-2.5-flash` + streaming.
- `components/PromptEnhancer.tsx` — the core client tool, reused by every landing page via a `defaultMode` prop. Keep its `MODES` list in sync with the route's `switch`: it currently includes `"Marketing"`, which has no case in the route and silently falls through to `General`.
- Path alias `@/*` maps to the repo root (not `src/`).

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

## Styling

- Tailwind v4 is CSS-first: no `tailwind.config`; theme tokens and custom animations live in `app/globals.css` (`@import "tailwindcss"`, `@theme inline`).
- Reuse existing design tokens/utilities (`bg-[#111111]`, `text-[#a1a1a1]`, `.animate-fade-in-up`, `.btn-shimmer`) to stay consistent with the dark, blue-accent theme.
- `next.config.ts` redirects apex `promhance.com` to `www.promhance.com`.
