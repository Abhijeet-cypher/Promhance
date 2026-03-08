import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.prompt;
    const mode = body.mode || "General";
    const intensity = body.intensity || "medium";

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

    console.log(response)
    const enhanced = response.text || "Failed to generate enhancement.";

    return NextResponse.json({
      enhanced: enhanced.trim(),
    });

  } catch (error) {
    console.error("Enhancement Error:", error);
    return NextResponse.json(
      { error: "An error occurred while enhancing the prompt." },
      { status: 500 }
    );
  }
}