import { createServerSupabaseClient } from "./server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Validates a client-supplied anonymous device id. */
export function parseAnonId(value: unknown): string | null {
  return isValidUuid(value) ? value : null;
}

/**
 * Resolves the authenticated user id from the request's session cookie.
 * Returns null for anonymous visitors or when auth is not configured.
 */
export async function resolveUserId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
