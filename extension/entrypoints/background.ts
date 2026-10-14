import { API_BASE, type EnhanceResponse } from "@/lib/api";
import { getAnonId } from "@/lib/anon-id";
import type { EnhanceMessage, EnhanceMessageResponse } from "@/lib/messages";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse: (r: EnhanceMessageResponse) => void) => {
      if (!isEnhanceMessage(message)) return false;

      void handleEnhance(message)
        .then(sendResponse)
        .catch((err) => {
          console.error("Promhance enhance failed:", err);
          sendResponse({
            ok: false,
            error: "Something went wrong while enhancing. Please try again.",
          });
        });

      // Keep the message channel open for the async response.
      return true;
    }
  );
});

function isEnhanceMessage(value: unknown): value is EnhanceMessage {
  return (
    !!value &&
    typeof value === "object" &&
    (value as EnhanceMessage).type === "ENHANCE_PROMPT" &&
    typeof (value as EnhanceMessage).prompt === "string"
  );
}

async function handleEnhance(message: EnhanceMessage): Promise<EnhanceMessageResponse> {
  const anonId = await getAnonId();
  const url = `${API_BASE}/api/enhance`;
  console.log("[Promhance] enhancing via", url);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: message.prompt,
        mode: message.mode,
        intensity: message.intensity,
        anonId,
      }),
    });
  } catch (err) {
    console.error("[Promhance] fetch failed:", err);
    return {
      ok: false,
      error: `Could not reach ${API_BASE}. Is the app running and reachable?`,
    };
  }

  if (res.status === 429) {
    return {
      ok: false,
      rateLimited: true,
      error: "You're enhancing very fast. Wait a moment and try again.",
    };
  }

  const data = (await res.json().catch(() => ({}))) as EnhanceResponse;
  if (!res.ok || !data.enhanced) {
    console.error("[Promhance] enhance error", res.status, data);
    return {
      ok: false,
      error: data.error || `Could not enhance the prompt (HTTP ${res.status}).`,
    };
  }

  return { ok: true, enhanced: data.enhanced, promptId: data.prompt_id ?? null };
}
