const ANON_ID_KEY = "promhance_anon_id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cached: string | null = null;

/**
 * Returns a stable device id for anonymous users.
 *
 * Persisted in localStorage, so it survives tab close and browser restart.
 * It is only lost on cache clear, incognito, or a different device/browser —
 * exactly the identity we attach to prompts before a user signs up.
 */
export function getAnonId(): string {
  if (cached) return cached;

  if (typeof window === "undefined") return "";

  try {
    const existing = window.localStorage.getItem(ANON_ID_KEY);
    if (existing && UUID_RE.test(existing)) {
      cached = existing;
      return existing;
    }

    const id = generateUuid();
    window.localStorage.setItem(ANON_ID_KEY, id);
    cached = id;
    return id;
  } catch {
    // localStorage unavailable (private mode, blocked storage) — use an
    // ephemeral id so the current session still works.
    cached = generateUuid();
    return cached;
  }
}
