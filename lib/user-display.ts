import type { User } from "@supabase/supabase-js";

/**
 * How a signed-in user is shown in the UI. Everything comes from the auth
 * user's metadata: Google sign-in fills `full_name`/`name` and
 * `avatar_url`/`picture`, and a name saved on the profile page is stored as
 * `display_name` so it takes priority. Email sign-ups have neither, so they
 * fall back to the email's local part and an initial.
 */

function metaString(user: User | null | undefined, key: string): string {
  const value = user?.user_metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

/** The name from the identity provider (Google), or "" when there is none. */
export function getProviderName(user: User | null | undefined): string {
  const full = metaString(user, "full_name") || metaString(user, "name");
  if (full) return full;
  return [metaString(user, "given_name"), metaString(user, "family_name")]
    .filter(Boolean)
    .join(" ");
}

/** Name to show: a name the user set, else their Google name, else the email's local part. */
export function getDisplayName(user: User | null | undefined): string {
  const name = metaString(user, "display_name") || getProviderName(user);
  if (name) return name;
  const local = user?.email?.split("@")[0];
  return local || "Account";
}

/** Profile picture URL (https only), or null to fall back to an initial. */
export function getAvatarUrl(user: User | null | undefined): string | null {
  const url = metaString(user, "avatar_url") || metaString(user, "picture");
  return /^https:\/\//i.test(url) ? url : null;
}

export function getInitial(user: User | null | undefined): string {
  return getDisplayName(user).charAt(0).toUpperCase() || "U";
}
