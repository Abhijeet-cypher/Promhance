/**
 * Promhance API configuration and shared wire types.
 *
 * The extension talks to the hosted Next.js app. For local development, set
 * `WXT_API_BASE=http://localhost:3000` (e.g. in `extension/.env.local`) before
 * running `npm run dev`/`build`. WXT exposes env vars prefixed with `WXT_` via
 * `import.meta.env`.
 */

export const API_BASE =
  (import.meta.env.WXT_API_BASE as string | undefined) || "https://www.promhance.com";

export type EnhanceRequest = {
  prompt: string;
  mode: string;
  intensity: string;
  anonId: string;
};

export type EnhanceResponse = {
  enhanced?: string;
  prompt_id?: string | null;
  version_number?: number | null;
  error?: string;
};

export type EnhanceResult =
  | { ok: true; enhanced: string; promptId: string | null }
  | { ok: false; error: string; rateLimited?: boolean };
