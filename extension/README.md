# Promhance Extension

A [WXT](https://wxt.dev)-based browser extension that injects a Grammarly-style
floating widget next to the prompt box on **ChatGPT, Claude, Gemini, Midjourney
and Copilot (Bing)**. Type a rough prompt, click the Promhance button, and the
enhanced prompt replaces your input.

Promhance is free — no login is required. Prompts are attributed with a random
device ID (stored in `chrome.storage.local`) that mirrors the web app's
`anon-id`, so they can be claimed into your history later if you sign in.

## Requirements

- Node.js 20+ (Node 18 fails the WXT toolchain).
- The Promhance app deployed at `https://www.promhance.com` (or a local dev
  server — see below).

## Pointing at localhost vs production

The extension's background worker calls the API base from `lib/api.ts`, which
defaults to **production** (`https://www.promhance.com`). For local testing:

```bash
cp .env.example .env.local       # sets WXT_API_BASE=http://localhost:3001
npm run dev
```

With `WXT_API_BASE` set, all requests go to the local Next.js dev server
(`npm run dev` in the repo root). Unset it (or delete `.env.local`) to talk to
production. The `http://localhost:3000/*` and `http://localhost:3001/*` host
permissions are already declared in `wxt.config.ts`.

> Note: rebuild/reload the extension after changing `.env.local` — the value is
> inlined at build time.

## Development

```bash
npm install
npm run dev          # Chrome, opens a browser with the extension loaded
npm run dev:firefox  # Firefox
```

For a manual load, build and point Chrome's "Load unpacked" at
`.output/chrome-mv3`.

## Build / package

```bash
npm run build         # .output/chrome-mv3
npm run zip           # store-ready zip
npm run build:firefox
npm run zip:firefox
npm run compile       # tsc --noEmit
```

Icons are generated from the brand mark by `scripts/generate-icons.mjs`
(pure Node, no image deps) into `public/icon/`.

## Architecture

| Path | Role |
| --- | --- |
| `entrypoints/background.ts` | Service worker. Proxies `ENHANCE_PROMPT` messages to `POST /api/enhance` (avoids host-page CSP) and attaches the anon ID. |
| `entrypoints/promhance.content/` | Content script: finds the prompt input, renders the floating trigger + widget inside a Shadow Root (style-isolated), and writes the enhanced text back. |
| `entrypoints/popup/` | Toolbar popup: default enhancement depth + a link to the web app. |
| `lib/platforms.ts` | Platform registry: URL matches, input selectors, default mode. Add new platforms here. |
| `lib/inputs.ts` | Read/write helpers for `<textarea>` and contenteditable editors. |
| `lib/api.ts` | API base URL + wire types. |
| `lib/messages.ts` | Content ↔ background message types. |
| `lib/anon-id.ts` | Stable device ID stored via WXT storage. |

## Backend

The extension reuses the existing Next.js endpoints and relies on CORS support
added in `lib/cors.ts` (which only echoes `chrome-extension://` /
`moz-extension://` origins). No new backend endpoints are needed for the MVP.

## Adding a platform

1. Add an entry to `PLATFORMS` in `lib/platforms.ts` (matches, input selectors,
   default mode).
2. Add the host to `host_permissions` and the content-script `matches` in
   `wxt.config.ts` / `entrypoints/promhance.content/index.tsx`.

## Not in the MVP

Side panel, streaming PromAI chat, quick-action refinements, history sync, auth,
and Web Store publishing.
