import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";

/** Primary Gemini model used across the app. */
export const GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

/**
 * Free-tier fallback with a high requests-per-day (RPD) limit. Used when the
 * primary model is overloaded (HTTP 503 / UNAVAILABLE) or rate-limited.
 */
export const GEMINI_FALLBACK_MODEL = "gemini-2.5-flash-lite";

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
  if (status === 429 || status === 503) return true;

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
  ].some((needle) => message.includes(needle));
}

/**
 * Calls `generateContent` on the primary model and transparently retries with
 * the high-RPD fallback model when the primary is overloaded or rate-limited.
 */
export async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: GenerateContentParameters
) {
  try {
    return await ai.models.generateContent(params);
  } catch (error) {
    if (!isRetryableModelError(error) || params.model === GEMINI_FALLBACK_MODEL) {
      throw error;
    }
    console.warn(
      `Model "${params.model}" unavailable; retrying with fallback "${GEMINI_FALLBACK_MODEL}".`,
      error instanceof Error ? error.message : error
    );
    return ai.models.generateContent({ ...params, model: GEMINI_FALLBACK_MODEL });
  }
}

/**
 * Streaming variant of {@link generateContentWithFallback}. Retries on the
 * fallback model when the initial stream request fails to start.
 */
export async function generateContentStreamWithFallback(
  ai: GoogleGenAI,
  params: GenerateContentParameters
) {
  try {
    return await ai.models.generateContentStream(params);
  } catch (error) {
    if (!isRetryableModelError(error) || params.model === GEMINI_FALLBACK_MODEL) {
      throw error;
    }
    console.warn(
      `Model "${params.model}" unavailable for streaming; retrying with fallback "${GEMINI_FALLBACK_MODEL}".`,
      error instanceof Error ? error.message : error
    );
    return ai.models.generateContentStream({ ...params, model: GEMINI_FALLBACK_MODEL });
  }
}
