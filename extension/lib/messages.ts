/**
 * Custom messaging protocol between the content script and the background
 * service worker. Keeping the API call in the background avoids host-page CSP
 * restrictions and centralizes the API base URL.
 */

export type EnhanceMessage = {
  type: "ENHANCE_PROMPT";
  prompt: string;
  mode: string;
  intensity: string;
};

export type EnhanceMessageResponse =
  | { ok: true; enhanced: string; promptId: string | null }
  | { ok: false; error: string; rateLimited?: boolean };
