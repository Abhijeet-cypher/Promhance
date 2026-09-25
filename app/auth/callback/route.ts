import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Only allow same-site relative paths. Anything else (`@evil.com`,
 * `//evil.com`, `/\evil.com`, absolute URLs) falls back to the default so
 * the callback can't be used as an open redirect.
 */
function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/history";
  }
  return value;
}

/**
 * Auth redirect handler. Used by email-confirmation links today and ready
 * for Google OAuth / magic links later. Exchanges the code for a session
 * cookie, then sends the user on to their destination.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
