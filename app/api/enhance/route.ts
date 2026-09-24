import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL, generateContentWithFallback } from "@/lib/ai";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { parseAnonId, resolveUserId } from "@/lib/supabase/identity";
import { buildEnhanceSystemInstruction } from "@/lib/prompt-modes";

export const runtime = "nodejs";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MAX_PROMPT_LENGTH = 8000;
const MAX_OUTPUT_LENGTH = 20000;
const MAX_FIELD_LENGTH = 200;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.prompt;
    const mode = body.mode || "General";
    const intensity = body.intensity || "medium";
    const anonId = parseAnonId(body.anonId);

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API Key is not configured in .env.local" },
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
          original_prompt: String(prompt).slice(0, MAX_PROMPT_LENGTH),
          enhanced_prompt: enhanced.slice(0, MAX_OUTPUT_LENGTH),
          mode: String(mode).slice(0, MAX_FIELD_LENGTH),
          intensity: String(intensity).slice(0, MAX_FIELD_LENGTH),
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
