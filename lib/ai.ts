import { GoogleGenAI } from "@google/genai";

/** Shared Gemini model used across the app. */
export const GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

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
