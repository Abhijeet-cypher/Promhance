"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, Sparkles, Palette, PenTool, Code, RefreshCw, Copy, Check, Wand2, Megaphone } from "lucide-react";

const MAX_CHARS = 2000;

const MODES = [
  { id: "LLM Prompt",       icon: Bot,        desc: "ChatGPT, Claude, Gemini" },
  { id: "General",          icon: Sparkles,   desc: "All-purpose enhancement" },
  { id: "Image Generation", icon: Palette,    desc: "Midjourney, DALL·E, etc." },
  { id: "Creative Writing", icon: PenTool,    desc: "Stories, scripts, copy" },
  { id: "Technical/Code",   icon: Code,       desc: "Code, docs, APIs" },
  { id: "Marketing",        icon: Megaphone,  desc: "Ads, emails, social copy" },
];

const INTENSITIES = [
  { id: "low",    label: "Low",    desc: "Light cleanup, keeps your tone" },
  { id: "medium", label: "Medium", desc: "Structured and detailed" },
  { id: "high",   label: "High",   desc: "Maximum specificity & depth" },
];

const PLACEHOLDERS = [
  "Write a YouTube script about AI tools for developers",
  "Create a cinematic fantasy landscape with fog and mountains",
  "Explain recursion to a 10-year-old using Lego bricks",
  "Write a product description for a noise-cancelling smartwatch",
];

function estimateTokens(text: string) {
  return Math.round(text.trim().split(/\s+/).filter(Boolean).length * 1.33);
}

const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, eventParams);
  }
};

export default function PromptEnhancer({ defaultMode = "LLM Prompt" }: { defaultMode?: string }) {
  const [input, setInput]               = useState("");
  const [output, setOutput]             = useState("");
  const [loading, setLoading]           = useState(false);
  const [isMounted, setIsMounted]       = useState(false);
  const [mode, setMode]                 = useState(defaultMode);
  const [intensity, setIntensity]       = useState("medium");
  const [isCopied, setIsCopied]         = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [hasTrackedInput, setHasTrackedInput] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const id = setInterval(() => setPlaceholderIdx(p => (p + 1) % PLACEHOLDERS.length), 4000);
    return () => clearInterval(id);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(output);
      } else {
        const el = document.createElement("textarea");
        el.value = output;
        Object.assign(el.style, { position: "fixed", left: "-9999px", top: "-9999px" });
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        el.remove();
      }
      setIsCopied(true);
      trackEvent("copy_prompt", {
        mode,
        intensity,
        output_length: output.length,
        output_words: output.trim().split(/\s+/).filter(Boolean).length,
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }, [output, mode, intensity]);

  const enhancePrompt = useCallback(async (regen = false) => {
    if (!input.trim()) return;
    
    trackEvent("enhance_prompt", {
      mode,
      intensity,
      prompt_length: input.length,
      is_retry: regen,
    });
    
    if (regen) setIsRegenerating(true);
    setLoading(true);
    setOutput("");
    try {
      const res  = await fetch("/api/enhance", {
        method: "POST",
        body: JSON.stringify({ prompt: input, mode, intensity }),
      });
      const data = await res.json();
      setOutput(data.enhanced || "Enhanced output could not be generated.");
    } catch {
      setOutput("An error occurred while enhancing the prompt.");
    } finally {
      setLoading(false);
      setIsRegenerating(false);
    }
  }, [input, mode, intensity]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      enhancePrompt();
    }
  }, [enhancePrompt]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    if (!hasTrackedInput && val.length > 0) {
      trackEvent("input_started", { mode, intensity });
      setHasTrackedInput(true);
    }
  };

  const wordCount  = output.trim() ? output.trim().split(/\s+/).filter(Boolean).length : 0;
  const tokenEst   = estimateTokens(output);
  const charsLeft  = MAX_CHARS - input.length;
  const isOverLimit = input.length > MAX_CHARS;
  const canEnhance = input.trim().length > 0 && !loading && !isOverLimit;

  if (!isMounted) return null;

  return (
    <div className="w-full flex flex-col lg:flex-row gap-5 sm:gap-6 items-stretch justify-center lg:h-[700px]">

      {/* ══════════════ INPUT PANEL ══════════════ */}
      <div className="w-full lg:w-1/2">
        <div className="bg-[#111111] border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-2xl flex flex-col h-full min-h-[580px] lg:min-h-[640px] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] overflow-hidden">

          {/* ── Section: Prompt Type ── */}
          <div className="p-5 sm:p-6 border-b border-[#1f1f1f]">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#525252] mb-3">Prompt Type</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MODES.map(({ id, icon: Icon, desc }) => {
                const active = mode === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setMode(id);
                      trackEvent("mode_selected", { mode: id });
                    }}
                    className={`group relative overflow-hidden text-left px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                      active
                        ? "bg-blue-500/10 border-blue-500/40 shadow-[0_0_14px_rgba(59,130,246,0.1)]"
                        : "bg-[#0a0a0a] border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#141414]"
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/6 to-transparent -translate-x-full animate-[shimmer_2.5s_ease-in-out_infinite]" />
                    )}
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${active ? "text-blue-400" : "text-[#525252] group-hover:text-[#a1a1a1]"}`}
                        strokeWidth={2}
                      />
                      <span className={`text-xs font-semibold transition-colors ${active ? "text-blue-300" : "text-[#a1a1a1] group-hover:text-white"}`}>
                        {id}
                      </span>
                    </div>
                    <p className={`text-xs leading-tight transition-colors ${active ? "text-blue-400/70" : "text-[#525252]"}`}>
                      {desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Section: Enhancement Depth ── */}
          <div className="px-5 sm:px-6 py-4 border-b border-[#1f1f1f]">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#525252]">Enhancement Depth</p>
              <span className="text-[10px] text-[#525252] italic">
                {INTENSITIES.find(i => i.id === intensity)?.desc}
              </span>
            </div>
            <div className="flex rounded-xl border border-[#2a2a2a] overflow-hidden bg-[#0a0a0a] p-0.5 gap-0.5">
              {INTENSITIES.map(({ id, label }) => {
                const active = intensity === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setIntensity(id);
                      trackEvent("intensity_selected", { intensity: id });
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                      active
                        ? "bg-blue-500/15 text-blue-300 shadow-[inset_0_1px_0_rgba(59,130,246,0.2)]"
                        : "text-[#525252] hover:text-[#a1a1a1] hover:bg-white/3"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Section: Your Prompt ── */}
          <div className="flex flex-col flex-grow p-5 sm:p-6 gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#525252]">Your Prompt</p>
              <span className={`text-[10px] tabular-nums transition-colors ${
                isOverLimit ? "text-red-400" : charsLeft < 200 ? "text-amber-400/80" : "text-[#525252]"
              }`}>
                {input.length} / {MAX_CHARS}
              </span>
            </div>

            <div className="relative flex-grow min-h-[180px]">
              <textarea
                className="w-full h-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#f5f5f5] rounded-xl p-4 pb-8 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all placeholder:text-[#3a3a3a] resize-none font-sans text-sm leading-relaxed"
                placeholder={PLACEHOLDERS[placeholderIdx]}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                maxLength={MAX_CHARS + 100}
                spellCheck
              />
              {/* Keyboard hint inside textarea */}
              <span className="absolute bottom-3 right-3 text-[10px] text-[#3a3a3a] pointer-events-none select-none font-mono">
                ⌃↵ to run
              </span>
            </div>

            {/* Submit */}
            <button
              onClick={() => enhancePrompt(false)}
              disabled={!canEnhance}
              className="btn-shimmer relative overflow-hidden w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-blue-500 text-white text-sm font-semibold transition-all duration-200 hover:bg-blue-400 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-1 focus:ring-offset-[#111111] shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_28px_rgba(59,130,246,0.4)]"
            >
              {loading && !isRegenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Enhancing…</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 shrink-0" strokeWidth={2} />
                  <span>Enhance Prompt</span>
                  <span className="ml-1 hidden sm:inline text-blue-200/60 text-[11px] font-mono">⌃↵</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════ OUTPUT PANEL ══════════════ */}
      {(output || loading || window.innerWidth >= 1024) && (
        <div className={`w-full lg:w-1/2 transition-all duration-500 ${
          !output && !loading ? "opacity-40 lg:opacity-100 pointer-events-none lg:pointer-events-auto" : "opacity-100"
        }`}>
          <div className={`bg-[#111111] border rounded-2xl flex flex-col h-full min-h-[580px] lg:min-h-[640px] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] overflow-hidden ${
            output && !loading ? "border-blue-500/20 hover:border-blue-500/30" : "border-[#2a2a2a] hover:border-[#3a3a3a]"
          }`}>

            {/* Output Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#1f1f1f] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  loading ? "bg-blue-400 animate-pulse" : output ? "bg-blue-500" : "bg-[#3a3a3a]"
                }`} />
                <h2 className="text-sm font-semibold text-white">Enhanced Prompt</h2>
                {output && !loading && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                    {wordCount}w · ~{tokenEst}tk
                  </span>
                )}
              </div>

              {/* Action buttons */}
              {output && !loading && (
                <div className="flex items-center gap-2">
                  {/* Regenerate */}
                  <button
                    onClick={() => enhancePrompt(true)}
                    disabled={isRegenerating}
                    title="Regenerate"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] text-[#a1a1a1] hover:text-white hover:border-[#3a3a3a] transition-all text-xs font-medium disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">Retry</span>
                  </button>

                  {/* Copy */}
                  <button
                    onClick={handleCopy}
                    title="Copy to clipboard"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
                      isCopied
                        ? "bg-blue-500/15 text-blue-300 border-blue-500/40"
                        : "bg-[#0a0a0a] text-[#a1a1a1] border-[#2a2a2a] hover:text-white hover:border-[#3a3a3a]"
                    }`}
                  >
                    {isCopied ? (
                      <><Check className="w-3.5 h-3.5" /><span className="hidden sm:inline">Copied!</span></>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /><span className="hidden sm:inline">Copy</span></>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Output Body */}
            <div className="flex-1 min-h-0 overflow-y-auto relative">
              {loading ? (
                /* ── Loading skeleton ── */
                <div className="p-5 sm:p-6 space-y-3 animate-pulse">
                  <div className="h-3.5 bg-[#1a1a1a] rounded-full w-4/5" />
                  <div className="h-3.5 bg-[#1a1a1a] rounded-full w-full" />
                  <div className="h-3.5 bg-[#1a1a1a] rounded-full w-3/4" />
                  <div className="h-3.5 bg-[#1a1a1a] rounded-full w-full mt-5" />
                  <div className="h-3.5 bg-[#1a1a1a] rounded-full w-5/6" />
                  <div className="h-3.5 bg-[#1a1a1a] rounded-full w-full" />
                  <div className="h-3.5 bg-[#1a1a1a] rounded-full w-2/3 mt-5" />
                  <div className="h-3.5 bg-[#1a1a1a] rounded-full w-full" />
                  <div className="h-3.5 bg-[#1a1a1a] rounded-full w-4/5" />
                  <div className="mt-4 pt-4 border-t border-[#1f1f1f] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs text-blue-400 animate-pulse">Enhancing your prompt…</span>
                  </div>
                </div>
              ) : output ? (
                /* ── Rendered output ── */
                <div className="p-5 sm:p-6 text-[#d4d4d4] text-sm leading-7 space-y-0.5">
                  <ReactMarkdown
                    components={{
                      p:      ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                      em:     ({ children }) => <em className="italic text-[#a1a1a1]">{children}</em>,
                      h1:     ({ children }) => <h1 className="text-xl font-bold mb-3 mt-6 first:mt-0 text-white border-b border-[#2a2a2a] pb-2">{children}</h1>,
                      h2:     ({ children }) => <h2 className="text-base font-bold mb-2 mt-5 first:mt-0 text-white">{children}</h2>,
                      h3:     ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-4 first:mt-0 text-[#f5f5f5]">{children}</h3>,
                      ul:     ({ children }) => <ul className="mb-4 space-y-1.5 pl-1">{children}</ul>,
                      ol:     ({ children }) => <ol className="mb-4 space-y-1.5 list-decimal pl-4">{children}</ol>,
                      li:     ({ children }) => (
                        <li className="flex gap-2 items-start">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500/60 shrink-0" />
                          <span>{children}</span>
                        </li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-blue-500/40 pl-4 my-4 text-[#a1a1a1] italic text-sm">{children}</blockquote>
                      ),
                      code:   ({ children, className }) => {
                        const isBlock = className?.includes("language-");
                        return isBlock
                          ? <code className="block bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3 text-xs font-mono text-blue-200 overflow-x-auto">{children}</code>
                          : <code className="bg-[#1a1a1a] border border-[#2a2a2a] px-1.5 py-0.5 rounded text-xs font-mono text-blue-300">{children}</code>;
                      },
                      pre:    ({ children }) => <pre className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 mb-4 overflow-x-auto">{children}</pre>,
                      hr:     () => <hr className="border-[#2a2a2a] my-5" />,
                    }}
                  >
                    {output}
                  </ReactMarkdown>
                </div>
              ) : (
                /* ── Empty state ── */
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4 px-8 max-w-xs">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                      <Wand2 className="w-6 h-6 text-blue-500/30" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-[#a1a1a1]">No output yet</p>
                      <p className="text-xs text-[#525252] leading-relaxed">
                        Enter your rough idea, pick a mode and depth, then hit <span className="text-[#a1a1a1] font-mono">Enhance Prompt</span>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Output Footer — stats */}
            {output && !loading && (
              <div className="px-5 sm:px-6 py-3 border-t border-[#1f1f1f] shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-[#525252]">
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-blue-500/60" />
                    {wordCount} words
                  </span>
                  <span>·</span>
                  <span>~{tokenEst} tokens</span>
                  <span>·</span>
                  <span className="capitalize">{mode}</span>
                  <span>·</span>
                  <span className="capitalize">{intensity} intensity</span>
                </div>
                <span className="text-[10px] text-[#3a3a3a]">Optimized for {mode}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}