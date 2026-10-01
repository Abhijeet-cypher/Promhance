import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { parseAnonId, resolveUserId } from "@/lib/supabase/identity";

export const runtime = "nodejs";

const USAGE_FREQUENCIES = ["first_time", "monthly", "weekly", "daily"] as const;
const PRICE_LIKELIHOODS = [
  "definitely",
  "probably",
  "not_sure",
  "probably_not",
  "definitely_not",
] as const;
const FEATURES = [
  "advanced_enhancement",
  "custom_instructions",
  "templates",
  "history_organization",
  "multiple_models",
  "bulk_enhancement",
  "api",
  "other",
] as const;

const MAX_FEATURE_COUNT = FEATURES.length;
const MAX_SHORT_LENGTH = 200;
const MAX_LONG_LENGTH = 1000;

function cleanString(value: unknown, maxLength = MAX_SHORT_LENGTH): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function parseBody(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, "survey", 10, 50);
  if (limited) return limited;

  const payload = parseBody(await req.json().catch(() => null));
  if (!payload) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: real users never fill this hidden field.
  if (cleanString(payload.website)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const anonId = parseAnonId(payload.anonId);
  if (!anonId) {
    return NextResponse.json({ error: "Missing device id." }, { status: 400 });
  }

  const usageFrequency = cleanString(payload.usageFrequency, 40);
  if (!usageFrequency || !USAGE_FREQUENCIES.includes(usageFrequency as (typeof USAGE_FREQUENCIES)[number])) {
    return NextResponse.json({ error: "Please answer question 1." }, { status: 400 });
  }

  const desiredFeatures = Array.isArray(payload.desiredFeatures)
    ? Array.from(
        new Set(
          payload.desiredFeatures.filter(
            (feature): feature is (typeof FEATURES)[number] =>
              typeof feature === "string" &&
              FEATURES.includes(feature as (typeof FEATURES)[number])
          )
        )
      ).slice(0, MAX_FEATURE_COUNT)
    : [];

  if (desiredFeatures.length === 0) {
    return NextResponse.json({ error: "Please answer question 2." }, { status: 400 });
  }

  const priceLikelihood = cleanString(payload.priceLikelihood, 40);
  if (!priceLikelihood || !PRICE_LIKELIHOODS.includes(priceLikelihood as (typeof PRICE_LIKELIHOODS)[number])) {
    return NextResponse.json({ error: "Please answer question 4." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "The survey is not configured yet. Add your Supabase keys to .env.local." },
      { status: 503 }
    );
  }

  const userId = await resolveUserId();

  const { data, error } = await supabase
    .from("survey_responses")
    .insert({
      usage_frequency: usageFrequency,
      desired_features: desiredFeatures,
      desired_features_other: cleanString(payload.desiredFeaturesOther, MAX_SHORT_LENGTH),
      regular_use_reason: cleanString(payload.regularUseReason, MAX_LONG_LENGTH),
      price_likelihood: priceLikelihood,
      additional_notes: cleanString(payload.additionalNotes, MAX_LONG_LENGTH),
      anon_id: anonId,
      user_id: userId,
      user_agent: cleanString(req.headers.get("user-agent"), 500),
      metadata: {
        referrer: cleanString(req.headers.get("referer"), 500),
      },
    })
    .select("id")
    .single();

  if (error) {
    console.error("Survey insert failed:", error.message);
    return NextResponse.json({ error: "Could not save your response." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
