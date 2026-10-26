import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";

/**
 * Primary Gemini model used across the app: the cheapest current stable Flash-Lite
 * ($0.25 in / $1.50 out per 1M tokens). gemini-2.5-flash-lite is closed to new
 * users (404), so don't use it.
 */
export const GEMINI_MODEL = "gemini-3.1-flash-lite";

/** Preview build of the 3.1 Flash-Lite model, tried after the stable ones. */
const GEMINI_PREVIEW_MODEL = "gemini-3.1-flash-lite-preview";

/**
 * Per-attempt ceiling for a non-streaming request. Kept well under the route's
 * maxDuration so a hung model fails fast and the next model in the chain still
 * gets a turn, instead of one slow call eating the whole budget.
 */
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * The primary normally answers in ~4s, so give it a shorter leash: a stalled
 * primary should hand over to the next model quickly, not after 20s+.
 */
const PRIMARY_TIMEOUT_MS = 12_000;

/** Total time the fallback chain may spend on a non-streaming request. */
const CHAIN_BUDGET_MS = 54_000;

/** Don't start another attempt with less than this left in the budget. */
const MIN_ATTEMPT_MS = 4_000;

/** Applies the default request timeout unless the caller already set one. */
function withTimeout(
  params: GenerateContentParameters,
  timeoutMs = REQUEST_TIMEOUT_MS
): GenerateContentParameters {
  if (params.config?.httpOptions?.timeout) return params;
  return {
    ...params,
    config: {
      ...params.config,
      httpOptions: { ...params.config?.httpOptions, timeout: timeoutMs },
    },
  };
}

/** Long default: chat answers can stream for a while. */
const STREAM_TIMEOUT_MS = 120_000;

let client: GoogleGenAI | null = null;

/**
 * Returns a singleton GoogleGenAI client, or null when GEMINI_API_KEY is
 * not configured. Callers should surface a clear error to the user.
 */
export function getGoogleGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

/**
 * Returns true when an error is transient and worth retrying on a fallback
 * model — e.g. the primary model is overloaded or we have hit a rate limit.
 */
export function isRetryableModelError(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  // 404 covers a preview model that has been renamed or retired.
  // 500/502/504 cover upstream hiccups and DEADLINE_EXCEEDED timeouts.
  if (status && [404, 429, 500, 502, 503, 504].includes(status)) return true;

  const message = String(
    (error as { message?: string } | null)?.message ?? error ?? ""
  ).toLowerCase();

  return [
    "unavailable",
    "high demand",
    "overloaded",
    "resource_exhausted",
    "rate limit",
    "try again later",
    "deadline",
    "timeout",
    "timed out",
    "aborted",
    "fetch failed",
    "econnreset",
    "internal",
    "503",
    "504",
    "429",
    "404",
    "is not found",
    "no longer available",
    "deprecated",
  ].some((needle) => message.includes(needle));
}

/**
 * Models tried in order. Gemini 503s ("high demand") often hit a whole model
 * family at once, so the chain spans families, using older stable models that
 * are checked to work with this API key (2.5/2.0 Flash-Lite are closed to new
 * users and the 3.6/3.8 Flash models are pricier, so they are left out).
 */
const MODEL_CHAIN = [
  GEMINI_MODEL,
  GEMINI_PREVIEW_MODEL, // separate capacity from the stable build
  "gemini-2.5-flash", // previous generation, separate capacity pool
  "gemini-3-flash-preview",
  "gemini-3.5-flash-lite",
];

/**
 * 2.5 Flash thinks by default and bills that as output, which is slow and
 * unnecessary for prompt rewriting; switch thinking off for it.
 */
function tuneForModel(params: GenerateContentParameters, model: string): GenerateContentParameters {
  if (model !== "gemini-2.5-flash") return { ...params, model };
  return {
    ...params,
    model,
    config: { ...params.config, thinkingConfig: { thinkingBudget: 0 } },
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs `call` against each model in the chain, moving on whenever the failure
 * is transient (overloaded, rate-limited, model gone). Non-retryable errors
 * and the last model's error are thrown to the caller.
 */
async function runWithModelChain<T>(
  requestedModel: string,
  call: (model: string, timeoutMs: number) => Promise<T>,
  {
    attemptMs,
    primaryMs = attemptMs,
    budgetMs,
  }: { attemptMs: number; primaryMs?: number; budgetMs: number }
): Promise<T> {
  // Start from the requested model, then continue down the chain.
  const models = [requestedModel, ...MODEL_CHAIN.filter((m) => m !== requestedModel)];
  const deadline = Date.now() + budgetMs;
  let lastError: unknown;

  for (let i = 0; i < models.length; i++) {
    const remaining = deadline - Date.now();
    // Out of budget: surface the last real error rather than a new timeout.
    if (i > 0 && remaining < MIN_ATTEMPT_MS) break;

    try {
      return await call(models[i], Math.max(MIN_ATTEMPT_MS, Math.min(i === 0 ? primaryMs : attemptMs, remaining)));
    } catch (error) {
      lastError = error;
      if (!isRetryableModelError(error) || i === models.length - 1) throw error;
      console.warn(
        `Model "${models[i]}" unavailable; retrying with "${models[i + 1]}".`,
        error instanceof Error ? error.message : error
      );
      // Brief pause so a momentary spike can clear before the next attempt.
      await sleep(400);
    }
  }
  throw lastError;
}

/**
 * Calls `generateContent`, transparently falling back through {@link MODEL_CHAIN}
 * when a model is overloaded or rate-limited.
 */
export async function generateContentWithFallback(
  ai: GoogleGenAI,
  rawParams: GenerateContentParameters
) {
  return runWithModelChain(
    rawParams.model,
    (model, timeoutMs) =>
      ai.models.generateContent(tuneForModel(withTimeout(rawParams, timeoutMs), model)),
    { attemptMs: REQUEST_TIMEOUT_MS, primaryMs: PRIMARY_TIMEOUT_MS, budgetMs: CHAIN_BUDGET_MS }
  );
}

/**
 * Streaming variant of {@link generateContentWithFallback}. Falls back when the
 * initial stream request fails to start (errors mid-stream are not retried).
 */
export async function generateContentStreamWithFallback(
  ai: GoogleGenAI,
  rawParams: GenerateContentParameters,
  timeouts: { primaryMs?: number; attemptMs?: number; budgetMs?: number } = {}
) {
  const { attemptMs = STREAM_TIMEOUT_MS, primaryMs = attemptMs, budgetMs = Number.POSITIVE_INFINITY } =
    timeouts;
  return runWithModelChain(
    rawParams.model,
    (model, timeoutMs) =>
      ai.models.generateContentStream(tuneForModel(withTimeout(rawParams, timeoutMs), model)),
    { attemptMs, primaryMs, budgetMs }
  );
}
