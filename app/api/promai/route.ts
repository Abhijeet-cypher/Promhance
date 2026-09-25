import { NextResponse } from "next/server";
import type { Content } from "@google/genai";
import {
  getGoogleGenAI,
  GEMINI_MODEL,
  generateContentStreamWithFallback,
} from "@/lib/ai";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
// Streaming answers can outlast the platform default; give them headroom.
export const maxDuration = 60;

const MAX_MESSAGE_LENGTH = 8000;
const MAX_HISTORY_TURNS = 12;
const MAX_BODY_BYTES = 200_000;

const ANSWER_SYSTEM_INSTRUCTION = `You are PromAI, the built-in AI assistant for Promhance (https://www.promhance.com), an AI prompt engineering studio.
You help users with a wide range of questions — writing, coding, marketing, research, brainstorming, and prompt engineering.
Be accurate, concise, and genuinely useful. Use Markdown formatting (headings, lists, code blocks) when it improves clarity.
If a question is ambiguous, make a reasonable assumption and answer, or ask one focused clarifying question.
Never claim capabilities you do not have. If you are unsure, say so.`;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function isValidMessage(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "promai", 20, 300);
    if (limited) return limited;

    const declaredSize = Number(req.headers.get("content-length") ?? 0);
    if (declaredSize > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request too large." }, { status: 413 });
    }

    const body = await req.json().catch(() => null);
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const mode = body.mode === "test" ? "test" : "answer";
    const message = body.message;
    const rawHistory = Array.isArray(body.history) ? body.history : [];

    if (!isValidMessage(message)) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const ai = getGoogleGenAI();
    if (!ai) {
      console.error("GEMINI_API_KEY is not configured.");
      return NextResponse.json(
        { error: "The service is temporarily unavailable." },
        { status: 500 }
      );
    }

    const trimmed = message.slice(0, MAX_MESSAGE_LENGTH);

    const history: ChatMessage[] = rawHistory
      .filter(
        (m: unknown): m is ChatMessage =>
          !!m &&
          typeof m === "object" &&
          (((m as ChatMessage).role === "user") ||
            ((m as ChatMessage).role === "assistant")) &&
          typeof (m as ChatMessage).content === "string"
      )
      .slice(-MAX_HISTORY_TURNS);

    const contents: Content[] = [
      ...history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content.slice(0, MAX_MESSAGE_LENGTH) }],
      })),
      { role: "user", parts: [{ text: trimmed }] },
    ];

    // "test" mode runs the prompt as-is (no assistant persona) so the user
    // sees the raw model output. "answer" mode is a helpful assistant.
    const stream = await generateContentStreamWithFallback(ai, {
      model: GEMINI_MODEL,
      contents,
      config: {
        // Stop generating (and paying) when the client disconnects.
        abortSignal: req.signal,
        ...(mode === "answer"
          ? { systemInstruction: ANSWER_SYSTEM_INSTRUCTION }
          : {}),
        temperature: mode === "test" ? 0.9 : 0.7,
      },
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (err) {
          console.error("PromAI stream error:", err);
          try {
            controller.enqueue(
              encoder.encode(
                "\n\n[PromAI encountered an error. Please try again.]"
              )
            );
          } catch {
            /* stream already closed */
          }
        } finally {
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("PromAI Error:", error);
    return NextResponse.json(
      { error: "An error occurred while generating a response." },
      { status: 500 }
    );
  }
}
