import { getSupabaseAdmin } from "@/lib/supabase/server";

const QUOTA_KEY = "quota_enforcement";

// Short cache: the toggle takes effect within this window on every instance
// (immediately on the instance that handled the admin's click).
const CACHE_TTL_MS = 10_000;
let cached: { enabled: boolean; expires: number } | null = null;

/**
 * Whether plan limits are enforced. Defaults to OFF: a missing table, missing
 * row or lookup error all mean "not enforced", so limits can never switch on
 * by accident.
 */
export async function isQuotaEnforced(): Promise<boolean> {
  if (cached && cached.expires > Date.now()) return cached.enabled;

  let enabled = false;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", QUOTA_KEY)
      .maybeSingle<{ value: { enabled?: unknown } }>();
    if (error) {
      console.error("Settings lookup failed:", error.message);
    } else {
      enabled = data?.value?.enabled === true;
    }
  }

  cached = { enabled, expires: Date.now() + CACHE_TTL_MS };
  return enabled;
}

/** Persists the toggle. Returns an error message on failure, otherwise null. */
export async function setQuotaEnforced(
  enabled: boolean,
  updatedBy: string
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return "Database is not configured.";

  const { error } = await supabase.from("app_settings").upsert({
    key: QUOTA_KEY,
    value: { enabled },
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  });
  if (error) {
    console.error("Settings update failed:", error.message);
    return "Could not save. Has the app_settings migration been run?";
  }

  cached = { enabled, expires: Date.now() + CACHE_TTL_MS };
  return null;
}

export async function getQuotaSetting(): Promise<{
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}> {
  const supabase = getSupabaseAdmin();
  const { data } = supabase
    ? await supabase
        .from("app_settings")
        .select("value, updated_at, updated_by")
        .eq("key", QUOTA_KEY)
        .maybeSingle<{ value: { enabled?: unknown }; updated_at: string; updated_by: string | null }>()
    : { data: null };
  return {
    enabled: data?.value?.enabled === true,
    updatedAt: data?.updated_at ?? null,
    updatedBy: data?.updated_by ?? null,
  };
}
