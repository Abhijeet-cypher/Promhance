import { createHmac, timingSafeEqual } from "node:crypto";

const BASE_URL = "https://www.promhance.com";

function getSecret(): string {
  return (
    process.env.NEWSLETTER_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  );
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Deterministic HMAC token for one-click unsubscribe links. The same token is
 * produced for a given email, so it can be regenerated when sending mail.
 * Returns an empty string when no secret is configured.
 */
export function createUnsubscribeToken(email: string): string {
  const secret = getSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(normalizeEmail(email)).digest("hex");
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = createUnsubscribeToken(email);
  if (!expected || !token) return false;

  const expectedBuf = Buffer.from(expected);
  const tokenBuf = Buffer.from(token);
  if (expectedBuf.length !== tokenBuf.length) return false;

  return timingSafeEqual(expectedBuf, tokenBuf);
}

/** Builds the full unsubscribe URL to include in outgoing newsletter emails. */
export function unsubscribeUrl(email: string): string {
  const params = new URLSearchParams({ email: normalizeEmail(email) });
  const token = createUnsubscribeToken(email);
  if (token) params.set("token", token);
  return `${BASE_URL}/unsubscribe?${params.toString()}`;
}
