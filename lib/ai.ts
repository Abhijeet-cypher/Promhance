import { generateText, streamText, type LanguageModel, type ModelMessage } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";

/**
 * Model + provider wiring for the whole app, built on the Vercel AI SDK (`ai`).
 * Switching provider/model later is a config change here, not an app-wide
 * rewrite: add the matching `@ai-sdk/*` provider, build it below, and point
 * {@link MODEL_CHAIN} at new model ids. Route handlers only speak the SDK's
 * provider-neutral `generateText` / `streamText` API.
 */

/** Primary model. `deepseek-flash` is the current V4.1 Flash alias. */
export const AI_MODEL = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-flash";

/** Extra models tried, in order, when the primary is overloaded or rate-limited. */
const MODEL_CHAIN = uniqueModels([
  AI_MODEL,
  "deepseek-v4-flash",
  "deepseek-v4-pro",
]);

/** Per-attempt ceiling for a non-streaming request. */
const REQUEST_TIMEOUT_MS = 20_000;

/** The primary normally answers quickly, so give it a shorter leash. */
const PRIMARY_TIMEOUT_MS = 12_000;

/** Total time the fallback chain may spend on a non-streaming request. */
const CHAIN_BUDGET_MS = 54_000;

/** Don't start another attempt with less than this left in the budget. */
const MIN_ATTEMPT_MS = 4_000;

/** Long default: chat answers can stream for a while. */
const STREAM_TIMEOUT_MS = 120_000;

/**
 * DeepSeek thinking mode is on by default for V4 models, which bills the
 * reasoning tokens as output and slows prompt rewriting down. The whole app
 * wants plain answers, so it is disabled for every call (see
 * {@link providerOptionsForCall}). Set `DEEPSEEK_THINKING=enabled` to opt in.
 */
const THINKING_DISABLED = (process.env.DEEPSEEK_THINKING ?? "disabled").toLowerCase() !== "enabled";

function uniqueModels(models: (string | undefined)[]): string[] {
  return [...new Set(models.filter((m): m is string => !!m && m.trim().length > 0))];
}

let deepseek: ReturnType<typeof createDeepSeek> | null = null;

/**
 * Returns the DeepSeek provider factory, or null when DEEPSEEK_API_KEY is not
 * configured. Callers surface a clear error to the user in that case.
 */
function getDeepSeek(): ReturnType<typeof createDeepSeek> | null {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  if (!deepseek) {
    deepseek = createDeepSeek({
      apiKey,
      baseURL: process.env.DEEPSEEK_BASE_URL?.trim() || undefined,
    });
  }
  return deepseek;
}

/** True when a provider key is available; lets routes fail fast. */
export function isConfigured(): boolean {
  return getDeepSeek() !== null;
}

/** Single provider-options blob shared by every call to keep thinking off. */
function providerOptionsForCall() {
  return THINKING_DISABLED
    ? { deepseek: { thinking: { type: "disabled" as const } } }
    : undefined;
}

/**
 * Returns true when an error is transient and worth retrying on a fallback
 * model — e.g. the model is overloaded, we hit a rate limit, or the id is gone.
 */
export function isRetryableModelError(error: unknown): boolean {
  const status = error as { statusCode?: number; status?: number } | null;
  const code = status?.statusCode ?? status?.status;
  if (code && [404, 429, 500, 502, 503, 504].includes(code)) return true;

  const message = String(
    (error as { message?: string } | null)?.message ?? error ?? ""
  ).toLowerCase();

  return [
    "unavailable",
    "high demand",
    "overloaded",
    "resource_exhausted",
    "rate limit",
    "rate_limit",
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
    "model_not_found",
    "is not found",
    "no longer available",
    "deprecated",
  ].some((needle) => message.includes(needle));
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs `build` against each model in the chain, moving on whenever the failure
 * is transient (overloaded, rate-limited, model gone). Non-retryable errors
 * and the last model's error are thrown to the caller.
 */
async function runWithModelChain<T>(
  requestedModel: string,
  build: (model: LanguageModel, timeoutMs: number) => Promise<T>,
  { attemptMs, primaryMs = attemptMs, budgetMs }: { attemptMs: number; primaryMs?: number; budgetMs: number }
): Promise<T> {
  const provider = getDeepSeek();
  if (!provider) throw new Error("DEEPSEEK_API_KEY is not configured.");

  const models = uniqueModels([requestedModel, ...MODEL_CHAIN]);
  const deadline = Date.now() + budgetMs;
  let lastError: unknown;

  for (let i = 0; i < models.length; i++) {
    const remaining = deadline - Date.now();
    // Out of budget: surface the last real error rather than a new timeout.
    if (i > 0 && remaining < MIN_ATTEMPT_MS) break;

    const timeoutMs = Math.max(MIN_ATTEMPT_MS, Math.min(i === 0 ? primaryMs : attemptMs, remaining));
    try {
      return await build(provider(models[i]), timeoutMs);
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

/** Provider-neutral parameters shared by both call helpers. */
export type CompletionParams = {
  instructions?: string;
  messages: ModelMessage[];
  temperature?: number;
  abortSignal?: AbortSignal;
};

/** Applies the optional system instruction only when one is provided. */
function promptParams(params: CompletionParams) {
  return {
    ...(params.instructions ? { instructions: params.instructions } : {}),
    messages: params.messages,
  };
}

/**
 * Non-streaming completion with automatic fallback across {@link MODEL_CHAIN}.
 * Resolves to the generated text.
 */
export async function generateCompletion(params: CompletionParams): Promise<string> {
  return runWithModelChain(
    AI_MODEL,
    async (model, timeoutMs) => {
      const { text } = await generateText({
        model,
        ...promptParams(params),
        temperature: params.temperature,
        providerOptions: providerOptionsForCall(),
        abortSignal: params.abortSignal,
        maxRetries: 0,
        timeout: timeoutMs,
      });
      return text;
    },
    { attemptMs: REQUEST_TIMEOUT_MS, primaryMs: PRIMARY_TIMEOUT_MS, budgetMs: CHAIN_BUDGET_MS }
  );
}

/**
 * Streaming variant of {@link generateCompletion}. The returned iterable yields
 * text deltas as they arrive; a failure to *start* the request falls back to
 * the next model (errors mid-stream are not retried).
 */
export async function generateCompletionStream(
  params: CompletionParams
): Promise<AsyncIterable<string>> {
  const result = await runWithModelChain(
    AI_MODEL,
    async (model, timeoutMs) => {
      const stream = streamText({
        model,
        ...promptParams(params),
        temperature: params.temperature,
        providerOptions: providerOptionsForCall(),
        abortSignal: params.abortSignal,
        maxRetries: 0,
        timeout: timeoutMs,
      });
      // Pull the first delta to force the request to start; a bad key/model
      // surfaces here so the chain can fall back instead of failing mid-stream.
      const iterator = stream.textStream[Symbol.asyncIterator]();
      const first = await iterator.next();
      return { first, iterator };
    },
    { attemptMs: STREAM_TIMEOUT_MS, primaryMs: STREAM_TIMEOUT_MS, budgetMs: Number.POSITIVE_INFINITY }
  );

  return (async function* textDeltas() {
    if (!result.first.done) yield result.first.value;
    for (;;) {
      const next = await result.iterator.next();
      if (next.done) break;
      yield next.value;
    }
  })();
}
