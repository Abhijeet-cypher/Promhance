import { useEffect, useRef, useState } from "react";
import { browser } from "wxt/browser";
import type { PromptInput } from "@/lib/inputs";
import { getInputText, pasteIntoInput, setInputText } from "@/lib/inputs";
import type { EnhanceMessageResponse } from "@/lib/messages";
import type { Platform, PromptMode } from "@/lib/platforms";
import "./widget.css";

type Intensity = "low" | "medium" | "high";

type Props = {
  platform: Platform;
  getTarget: () => PromptInput | null;
  onClose: () => void;
};

const INTENSITIES: { id: Intensity; label: string }[] = [
  { id: "low", label: "Light" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

export default function Widget({ platform, getTarget, onClose }: Props) {
  const [mode, setMode] = useState<PromptMode>(platform.mode);
  const [intensity, setIntensity] = useState<Intensity>("medium");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    void browser.storage.local.get("default_intensity").then((data) => {
      const saved = data.default_intensity as Intensity | undefined;
      if (saved && INTENSITIES.some((i) => i.id === saved)) setIntensity(saved);
    });
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const node = rootRef.current;
      if (!node) return;
      // Events from inside a shadow root are retargeted at the document level,
      // so use the composed path to test containment reliably.
      const path = e.composedPath();
      if (!path.includes(node)) onClose();
    };
    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, [onClose]);

  async function enhance() {
    // Synchronous guard: `loading` state lags a render, so a fast double click
    // could otherwise send two requests.
    if (inFlight.current) return;
    const target = getTarget();
    if (!target) return;
    const prompt = getInputText(target).trim();
    if (!prompt) {
      setError("Type a rough prompt first.");
      return;
    }

    inFlight.current = true;
    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      const res = (await browser.runtime.sendMessage({
        type: "ENHANCE_PROMPT",
        prompt,
        mode,
        intensity,
      })) as EnhanceMessageResponse | undefined;

      if (!res) {
        setError("Could not reach Promhance. Reload the extension and try again.");
      } else if (res.ok) {
        setOutput(res.enhanced);
      } else {
        setError(res.error);
      }
    } catch (err) {
      console.error("[Promhance] enhance failed:", err);
      setError("Could not reach Promhance. Check your connection and try again.");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  function replace() {
    const target = getTarget();
    if (!target || !output) return;
    // Try a direct value set first; fall back to a paste injection for editors
    // that ignore programmatic assignment.
    setInputText(target, output);
    if (getInputText(target).trim() !== output.trim()) {
      pasteIntoInput(target, output);
    }
    onClose();
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="promhance-widget" ref={rootRef}>
      <header className="ph-header">
        <div className="ph-brand">
          <span className="ph-dot" />
          <span>Promhance</span>
          <span className="ph-platform">{platform.name}</span>
        </div>
        <button className="ph-icon-btn" onClick={onClose} aria-label="Close">
          &#10005;
        </button>
      </header>

      <div className="ph-row">
        <label className="ph-label">Type</label>
        <select
          className="ph-select"
          value={mode}
          onChange={(e) => setMode(e.target.value as PromptMode)}
        >
          <option value="LLM Prompt">LLM Prompt</option>
          <option value="Image Generation">Image Generation</option>
          <option value="General">General</option>
        </select>
      </div>

      <div className="ph-row">
        <label className="ph-label">Depth</label>
        <div className="ph-seg">
          {INTENSITIES.map((i) => (
            <button
              key={i.id}
              className={intensity === i.id ? "ph-seg-item active" : "ph-seg-item"}
              onClick={() => setIntensity(i.id)}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      <button className="ph-primary" onClick={enhance} disabled={loading}>
        {loading ? "Enhancing…" : output ? "Regenerate" : "Enhance prompt"}
      </button>

      {error && <p className="ph-error">{error}</p>}

      {loading && (
        <div className="ph-skeleton">
          <span /><span /><span />
        </div>
      )}

      {output && !loading && (
        <div className="ph-output-wrap">
          <pre className="ph-output">{output}</pre>
          <div className="ph-actions">
            <button className="ph-secondary" onClick={copy}>
              {copied ? "Copied!" : "Copy"}
            </button>
            <button className="ph-primary ph-replace" onClick={replace}>
              Replace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
