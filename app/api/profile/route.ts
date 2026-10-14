import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/supabase/identity";
import { COUNTRIES, getCountryFromRequest } from "@/lib/geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CODES = new Set(COUNTRIES.map((c) => c.code));
const MAX_NAME_LENGTH = 60;

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  country: string | null;
  country_source: string | null;
  newsletter_opt_in: boolean | null;
  created_at: string;
};

function parseBody(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_NAME_LENGTH) : null;
}

function publicProfile(row: ProfileRow) {
  return {
    email: row.email,
    displayName: row.display_name,
    country: row.country,
    countrySource: row.country_source ?? "inferred",
    newsletterOptIn: row.newsletter_opt_in ?? true,
    createdAt: row.created_at,
  };
}

/**
 * GET /api/profile
 *
 * Returns the signed-in user's profile. When country is not yet set, it is
 * inferred from the edge (Cloudflare / Vercel) headers and persisted so we can
 * report where users are from without any extra user action.
 */
export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, country, country_source, newsletter_opt_in, created_at")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) {
    console.error("Profile lookup failed:", error.message);
    return NextResponse.json({ error: "Could not load profile." }, { status: 500 });
  }

  // No row yet (older account / trigger not run): fall back to auth email.
  let profile: ProfileRow = data ?? {
    id: userId,
    email: null,
    display_name: null,
    country: null,
    country_source: "inferred",
    newsletter_opt_in: true,
    created_at: new Date().toISOString(),
  };

  // Lazy geo-inference: only ever fills an empty country.
  if (!profile.country) {
    const inferred = getCountryFromRequest(req);
    if (inferred) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ country: inferred, country_source: "inferred" })
        .eq("id", userId)
        .is("country", null);

      if (updateError) {
        console.error("Country inference persist failed:", updateError.message);
      } else {
        profile = { ...profile, country: inferred, country_source: "inferred" };
      }
    }
  }

  return NextResponse.json({ profile: publicProfile(profile) });
}

/**
 * PATCH /api/profile
 *
 * Updates display_name, country and/or newsletter_opt_in. Setting country from
 * the profile page marks it as self-reported so geo-inference never overwrites
 * the user's choice.
 */
export async function PATCH(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const payload = parseBody(await req.json().catch(() => null));
  if (!payload) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if ("displayName" in payload) {
    update.display_name = cleanName(payload.displayName);
  }

  if ("country" in payload) {
    const code =
      typeof payload.country === "string" ? payload.country.trim().toUpperCase() : "";
    if (code && !VALID_CODES.has(code)) {
      return NextResponse.json({ error: "Unknown country." }, { status: 400 });
    }
    update.country = code || null;
    update.country_source = "self";
  }

  if ("newsletterOptIn" in payload) {
    update.newsletter_opt_in = payload.newsletterOptIn !== false;
  }

  if (Object.keys(update).length <= 1) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId)
    .select("id, email, display_name, country, country_source, newsletter_opt_in, created_at")
    .maybeSingle<ProfileRow>();

  if (error) {
    console.error("Profile update failed:", error.message);
    return NextResponse.json({ error: "Could not update profile." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, profile: publicProfile(data) });
}
