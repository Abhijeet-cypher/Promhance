import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "./supabase/server";

/**
 * Admin access is granted by an email allowlist. Set `ADMIN_EMAILS` to a
 * comma-separated list of account emails (case-insensitive). Everything under
 * /admin and /api/admin is gated on this check — there is no client-trusted
 * role, and the check always runs server-side against the session cookie.
 */

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = getAdminEmails();
  if (list.length === 0) return false;
  return list.includes(email.trim().toLowerCase());
}

export type AdminCheck =
  | { admin: true; userId: string; email: string }
  | { admin: false; reason: "not_configured" | "unauthenticated" | "forbidden" };

/**
 * Resolves the current admin, if any. Always run this server-side.
 * `not_configured` means the allowlist env var is empty.
 */
export async function getAdmin(): Promise<AdminCheck> {
  if (getAdminEmails().length === 0) {
    return { admin: false, reason: "not_configured" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { admin: false, reason: "not_configured" };
  }

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    return { admin: false, reason: "unauthenticated" };
  }

  if (!isAdminEmail(user.email)) {
    return { admin: false, reason: "forbidden" };
  }

  return { admin: true, userId: user.id, email: user.email ?? "" };
}

type AdminGuard =
  | { ok: true; userId: string; email: string }
  | { ok: false; response: NextResponse };

/**
 * Route-handler guard. Returns a ready-to-return error response when the
 * caller is not an admin, otherwise the admin's identity.
 */
export async function adminOrError(): Promise<AdminGuard> {
  const check = await getAdmin();

  if (check.admin) {
    return { ok: true, userId: check.userId, email: check.email };
  }

  const status =
    check.reason === "unauthenticated" ? 401 : check.reason === "forbidden" ? 403 : 503;
  const message =
    check.reason === "not_configured"
      ? "The admin dashboard is not configured."
      : check.reason === "unauthenticated"
        ? "Sign in required."
        : "Forbidden.";

  return { ok: false, response: NextResponse.json({ error: message }, { status }) };
}
