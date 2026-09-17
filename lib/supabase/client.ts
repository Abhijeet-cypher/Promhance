"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Browser Supabase client using the public anon key.
 * Cookie-based (via @supabase/ssr) so the session is shared with the
 * server and refreshed by middleware. Returns null when env vars are missing.
 */
export function createBrowserSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  if (!cached) {
    cached = createBrowserClient(url, anonKey);
  }

  return cached;
}
