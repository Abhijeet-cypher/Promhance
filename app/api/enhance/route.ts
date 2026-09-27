import { NextResponse } from "next/server";
import { GEMINI_MODEL, generateContentWithFallback, getGoogleGenAI } from "@/lib/ai";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { parseAnonId, resolveUserId } from "@/lib/supabase/identity";
import {
  buildEnhanceSystemInstruction,
  INTENSITY_INSTRUCTIONS,
  MODE_SYSTEM_INSTRUCTIONS,
} from "@/lib/prompt-modes";

export const runtime = "nodejs";

const MAX_PROMPT_LENGTH = 8000;
const MAX_OUTPUT_LENGTH = 20000;
const MAX_BODY_BYTES = 64_000;

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "enhance", 10, 200);
    if (limited) return limited;

    const declaredSize = Number(req.headers.get("content-length") ?? 0);
    if (declaredSize > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request too large." }, { status: 413 });
    }

    const body = await req.json().catch(() => null);
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    // Cap before the model call so oversized input can't inflate token costs.
    const prompt =
      typeof body.prompt === "string" ? body.prompt.trim().slice(0, MAX_PROMPT_LENGTH) : "";
    const mode =
      typeof body.mode === "string" && Object.hasOwn(MODE_SYSTEM_INSTRUCTIONS, body.mode)
        ? body.mode
        : "General";
    const intensity =
      typeof body.intensity === "string" && Object.hasOwn(INTENSITY_INSTRUCTIONS, body.intensity)
        ? body.intensity
        : "medium";
    const anonId = parseAnonId(body.anonId);

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const ai = getGoogleGenAI();
    if (!ai) {
      console.error("GEMINI_API_KEY is not configured.");
      return NextResponse.json(
        { error: "The service is temporarily unavailable." },
        { status: 500 }
      );
    }

    const finalSystemInstruction = buildEnhanceSystemInstruction(mode, intensity);

    const response = await generateContentWithFallback(ai, {
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: `Enhance this idea into a master-level prompt:\n\n${prompt}` }],
        },
      ],
      config: {
        systemInstruction: finalSystemInstruction,
        temperature: 0.7,
      },
    });

    const enhanced = (response.text || "Failed to generate enhancement.").trim();

    // Persist the enhancement so it can be reused later. Failure to persist
    // must never break the enhancement itself.
    let promptId: string | null = null;
    const supabase = getSupabaseAdmin();

    if (supabase && anonId) {
      const userId = await resolveUserId();
      const { data, error } = await supabase
        .from("prompts")
        .insert({
          anon_id: anonId,
          user_id: userId,
          original_prompt: prompt,
          enhanced_prompt: enhanced.slice(0, MAX_OUTPUT_LENGTH),
          mode,
          intensity,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Prompt persist failed:", error.message);
      } else {
        promptId = data.id;

        // Seed v1 of the version history. Best-effort: the enhancement and
        // the prompt row are already valid without it.
        const { error: versionError } = await supabase
          .from("prompt_versions")
          .insert({
            prompt_id: data.id,
            version_number: 1,
            text: enhanced.slice(0, MAX_OUTPUT_LENGTH),
            action: "base",
            action_label: null,
          });

        if (versionError) {
          console.error("Prompt version persist failed:", versionError.message);
        }
      }
    }

    return NextResponse.json({
      enhanced,
      prompt_id: promptId,
      version_number: promptId ? 1 : null,
    });

  } catch (error) {
    console.error("Enhancement Error:", error);
    return NextResponse.json(
      { error: "An error occurred while enhancing the prompt." },
      { status: 500 }
    );
  }
}
