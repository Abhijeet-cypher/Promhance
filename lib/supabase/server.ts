import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

let cachedAdmin: SupabaseClient | null = null;

/**
 * Server-only Supabase client authenticated with the service role key.
 * Bypasses Row Level Security, so only use this in Route Handlers,
 * Server Actions, or server-side code — never ship it to the client.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  if (!cachedAdmin) {
    cachedAdmin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return cachedAdmin;
}

/**
 * Cookie-aware Supabase client for the current request, scoped to the
 * signed-in user. Use this to read the authenticated user (RLS applies).
 * Returns null when the env vars are not configured.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — safe to ignore.
          // Middleware is responsible for refreshing the session cookie.
        }
      },
    },
  });
}
