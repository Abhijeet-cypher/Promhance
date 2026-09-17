import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { parseAnonId, resolveUserId } from "@/lib/supabase/identity";

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

    let systemInstruction = "";

    switch (mode) {
      case "Image Generation":
        systemInstruction = `You are Promhance, a AI Prompt Engineer. Your job is to refine basic ideas into clean, simple, and effective image generation prompts. 
        Your output must be ONLY the final optimized prompt. Do not mention specific word counts.
        Focus simply on: Core subject, basic environment/lighting, and a defining artistic style.`;
        break;
      case "Creative Writing":
        systemInstruction = `You are Promhance, a AI Prompt Engineer. Your job is to refine basic story ideas into clear, simple writing prompts. 
        Your output must be ONLY the final optimized prompt. Do not mention specific word counts.
        Focus simply on: The core narrative, target tone, and basic constraints necessary to guide the LLM effectively.`;
        break;
      case "Technical/Code":
        systemInstruction = `You are Promhance, a AI Prompt Engineer. Your job is to refine technical requests into straightforward, clear coding prompts. 
        Your output must be ONLY the final optimized prompt. Do not mention specific word counts.
        Focus simply on: Defining the exact tech stack, core functionality, and expected inputs/outputs directly.`;
        break;
      case "Marketing":
        systemInstruction = `You are Promhance, a AI Prompt Engineer. Your job is to refine marketing ideas into clear, effective marketing prompts (ads, emails, social copy).
        Your output must be ONLY the final optimized prompt. Do not mention specific word counts.
        Focus simply on: The target audience, the desired action, the channel, and the key value proposition.`;
        break;
      case "General":
      default:
        systemInstruction = `You are Promhance, a AI Prompt Engineer. Your job is to refine basic ideas into clear, simple, and direct AI prompts.
        Your output must be ONLY the final optimized prompt. Do not mention specific word counts.
        Focus simply on straightforward constraints, optimal formatting, and clarity.`;
        break;
      case "LLM Prompt":
        systemInstruction = `You are Promhance, a AI Prompt Engineer. Your job is to refine basic ideas into clear, simple, and direct LLM prompts.
        Your output must be ONLY the final optimized prompt. Do not mention specific word counts.
        Focus simply on straightforward constraints, optimal formatting, and clarity.`;
        break;
    }

    const intensityPrompts: Record<string, string> = {
      low: `Lightly enhance the prompt. Fix grammar, add minimal clarity. Keep it short — 1-2 sentences max. Do not over-explain.`,
      medium: `Moderately enhance the prompt. Add a role, define the task clearly, specify audience and format. Keep it focused — 3-5 sentences.`,
      high: `Fully engineer the prompt. Add role, detailed task breakdown, constraints, expected input/output format, edge cases, and performance requirements. Be comprehensive and specific.`
    };

    const intensityInstruction = intensityPrompts[intensity as keyof typeof intensityPrompts] || intensityPrompts.medium;
    const finalSystemInstruction = `${systemInstruction}\n\nINTENSITY GUIDELINE:\n${intensityInstruction}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
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
      }
    }

    return NextResponse.json({
      enhanced,
      prompt_id: promptId,
    });

  } catch (error) {
    console.error("Enhancement Error:", error);
    return NextResponse.json(
      { error: "An error occurred while enhancing the prompt." },
      { status: 500 }
    );
  }
}
