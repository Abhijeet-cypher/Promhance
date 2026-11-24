import { NextResponse } from "next/server";
import type { ModelMessage } from "ai";
import {
  generateCompletion,
  generateCompletionStream,
  isConfigured,
  type CompletionParams,
} from "@/lib/ai";
import { enforceRateLimit } from "@/lib/rate-limit";
import { reserveQuota, reserveResearch, type QuotaKind, type Reservation } from "@/lib/quota";
import { buildResearchContext, runResearch, type ResearchResult } from "@/lib/research";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { parseAnonId, resolveUserId } from "@/lib/supabase/identity";
import {
  buildEnhanceSystemInstruction,
  INTENSITY_INSTRUCTIONS,
  MODE_SYSTEM_INSTRUCTIONS,
} from "@/lib/prompt-modes";
import { preflight, withCors } from "@/lib/cors";

export const runtime = "nodejs";
// Primary + fallback model attempts can add up; give them room.
export const maxDuration = 60;

export async function OPTIONS(req: Request) {
  return preflight(req);
}

const MAX_PROMPT_LENGTH = 8000;
const MAX_OUTPUT_LENGTH = 20000;
const MAX_BODY_BYTES = 64_000;

export async function POST(req: Request) {
  return withCors(req, await handlePost(req));
}

async function handlePost(req: Request) {
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

    if (!isConfigured()) {
      console.error("DEEPSEEK_API_KEY is not configured.");
      return NextResponse.json(
        { error: "The service is temporarily unavailable." },
        { status: 500 }
      );
    }

    const kind: QuotaKind = intensity === "high" ? "detail" : "basic";
    const wantResearch = body.research === true;

    // Opt-in streaming (the web app): text arrives as it is generated, then a
    // trailing metadata record carries the saved prompt id. Other callers (the
    // extension) keep the plain JSON response below.
    if (body.stream === true) {
      const run = await prepareRun(req, {
        userId: await resolveUserId(),
        anonId,
        kind,
        wantResearch,
        prompt,
        mode,
      });
      if (!run.ok) return run.response;
      return streamEnhance({
        prompt,
        mode,
        intensity,
        anonId,
        reservation: run.reservation,
        research: run.research,
        researchFailed: run.researchFailed,
      });
    }

    // Identical requests already in flight (double click, client retry, two
    // extension instances) share one model call, one DB row and one unit of
    // quota: only the request that starts the job reserves.
    const key = `${anonId ?? ""}|${mode}|${intensity}|${wantResearch ? "r" : "-"}|${prompt}`;
    let job = inFlight.get(key);
    if (!job) {
      const run = await prepareRun(req, {
        userId: await resolveUserId(),
        anonId,
        kind,
        wantResearch,
        prompt,
        mode,
      });
      if (!run.ok) return run.response;
      job = runEnhance({
        prompt,
        mode,
        intensity,
        anonId,
        reservation: run.reservation,
        research: run.research,
        researchFailed: run.researchFailed,
      }).finally(() => {
        inFlight.delete(key);
      });
      inFlight.set(key, job);
    }
    const result = await job;

    return NextResponse.json({
      enhanced: result.enhanced,
      prompt_id: result.promptId,
      version_number: result.promptId ? 1 : null,
      ...(result.research ? { research: result.research } : {}),
      ...(result.researchFailed ? { research_failed: true } : {}),
    });

  } catch (error) {
    console.error("Enhancement Error:", error);
    return NextResponse.json(
      { error: "An error occurred while enhancing the prompt." },
      { status: 500 }
    );
  }
}

const inFlight = new Map<string, Promise<EnhanceResult>>();

type EnhanceResult = {
  enhanced: string;
  promptId: string | null;
  research: ResearchResult | null;
  researchFailed: boolean;
};

type EnhanceArgs = {
  prompt: string;
  mode: string;
  intensity: string;
  anonId: string | null;
  /** Quota unit(s) held for this run; refunded when the run fails. */
  reservation?: Reservation;
  /** Deep Research brief to ground the enhancement, when requested. */
  research?: ResearchResult | null;
  /** Research was requested but failed; the run continued without it (and its credit was refunded). */
  researchFailed?: boolean;
};

type PreparedRun =
  | { ok: false; response: NextResponse }
  | {
      ok: true;
      reservation: Reservation;
      research: ResearchResult | null;
      researchFailed: boolean;
    };

/**
 * Reserves quota (and the Deep Research credit when asked) and runs the
 * research step. A research failure is not fatal: its credit is refunded and
 * the enhancement proceeds without it.
 */
async function prepareRun(
  req: Request,
  opts: {
    userId: string | null;
    anonId: string | null;
    kind: QuotaKind;
    wantResearch: boolean;
    prompt: string;
    mode: string;
  }
): Promise<PreparedRun> {
  let researchReservation: Reservation | null = null;
  if (opts.wantResearch) {
    const gate = await reserveResearch(req, { userId: opts.userId, anonId: opts.anonId });
    if (!gate.ok) return gate;
    researchReservation = gate.reservation;
  }

  const quota = await reserveQuota(req, {
    userId: opts.userId,
    anonId: opts.anonId,
    kind: opts.kind,
  });
  if (!quota.ok) {
    await researchReservation?.release();
    return quota;
  }

  let research: ResearchResult | null = null;
  let researchFailed = false;
  if (researchReservation) {
    try {
      research = await runResearch(opts.prompt, opts.mode);
    } catch (error) {
      console.error("Research failed:", error instanceof Error ? error.message : error);
      await researchReservation.release();
      researchReservation = null;
      researchFailed = true;
    }
  }

  const held = researchReservation;
  return {
    ok: true,
    // If the enhancement later fails, refund both units.
    reservation: {
      release: async () => {
        await Promise.all([quota.reservation.release(), held?.release()]);
      },
    },
    research,
    researchFailed,
  };
}

function buildEnhanceParams({ prompt, mode, intensity, research }: EnhanceArgs): CompletionParams {
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: `Enhance this idea into a master-level prompt:\n\n${prompt}`,
    },
  ];
  const system = buildEnhanceSystemInstruction(mode, intensity);
  return {
    instructions: research ? `${system}\n\n${buildResearchContext(research)}` : system,
    messages,
    temperature: 0.7,
  };
}

async function runEnhance(args: EnhanceArgs): Promise<EnhanceResult> {
  let enhanced: string;
  try {
    const response = await generateCompletion(buildEnhanceParams(args));
    enhanced = (response ?? "").trim();
    if (!enhanced) throw new Error("Model returned an empty response.");
  } catch (error) {
    await persistFailure(args, error);
    throw error;
  }
  const promptId = await persistEnhancement(args, enhanced);
  return {
    enhanced,
    promptId,
    research: args.research ?? null,
    researchFailed: args.researchFailed === true,
  };
}

/**
 * Called on every failed run: refunds the reserved quota unit, then records
 * the failure so it shows up in the admin Prompts view.
 * Best-effort: never throws, and the failed row is hidden from user history.
 */
async function persistFailure(
  { prompt, mode, intensity, anonId, reservation }: EnhanceArgs,
  error: unknown
): Promise<void> {
  await reservation?.release();
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase || !anonId) return;
    const userId = await resolveUserId();
    const message = (error instanceof Error ? error.message : String(error ?? "Unknown error"))
      .slice(0, 500);

    const { error: insertError } = await supabase.from("prompts").insert({
      anon_id: anonId,
      user_id: userId,
      original_prompt: prompt,
      enhanced_prompt: "",
      mode,
      intensity,
      status: "failed",
      error_message: message,
    });
    if (insertError) console.error("Failed-prompt persist failed:", insertError.message);
  } catch (persistError) {
    console.error("Failed-prompt persist failed:", persistError);
  }
}

/** Separates streamed text from the trailing JSON metadata record. */
const META_SEPARATOR = "\u001e";

async function streamEnhance(args: EnhanceArgs) {
  const params = buildEnhanceParams(args);
  let stream: AsyncIterable<string>;
  try {
    stream = await generateCompletionStream(params);
  } catch (error) {
    await persistFailure(args, error);
    throw error;
  }
  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      let meta: {
        prompt_id: string | null;
        error?: boolean;
        research?: ResearchResult;
        research_failed?: boolean;
      };
      try {
        for await (const text of stream) {
          if (text) {
            full += text;
            controller.enqueue(encoder.encode(text));
          }
        }
        const enhanced = full.trim();
        if (!enhanced) {
          await persistFailure(args, new Error("Model returned an empty response."));
          meta = { prompt_id: null, error: true };
        } else {
          meta = {
            prompt_id: await persistEnhancement(args, enhanced),
            ...(args.research ? { research: args.research } : {}),
            ...(args.researchFailed ? { research_failed: true } : {}),
          };
        }
      } catch (error) {
        console.error("Enhancement stream error:", error);
        await persistFailure(args, error);
        meta = { prompt_id: null, error: true };
      }
      controller.enqueue(encoder.encode(META_SEPARATOR + JSON.stringify(meta)));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * Persists the enhancement so it can be reused later. Failure to persist must
 * never break the enhancement itself, so errors resolve to a null id.
 */
async function persistEnhancement(
  { prompt, mode, intensity, anonId }: EnhanceArgs,
  enhanced: string
): Promise<string | null> {
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

  return promptId;
}
