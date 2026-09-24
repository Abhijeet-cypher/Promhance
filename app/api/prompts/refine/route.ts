import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL, generateContentWithFallback } from "@/lib/ai";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isValidUuid, parseAnonId, resolveUserId } from "@/lib/supabase/identity";
import { findQuickAction } from "@/lib/quick-actions";
import { buildRefineSystemInstruction } from "@/lib/prompt-modes";

export const runtime = "nodejs";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MAX_OUTPUT_LENGTH = 20000;

type PromptRow = {
  id: string;
  anon_id: string;
  user_id: string | null;
  mode: string | null;
  enhanced_prompt: string;
};

function parseBody(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/**
 * POST /api/prompts/refine
 *
 * Applies a mode-specific quick action to the latest version of a prompt,
 * stores the result as the next version, and returns it.
 *
 * Body: { prompt_id: string, action: string, anonId: string }
 */
export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API Key is not configured in .env.local" },
        { status: 500 }
      );
    }

    const payload = parseBody(await req.json().catch(() => null));
    if (!payload) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const promptId = payload.prompt_id;
    const actionId = typeof payload.action === "string" ? payload.action : null;
    const fromVersion = Number.isInteger(payload.from_version)
      ? (payload.from_version as number)
      : null;
    const anonId = parseAnonId(payload.anonId);

    if (!isValidUuid(promptId)) {
      return NextResponse.json({ error: "Invalid prompt id." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "History is not configured." }, { status: 503 });
    }

    const userId = await resolveUserId();

    const { data: prompt, error: promptError } = await supabase
      .from("prompts")
      .select("id, anon_id, user_id, mode, enhanced_prompt")
      .eq("id", promptId)
      .maybeSingle<PromptRow>();

    if (promptError) {
      console.error("Prompt lookup failed:", promptError.message);
      return NextResponse.json({ error: "Could not load prompt." }, { status: 500 });
    }
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found." }, { status: 404 });
    }

    const owned =
      (userId && prompt.user_id === userId) ||
      (anonId && prompt.user_id === null && prompt.anon_id === anonId);

    if (!owned) {
      return NextResponse.json({ error: "Prompt not found." }, { status: 404 });
    }

    const action = findQuickAction(prompt.mode, actionId);
    if (!action) {
      return NextResponse.json({ error: "Unknown refinement action." }, { status: 400 });
    }

    const { data: latest, error: versionError } = await supabase
      .from("prompt_versions")
      .select("text, version_number")
      .eq("prompt_id", prompt.id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle<{ text: string; version_number: number }>();

    if (versionError) {
      console.error("Version lookup failed:", versionError.message);
      return NextResponse.json({ error: "Could not load prompt version." }, { status: 500 });
    }

    // Refine the version the user is viewing; fall back to the latest.
    let sourceText = latest?.text;
    if (fromVersion && fromVersion !== latest?.version_number) {
      const { data: source, error: sourceError } = await supabase
        .from("prompt_versions")
        .select("text")
        .eq("prompt_id", prompt.id)
        .eq("version_number", fromVersion)
        .maybeSingle<{ text: string }>();

      if (sourceError) {
        console.error("Source version lookup failed:", sourceError.message);
      } else if (source) {
        sourceText = source.text;
      }
    }

    const currentText = sourceText ?? latest?.text ?? prompt.enhanced_prompt;
    const nextVersion = (latest?.version_number ?? 1) + 1;

    const response = await generateContentWithFallback(ai, {
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: `Refine this prompt:\n\n${currentText}` }],
        },
      ],
      config: {
        systemInstruction: buildRefineSystemInstruction(prompt.mode, action.instruction),
        temperature: 0.6,
      },
    });

    const refined = (response.text || "Failed to generate refinement.").trim();

    const { error: insertError } = await supabase.from("prompt_versions").insert({
      prompt_id: prompt.id,
      version_number: nextVersion,
      text: refined.slice(0, MAX_OUTPUT_LENGTH),
      action: action.id,
      action_label: action.label,
    });

    if (insertError) {
      console.error("Refinement persist failed:", insertError.message);
      return NextResponse.json({ error: "Could not save refinement." }, { status: 500 });
    }

    // Keep the cached latest version on the prompt row in sync.
    const { error: updateError } = await supabase
      .from("prompts")
      .update({ enhanced_prompt: refined.slice(0, MAX_OUTPUT_LENGTH) })
      .eq("id", prompt.id);

    if (updateError) {
      console.error("Prompt latest-version update failed:", updateError.message);
    }

    return NextResponse.json({
      prompt_id: prompt.id,
      version_number: nextVersion,
      action: action.id,
      action_label: action.label,
      text: refined,
    });
  } catch (error) {
    console.error("Refinement Error:", error);
    return NextResponse.json(
      { error: "An error occurred while refining the prompt." },
      { status: 500 }
    );
  }
}
