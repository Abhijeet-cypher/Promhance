/**
 * Stable anonymous identity for the extension.
 *
 * Mirrors the web app's `lib/anon-id.ts` so prompts enhanced from the extension
 * can be claimed into a user's history after they sign in on promhance.com.
 * Stored in `chrome.storage.local` so it survives browser restarts.
 */

import { storage } from "wxt/utils/storage";

const ANON_ID_KEY = "local:promhance_anon_id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

let cached: string | null = null;

export async function getAnonId(): Promise<string> {
  if (cached) return cached;

  const existing = await storage.getItem<string>(ANON_ID_KEY);
  if (existing && UUID_RE.test(existing)) {
    cached = existing;
    return existing;
  }

  const id = generateUuid();
  await storage.setItem(ANON_ID_KEY, id);
  cached = id;
  return id;
}
