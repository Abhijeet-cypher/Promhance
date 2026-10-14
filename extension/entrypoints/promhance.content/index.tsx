import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import Widget from "./Widget";
import "./widget.css";
import { findPlatformForUrl, type Platform } from "@/lib/platforms";
import { findInput, focusInput, type PromptInput } from "@/lib/inputs";

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
    console.log("[Promhance] content script loaded", location.href, "platform:", platform?.id);
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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let lastInput: PromptInput | null = null;
    const check = () => {
      const found = findInput(platform.inputs);
      if (found !== lastInput) {
        lastInput = found;
        console.log("[Promhance] prompt input:", found);
      }
      setVisible(!!found);
    };
    check();

    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = window.setInterval(check, 1500);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, [platform]);

  if (!visible) return null;

  return (
    <div className="promhance-launcher">
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
        <div className="promhance-panel">
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
