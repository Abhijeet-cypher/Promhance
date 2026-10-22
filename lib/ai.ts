import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";

/** Primary Gemini model used across the app. */
export const GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

/**
 * Free-tier fallback with a high requests-per-day (RPD) limit. Used when the
 * primary model is overloaded (HTTP 503 / UNAVAILABLE) or rate-limited.
 */
export const GEMINI_FALLBACK_MODEL = "gemini-2.5-flash-lite";

/** Upper bound for a single Gemini request so a hung call cannot pin a function. */
const REQUEST_TIMEOUT_MS = 45_000;

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
  if (status === 429 || status === 503 || status === 404) return true;

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
    "503",
    "429",
    "404",
    "is not found",
    "no longer available",
    "deprecated",
  ].some((needle) => message.includes(needle));
}

/**
 * Models tried in order (all have a free tier). Gemini 503s ("high demand")
 * often hit a whole model family at once, so the chain spans several families
 * and ends on the older high-RPD 2.5 Flash-Lite instead of relying on one fallback.
 */
const MODEL_CHAIN = [
  GEMINI_MODEL,
  "gemini-3.1-flash-lite", // stable build of the primary; separate capacity from the preview
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
  GEMINI_FALLBACK_MODEL,
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs `call` against each model in the chain, moving on whenever the failure
 * is transient (overloaded, rate-limited, model gone). Non-retryable errors
 * and the last model's error are thrown to the caller.
 */
async function runWithModelChain<T>(
  requestedModel: string,
  call: (model: string) => Promise<T>
): Promise<T> {
  // Start from the requested model, then continue down the chain.
  const models = [requestedModel, ...MODEL_CHAIN.filter((m) => m !== requestedModel)];
  let lastError: unknown;

  for (let i = 0; i < models.length; i++) {
    try {
      return await call(models[i]);
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
  const params = withTimeout(rawParams);
  return runWithModelChain(params.model, (model) =>
    ai.models.generateContent({ ...params, model })
  );
}

/**
 * Streaming variant of {@link generateContentWithFallback}. Falls back when the
 * initial stream request fails to start (errors mid-stream are not retried).
 */
export async function generateContentStreamWithFallback(
  ai: GoogleGenAI,
  rawParams: GenerateContentParameters
) {
  // Streams stay open for the whole answer, so allow a longer ceiling.
  const params = withTimeout(rawParams, STREAM_TIMEOUT_MS);
  return runWithModelChain(params.model, (model) =>
    ai.models.generateContentStream({ ...params, model })
  );
}
