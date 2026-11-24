import type { User } from "@supabase/supabase-js";

/**
 * Version of the Terms of Service + Privacy Policy that users agree to.
 * Keep it equal to the "Last Updated" date on /terms and /privacy. Bumping it
 * asks everyone to agree again before their next enhancement.
 */
export const TERMS_VERSION = "2026-11-24";

/**
 * Where an agreement was given (stored with the record):
 *  - signup / signup_google: ticked the "I agree" box when creating an account (strongest)
 *  - enhance_notice: used the tool after being shown the "By enhancing you agree..." line
 *  - login_sync: an earlier agreement linked to an account after sign-in
 */
export const CONSENT_SOURCES = ["enhance_notice", "signup", "signup_google", "login_sync"] as const;
export type ConsentSource = (typeof CONSENT_SOURCES)[number];

const STORAGE_KEY = "promhance_terms_accepted_version";

/** Has this browser agreed to the current terms? */
export function hasLocalConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === TERMS_VERSION;
  } catch {
    return false;
  }
}

export function setLocalConsent(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, TERMS_VERSION);
  } catch {
    // Storage unavailable: the server record and account flag still exist.
  }
}

/** Has this signed-in account agreed to the current terms (saved on the account itself)? */
export function userHasConsent(user: User | null | undefined): boolean {
  return user?.user_metadata?.terms_version === TERMS_VERSION;
}

/** Writes the agreement to the server-side record. Best effort: never throws. */
export async function recordConsent(source: ConsentSource, anonId: string): Promise<void> {
  try {
    await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: TERMS_VERSION, source, anonId }),
    });
  } catch {
    // The local flag and account metadata still hold the agreement.
  }
}
