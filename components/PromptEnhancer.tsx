"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Sparkles,
  Palette,
  PenTool,
  Code,
  RefreshCw,
  Copy,
  Check,
  Wand2,
  Megaphone,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  Minimize2,
  Briefcase,
  Feather,
  Film,
  Camera,
  Coffee,
  TrendingUp,
  Bug,
  ListOrdered,
  Play,
  type LucideIcon,
} from "lucide-react";
import FeedbackReaction from "@/components/FeedbackReaction";
import { getAnonId } from "@/lib/anon-id";
import { getQuickActions, type QuickAction } from "@/lib/quick-actions";

const QUICK_ACTION_ICONS: Record<string, LucideIcon> = {
  more_detail: Maximize2,
  shorten: Minimize2,
  formal: Briefcase,
  simpler: Feather,
  more_vivid: Palette,
  cinematic: Film,
  photorealistic: Camera,
  casual: Coffee,
  more_persuasive: TrendingUp,
  edge_cases: Bug,
  step_by_step: ListOrdered,
};

type PromptVersion = {
  version_number: number;
  text: string;
  action: string | null;
  action_label: string | null;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

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

const trackEvent = (eventName: string, eventParams?: Record<string, unknown>) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, eventParams);
  }
};

export default function PromptEnhancer({ defaultMode = "LLM Prompt" }: { defaultMode?: string }) {
  const router = useRouter();
  const [input, setInput]               = useState("");
  const [versions, setVersions]         = useState<PromptVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState(1);
  const [loading, setLoading]           = useState(false);
  const [isMounted, setIsMounted]       = useState(false);
  const [mode, setMode]                 = useState(defaultMode);
  const [intensity, setIntensity]       = useState("medium");
  const [isCopied, setIsCopied]         = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [hasTrackedInput, setHasTrackedInput] = useState(false);
  const [isPlatformMenuOpen, setIsPlatformMenuOpen] = useState(false);
  const [promptId, setPromptId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ promptId: string | null } | null>(null);
  const [refiningAction, setRefiningAction] = useState<string | null>(null);
  const [refineError, setRefineError] = useState<string | null>(null);
  // The mode that produced the current output, so refinements always match it
  // even if the user changes the mode picker afterwards.
  const [outputMode, setOutputMode] = useState(defaultMode);

  const activeVersionObj = versions.find((v) => v.version_number === activeVersion) ?? null;
  const output = activeVersionObj?.text ?? "";
  const quickActions = getQuickActions(outputMode);

  useEffect(() => {
    const mountTimer = setTimeout(() => setIsMounted(true), 0);
    const id = setInterval(() => setPlaceholderIdx(p => (p + 1) % PLACEHOLDERS.length), 4000);
    return () => {
      clearTimeout(mountTimer);
      clearInterval(id);
    };
  }, []);

  // Preload a historical prompt when arriving from /history (?prompt=<id>).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("prompt");
    if (!id) return;

    let active = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/prompts?id=${encodeURIComponent(id)}&anon_id=${encodeURIComponent(getAnonId())}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        const p = data?.prompt;
        if (!active || !p) return;
        setInput(p.original_prompt ?? "");
        if (p.mode) setMode(p.mode);
        if (p.intensity) setIntensity(p.intensity);
        setOutputMode(p.mode ?? "General");
        setPromptId(p.id ?? null);

        const loaded: PromptVersion[] =
          Array.isArray(p.versions) && p.versions.length > 0
            ? p.versions.map(
                (v: {
                  version_number: number;
                  text: string;
                  action?: string | null;
                  action_label?: string | null;
                }) => ({
                  version_number: v.version_number,
                  text: v.text,
                  action: v.action ?? null,
                  action_label: v.action_label ?? null,
                })
              )
            : [
                {
                  version_number: 1,
                  text: p.enhanced_prompt ?? "",
                  action: "base",
                  action_label: null,
                },
              ];

        setVersions(loaded);
        const requested = Number.parseInt(params.get("version") ?? "", 10);
        const hasRequested = loaded.some((v) => v.version_number === requested);
        setActiveVersion(
          hasRequested ? requested : loaded[loaded.length - 1].version_number
        );
      } catch {
        // Ignore — the enhancer still works from scratch.
      }
    })();

    return () => {
      active = false;
    };
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
      let alreadyGiven = false;
      try {
        alreadyGiven = sessionStorage.getItem("promhance_feedback_given") === "1";
      } catch {
        /* sessionStorage unavailable — show anyway */
      }
      if (!alreadyGiven) {
        setFeedback({ promptId });
      }
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }, [output, mode, intensity, promptId]);

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
    setVersions([]);
    setActiveVersion(1);
    setOutputMode(mode);
    setPromptId(null);
    setFeedback(null);
    setRefineError(null);
    try {
      const res  = await fetch("/api/enhance", {
        method: "POST",
        body: JSON.stringify({ prompt: input, mode, intensity, anonId: getAnonId() }),
      });
      const data = await res.json();
      const text = data.enhanced || "Enhanced output could not be generated.";
      setVersions([
        { version_number: 1, text, action: "base", action_label: null },
      ]);
      setActiveVersion(1);
      setPromptId(data.prompt_id ?? null);
    } catch {
      setVersions([
        {
          version_number: 1,
          text: "An error occurred while enhancing the prompt.",
          action: "base",
          action_label: null,
        },
      ]);
      setActiveVersion(1);
    } finally {
      setLoading(false);
      setIsRegenerating(false);
    }
  }, [input, mode, intensity]);

  const refinePrompt = useCallback(async (action: QuickAction) => {
    if (!promptId) {
      setRefineError("Save this prompt first to unlock refinements.");
      return;
    }

    const baseVersion = activeVersion;
    setRefiningAction(action.id);
    setRefineError(null);
    trackEvent("refine_prompt", {
      mode: outputMode,
      intensity,
      action: action.id,
      from_version: baseVersion,
    });

    try {
      const res = await fetch("/api/prompts/refine", {
        method: "POST",
        body: JSON.stringify({
          prompt_id: promptId,
          action: action.id,
          from_version: baseVersion,
          anonId: getAnonId(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.text) {
        throw new Error(data?.error || "Could not refine the prompt.");
      }

      setVersions((prev) => {
        if (prev.some((v) => v.version_number === data.version_number)) return prev;
        return [
          ...prev,
          {
            version_number: data.version_number,
            text: data.text,
            action: data.action ?? action.id,
            action_label: data.action_label ?? action.label,
          },
        ];
      });
      setActiveVersion(data.version_number);
    } catch (err) {
      setRefineError(
        err instanceof Error ? err.message : "Could not refine the prompt."
      );
    } finally {
      setRefiningAction(null);
    }
  }, [promptId, outputMode, intensity, activeVersion]);

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
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-5 sm:px-6 py-4 border-b border-[#1f1f1f] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-2 h-2 shrink-0 rounded-full transition-all duration-300 ${
                  loading ? "bg-blue-400 animate-pulse" : output ? "bg-blue-500" : "bg-[#3a3a3a]"
                }`} />
                <h2 className="text-sm font-semibold text-white whitespace-nowrap">Enhanced Prompt</h2>
                {output && !loading && versions.length > 0 && (
                  <span className="inline-flex items-center whitespace-nowrap text-[10px] px-1.5 py-0.5 rounded-md bg-[#1a1a1a] text-[#a1a1a1] border border-[#2a2a2a] font-mono">
                    v{activeVersion}
                    {activeVersionObj?.action_label ? ` · ${activeVersionObj.action_label}` : ""}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              {output && !loading && (
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  {/* Try in PromAI */}
                  <button
                    onClick={() => {
                      trackEvent("try_in_promai", { mode, intensity });
                      router.push(`/promai?test=${encodeURIComponent(output)}`);
                    }}
                    title="Test this prompt with PromAI"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15 transition-all text-xs font-medium"
                  >
                    <Play className="w-3.5 h-3.5" strokeWidth={2} />
                    <span className="hidden sm:inline whitespace-nowrap">Try it</span>
                  </button>

                  {/* Regenerate */}
                  <button
                    onClick={() => enhancePrompt(true)}
                    disabled={isRegenerating}
                    title="Regenerate"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] text-[#a1a1a1] hover:text-white hover:border-[#3a3a3a] transition-all text-xs font-medium disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline whitespace-nowrap">Retry</span>
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
                      <><Check className="w-3.5 h-3.5" /><span className="hidden sm:inline whitespace-nowrap">Copied!</span></>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /><span className="hidden sm:inline whitespace-nowrap">Copy</span></>
                    )}
                  </button>

                  {/* Open in AI Platform */}
                  <div className="relative">
                    <button
                      onClick={() => setIsPlatformMenuOpen(!isPlatformMenuOpen)}
                      title="Open in AI Platform"
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
                        isPlatformMenuOpen
                          ? "bg-blue-500/15 text-blue-300 border-blue-500/40"
                          : "bg-[#0a0a0a] text-[#a1a1a1] border-[#2a2a2a] hover:text-white hover:border-[#3a3a3a]"
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline whitespace-nowrap">Open in...</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${isPlatformMenuOpen ? "rotate-180" : ""}`} />
                    </button>
                    
                    {isPlatformMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsPlatformMenuOpen(false)} />
                        <div className="absolute right-0 mt-2 w-36 bg-[#111111] border border-[#2a2a2a] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-20 flex flex-col overflow-hidden py-1">
                          {(() => {
                            const llmPlatforms = [
                              { name: "ChatGPT", url: (p: string) => `https://chatgpt.com/?q=${encodeURIComponent(p)}` },
                              { name: "Claude", url: () => `https://claude.ai/new` },
                              { name: "Perplexity", url: (p: string) => `https://www.perplexity.ai/?q=${encodeURIComponent(p)}` },
                              { name: "Gemini", url: () => `https://gemini.google.com/` },
                            ];
                            
                            const imagePlatforms = [
                              { name: "Midjourney", url: () => `https://www.midjourney.com/` },
                              { name: "DALL-E (ChatGPT)", url: (p: string) => `https://chatgpt.com/?q=${encodeURIComponent("Generate an image: " + p)}` },
                              { name: "Bing Image Creator", url: () => `https://www.bing.com/create` },
                            ];

                            let platforms = llmPlatforms;
                            if (mode === "Image Generation") platforms = imagePlatforms;
                            else if (mode === "General") platforms = [...llmPlatforms, ...imagePlatforms];

                            return platforms.map((platform) => (
                              <button
                                key={platform.name}
                                onClick={() => {
                                  handleCopy();
                                  window.open(platform.url(output), "_blank");
                                  setIsPlatformMenuOpen(false);
                                  trackEvent("open_ai_platform", { platform: platform.name, mode, intensity });
                                }}
                                className="px-3 py-2 text-xs text-[#a1a1a1] hover:text-white hover:bg-[#1a1a1a] transition-colors text-left flex items-center justify-between group/btn"
                              >
                                <span>{platform.name}</span>
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                              </button>
                            ));
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Inline reaction — appears after a copy */}
            {feedback && (
              <FeedbackReaction
                promptId={feedback.promptId}
                onDismiss={() => setFeedback(null)}
              />
            )}

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

            {/* Refinements + version history */}
            {output && !loading && (
              <div className="px-5 sm:px-6 py-4 border-t border-[#1f1f1f] shrink-0 space-y-3">
                {versions.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[#525252] mr-1">
                      Version
                    </span>
                    <button
                      onClick={() => setActiveVersion((v) => Math.max(1, v - 1))}
                      disabled={activeVersion <= versions[0].version_number}
                      aria-label="Previous version"
                      className="shrink-0 p-1 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] text-[#a1a1a1] hover:text-white hover:border-[#3a3a3a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-1 min-w-0 overflow-x-auto scrollbar-hide">
                      {versions.map((v) => {
                        const isActive = v.version_number === activeVersion;
                        return (
                          <button
                            key={v.version_number}
                            onClick={() => setActiveVersion(v.version_number)}
                            title={v.action_label ?? "Initial enhancement"}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all whitespace-nowrap ${
                              isActive
                                ? "bg-blue-500/15 text-blue-300 border-blue-500/40"
                                : "bg-[#0a0a0a] text-[#a1a1a1] border-[#2a2a2a] hover:text-white hover:border-[#3a3a3a]"
                            }`}
                          >
                            v{v.version_number}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() =>
                        setActiveVersion((v) =>
                          Math.min(versions[versions.length - 1].version_number, v + 1)
                        )
                      }
                      disabled={activeVersion >= versions[versions.length - 1].version_number}
                      aria-label="Next version"
                      className="shrink-0 p-1 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] text-[#a1a1a1] hover:text-white hover:border-[#3a3a3a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#525252]">
                      Refine
                    </p>
                    {!promptId && (
                      <span className="text-[10px] text-[#525252] italic">
                        Unavailable for unsaved prompts
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action) => {
                      const Icon = QUICK_ACTION_ICONS[action.id] ?? Sparkles;
                      const isRefining = refiningAction === action.id;
                      return (
                        <button
                          key={action.id}
                          onClick={() => refinePrompt(action)}
                          disabled={!promptId || refiningAction !== null}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#2a2a2a] bg-[#0a0a0a] text-xs font-medium text-[#a1a1a1] hover:text-white hover:border-blue-500/40 hover:bg-blue-500/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isRefining ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                          )}
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                  {refineError && (
                    <p className="text-[10px] text-red-400 mt-2">{refineError}</p>
                  )}
                </div>
              </div>
            )}

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