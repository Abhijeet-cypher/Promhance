import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import Widget from "./Widget";
import "./widget.css";
import { findPlatformForUrl, type Platform } from "@/lib/platforms";
import { findInput, focusInput, findSendButton, getInputText, type PromptInput } from "@/lib/inputs";

export default defineContentScript({
  matches: [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://www.midjourney.com/*",
    "https://copilot.microsoft.com/*",
    "https://www.bing.com/*",
  ],
  cssInjectionMode: "ui",

  async main(ctx) {
    const platform = findPlatformForUrl(location.href);
    console.log("[Promhance] content script loaded (send-button dock build v2)", location.href, "platform:", platform?.id);
    if (!platform) return;

    let target: PromptInput | null = null;

    // Rich-text editors on these SPAs get re-created on navigation, so resolve
    // the input lazily and re-resolve whenever the cached node is detached.
    const resolveTarget = (): PromptInput | null => {
      if (!target || !target.isConnected) target = findInput(platform.inputs);
      return target;
    };

    const ui = await createShadowRootUi(ctx, {
      name: "promhance-root",
      position: "inline",
      onMount(container) {
        // The host is appended straight to <body>; our CSS positions the panel
        // with `position: fixed`, so we don't depend on WXT's overlay math.
        container.style.position = "static";
        container.style.display = "block";

        const app = document.createElement("div");
        container.append(app);
        const root = ReactDOM.createRoot(app);
        root.render(<PromhanceLauncher platform={platform} getTarget={resolveTarget} />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
      // Place the shadow host directly on the document body so it escapes the
      // page's stacking/layout contexts (ChatGPT and friends use strict layouts).
      append: (_anchor, element) => document.body.append(element),
    });

    ui.mount();
    console.log("[Promhance] UI mounted");
  },
});

/**
 * Floating trigger button plus the enhancement panel. Visibility is driven by
 * whether a prompt input exists on the page, so the UI follows SPA navigation.
 */
function PromhanceLauncher({
  platform,
  getTarget,
}: {
  platform: Platform;
  getTarget: () => PromptInput | null;
}) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number; flip: boolean } | null>(null);

  useEffect(() => {
    let lastInput: PromptInput | null = null;
    const update = () => {
      const found = findInput(platform.inputs);
      if (found !== lastInput) {
        lastInput = found;
        console.log("[Promhance] prompt input:", found);
      }
      // Only show the button once there is something to enhance (or while the
      // panel is open, so it doesn't vanish mid-flow).
      if (!found || (!openRef.current && !getInputText(found).trim())) {
        setAnchor(null);
        return;
      }
      const rect = found.getBoundingClientRect();
      const send = findSendButton(platform.sendButtons, found);
      let top: number;
      let left: number;
      if (send) {
        // Dock immediately left of the send button, bottom-aligned with it.
        const s = send.getBoundingClientRect();
        top = s.bottom;
        left = s.left - 8;
      } else {
        // Fallback: just above the prompt box's top-right corner.
        top = Math.max(rect.top - 6, 44);
        left = Math.min(rect.right - 8, window.innerWidth - 8);
      }
      setAnchor((prev) =>
        prev && prev.top === top && prev.left === left ? prev : { top, left, flip: rect.top < 430 }
      );
    };
    update();

    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = window.setInterval(update, 500);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    document.addEventListener("input", update, true);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      document.removeEventListener("input", update, true);
    };
  }, [platform]);

  const openRef = useRef(open);
  openRef.current = open;

  if (!anchor) return null;

  return (
    <div className="promhance-launcher" style={{ top: anchor.top, left: anchor.left }}>
      <button
        className="promhance-trigger"
        title={`Enhance with Promhance — ${platform.name}`}
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) {
            const input = getTarget();
            if (input) focusInput(input);
          }
        }}
      >
        <PromhanceMark />
      </button>

      {open && (
        <div className={anchor.flip ? "promhance-panel below" : "promhance-panel"}>
          <Widget platform={platform} getTarget={getTarget} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

function PromhanceMark() {
  return (
    <svg viewBox="0 0 100 100" width="20" height="20" aria-hidden="true">
      <g
        fill="none"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="rotate(15 50 50)"
      >
        <polygon points="50,2 55,39 68,32 61,45 98,50 61,55 68,68 55,61 50,98 45,61 32,68 39,55 2,50 39,45 32,32 45,39" />
        <line x1="50" y1="2" x2="50" y2="98" />
        <line x1="2" y1="50" x2="98" y2="50" />
      </g>
    </svg>
  );
}
