"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  X,
  Bot,
  Sparkles,
  Palette,
  PenTool,
  Code,
  RefreshCw,
  Copy,
  Check,
  Megaphone,
  ExternalLink,
  ChevronDown,
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

  const hasContent = !!(output || loading);

  return (
    <div className={`w-full flex flex-col lg:flex-row gap-5 sm:gap-6 items-stretch justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${hasContent ? "lg:h-[700px] max-w-full" : "lg:h-[500px] max-w-3xl mx-auto"}`}>

      {/* ══════════════ INPUT PANEL ══════════════ */}
      <div className={`w-full flex flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${hasContent ? "lg:w-1/2" : "lg:w-full"}`}>
        <div className={`flex flex-col h-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-sm relative group/input transition-all duration-700 ${hasContent ? "min-h-[580px] lg:min-h-[640px]" : "min-h-[400px] lg:min-h-[500px]"}`}>
          
          <div className="p-4 sm:p-5 flex-grow flex flex-col relative">
            {input.length > 0 && (
              <button
                onClick={() => setInput("")}
                className="absolute top-4 right-4 p-1.5 rounded-md text-[#525252] hover:text-[#ededed] hover:bg-[#1a1a1a] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#525252] z-10"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <textarea
              className="w-full h-full bg-transparent text-[#ededed] placeholder:text-[#525252] resize-none outline-none font-sans text-[15px] leading-relaxed pr-8"
              placeholder={PLACEHOLDERS[placeholderIdx]}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              maxLength={MAX_CHARS + 100}
              spellCheck
            />
            
            {/* Character count floating */}
            <div className="absolute bottom-4 right-5 text-[11px] font-mono text-[#525252]">
              <span className={isOverLimit ? "text-red-400" : charsLeft < 200 ? "text-amber-400/80" : ""}>
                {input.length}
              </span> / {MAX_CHARS}
            </div>
          </div>
          
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 border-t border-[#1f1f1f] bg-[#0d0d0d] flex flex-col gap-4">
             {/* Mode Row */}
             <div className="flex flex-wrap items-center gap-2 w-full">
               {MODES.map(({ id, icon: Icon }) => (
                 <button
                   key={id}
                   onClick={() => {
                     setMode(id);
                     trackEvent("mode_selected", { mode: id });
                   }}
                   className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#525252] ${
                     mode === id
                       ? "bg-[#ededed] text-[#0a0a0a] border-[#ededed] shadow-sm"
                       : "bg-transparent text-[#888] border-transparent hover:text-[#ededed] hover:bg-[#1a1a1a]"
                   }`}
                 >
                   <Icon className="w-3.5 h-3.5" />
                   <span>{id}</span>
                 </button>
               ))}
             </div>

             {/* Intensity & Submit row */}
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t border-[#1f1f1f] gap-4">
               <div className="flex items-center gap-4">
                 <div className="flex rounded-md border border-[#2a2a2a] bg-[#0a0a0a] p-0.5 shrink-0">
                   {INTENSITIES.map(({ id, label }) => (
                     <button
                       key={id}
                       onClick={() => {
                         setIntensity(id);
                         trackEvent("intensity_selected", { intensity: id });
                       }}
                       className={`px-3 py-1 text-[11px] font-medium rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#525252] ${
                         intensity === id
                           ? "bg-[#2a2a2a] text-[#ededed] shadow-sm"
                           : "text-[#888] hover:text-[#ededed]"
                       }`}
                     >
                       {label}
                     </button>
                   ))}
                 </div>
                 
                 <div className="text-[11px] text-[#525252] font-mono hidden xl:block">
                   Press <kbd className="px-1.5 py-0.5 rounded-md bg-[#1a1a1a] border border-[#2a2a2a]">⌃</kbd> <kbd className="px-1.5 py-0.5 rounded-md bg-[#1a1a1a] border border-[#2a2a2a]">↵</kbd> to run
                 </div>
               </div>

               <button
                 onClick={() => enhancePrompt(false)}
                 disabled={!canEnhance}
                 className="flex items-center justify-center gap-2 bg-[#ededed] text-[#0a0a0a] hover:bg-white disabled:bg-[#333] disabled:text-[#666] disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-semibold transition-colors w-full sm:w-auto shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] focus-visible:ring-[#ededed]"
               >
                 {loading && !isRegenerating ? (
                   <Loader2 className="w-4 h-4 animate-spin" />
                 ) : (
                   <Sparkles className="w-4 h-4" />
                 )}
                 {loading && !isRegenerating ? "Enhancing..." : "Enhance"}
               </button>
             </div>
          </div>

        </div>
      </div>

      {/* ══════════════ OUTPUT PANEL ══════════════ */}
      {hasContent && (
        <div className="w-full lg:w-1/2 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] animate-fade-in">
          <div className={`flex flex-col h-full min-h-[580px] lg:min-h-[640px] bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${
            output && !loading ? "border-[#444]" : ""
          }`}>

            {/* Output Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f] bg-[#0d0d0d] shrink-0">
               <div className="flex items-center gap-2.5">
                 <div className={`w-2 h-2 rounded-full ${loading ? "bg-[#888] animate-pulse" : output ? "bg-[#ededed]" : "bg-[#333]"}`} />
                 <span className="text-sm font-medium text-[#ededed]">Enhanced Prompt</span>
                 {output && !loading && versions.length > 0 && (
                   <span className="text-[10px] text-[#888] ml-1 bg-[#1a1a1a] px-1.5 py-0.5 rounded border border-[#2a2a2a] font-mono uppercase tracking-widest">
                     v{activeVersion}
                   </span>
                 )}
               </div>

               {/* Action buttons */}
               {output && !loading && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        trackEvent("try_in_promai", { mode, intensity });
                        router.push(`/promai?test=${encodeURIComponent(output)}`);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[#888] hover:text-[#ededed] hover:bg-[#1a1a1a] transition-colors text-xs font-medium"
                      title="Test this prompt with PromAI"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Try it</span>
                    </button>
                    
                    <button
                      onClick={() => enhancePrompt(true)}
                      disabled={isRegenerating}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[#888] hover:text-[#ededed] hover:bg-[#1a1a1a] transition-colors text-xs font-medium disabled:opacity-50"
                      title="Regenerate"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                      <span className="hidden sm:inline">Retry</span>
                    </button>

                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[#888] hover:text-[#ededed] hover:bg-[#1a1a1a] transition-colors text-xs font-medium"
                      title="Copy to clipboard"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-[#ededed]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{isCopied ? "Copied" : "Copy"}</span>
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setIsPlatformMenuOpen(!isPlatformMenuOpen)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          isPlatformMenuOpen
                            ? "bg-[#1a1a1a] text-[#ededed]"
                            : "text-[#888] hover:text-[#ededed] hover:bg-[#1a1a1a]"
                        }`}
                        title="Open in AI Platform"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Open in...</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isPlatformMenuOpen ? "rotate-180" : ""}`} />
                      </button>
                      
                      {isPlatformMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsPlatformMenuOpen(false)} />
                          <div className="absolute right-0 mt-2 w-36 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg shadow-xl z-20 flex flex-col overflow-hidden py-1">
                            {(() => {
                              const llmPlatforms = [
                                { name: "ChatGPT", url: (p: string) => `https://chatgpt.com/?q=${encodeURIComponent(p)}` },
                                { name: "Claude", url: () => `https://claude.ai/new` },
                                { name: "Perplexity", url: (p: string) => `https://www.perplexity.ai/?q=${encodeURIComponent(p)}` },
                                { name: "Gemini", url: () => `https://gemini.google.com/` },
                              ];
                              
                              const imagePlatforms = [
                                { name: "Midjourney", url: () => `https://www.midjourney.com/` },
                                { name: "DALL-E", url: (p: string) => `https://chatgpt.com/?q=${encodeURIComponent("Generate an image: " + p)}` },
                                { name: "Bing Image", url: () => `https://www.bing.com/create` },
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
                                  className="px-3 py-2 text-xs text-[#a1a1a1] hover:text-[#ededed] hover:bg-[#1a1a1a] transition-colors text-left flex items-center justify-between group/btn"
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

            {feedback && (
              <FeedbackReaction
                promptId={feedback.promptId}
                onDismiss={() => setFeedback(null)}
              />
            )}

            {/* Output Body */}
            <div className="flex-1 min-h-0 overflow-y-auto relative">
              {loading ? (
                <div className="p-5 sm:p-6 space-y-4 animate-pulse">
                  <div className="h-3 bg-[#1a1a1a] rounded w-4/5" />
                  <div className="h-3 bg-[#1a1a1a] rounded w-full" />
                  <div className="h-3 bg-[#1a1a1a] rounded w-3/4" />
                  <div className="h-3 bg-[#1a1a1a] rounded w-full mt-6" />
                  <div className="h-3 bg-[#1a1a1a] rounded w-5/6" />
                  <div className="h-3 bg-[#1a1a1a] rounded w-full" />
                </div>
              ) : output ? (
                <div className="p-5 sm:p-6 text-[#d4d4d4] text-[15px] leading-relaxed space-y-1">
                  <ReactMarkdown
                    components={{
                      p:      ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-[#ededed]">{children}</strong>,
                      em:     ({ children }) => <em className="italic text-[#a1a1a1]">{children}</em>,
                      h1:     ({ children }) => <h1 className="text-lg font-semibold mb-3 mt-6 text-[#ededed]">{children}</h1>,
                      h2:     ({ children }) => <h2 className="text-base font-medium mb-2 mt-5 text-[#ededed]">{children}</h2>,
                      h3:     ({ children }) => <h3 className="text-sm font-medium mb-2 mt-4 text-[#d4d4d4]">{children}</h3>,
                      ul:     ({ children }) => <ul className="mb-4 space-y-1.5 pl-2">{children}</ul>,
                      ol:     ({ children }) => <ol className="mb-4 space-y-1.5 list-decimal pl-5">{children}</ol>,
                      li:     ({ children }) => (
                        <li className="flex gap-2.5 items-start">
                          <span className="mt-2 w-1 h-1 rounded-full bg-[#666] shrink-0" />
                          <span>{children}</span>
                        </li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l border-[#333] pl-4 my-4 text-[#888] italic text-sm">{children}</blockquote>
                      ),
                      code:   ({ children, className }) => {
                        const isBlock = className?.includes("language-");
                        return isBlock
                          ? <code className="block bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 text-[13px] font-mono text-[#ededed] overflow-x-auto my-4">{children}</code>
                          : <code className="bg-[#1a1a1a] border border-[#2a2a2a] px-1.5 py-0.5 rounded text-[13px] font-mono text-[#ededed]">{children}</code>;
                      },
                      pre:    ({ children }) => <pre className="m-0 p-0 bg-transparent">{children}</pre>,
                      hr:     () => <hr className="border-[#2a2a2a] my-6" />,
                    }}
                  >
                    {output}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4 px-8 max-w-sm">
                    <div className="mx-auto w-12 h-12 rounded-full bg-[#0d0d0d] border border-[#1f1f1f] flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#444]" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-[#a1a1a1]">Ready to enhance</p>
                      <p className="text-[13px] text-[#525252] leading-relaxed">
                        Enter your rough prompt on the left, adjust your settings, and press <span className="text-[#888] font-mono bg-[#1a1a1a] px-1 py-0.5 rounded border border-[#2a2a2a]">⌃↵</span> to refine it.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Refinements + version history */}
            {output && !loading && (
              <div className="px-4 py-3 border-t border-[#1f1f1f] bg-[#0d0d0d] shrink-0 flex flex-col gap-3">
                {versions.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <span className="text-[10px] font-semibold text-[#525252] uppercase tracking-widest mr-1">History</span>
                    {versions.map(v => (
                       <button
                         key={v.version_number}
                         onClick={() => setActiveVersion(v.version_number)}
                         className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors whitespace-nowrap ${
                           v.version_number === activeVersion
                             ? "bg-[#2a2a2a] text-[#ededed] border-[#444]"
                             : "bg-transparent text-[#666] border-transparent hover:text-[#888] hover:bg-[#1a1a1a]"
                         }`}
                       >
                         v{v.version_number} {v.action_label ? `· ${v.action_label}` : ""}
                       </button>
                    ))}
                  </div>
                )}
                
                <div>
                   <div className="flex items-center justify-between mb-1.5">
                     <span className="text-[10px] font-semibold text-[#525252] uppercase tracking-widest">Refine</span>
                     {!promptId && (
                       <span className="text-[10px] text-[#525252] italic">
                         Save prompt to unlock
                       </span>
                     )}
                   </div>
                   <div className="flex flex-wrap gap-1.5">
                     {quickActions.map(action => {
                       const Icon = QUICK_ACTION_ICONS[action.id] ?? Sparkles;
                       const isRefining = refiningAction === action.id;
                       return (
                         <button
                           key={action.id}
                           onClick={() => refinePrompt(action)}
                           disabled={!promptId || refiningAction !== null}
                           className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#2a2a2a] bg-[#0f0f0f] text-[11px] font-medium text-[#888] hover:text-[#ededed] hover:bg-[#1a1a1a] transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#525252]"
                         >
                           {isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
                           {action.label}
                         </button>
                       )
                     })}
                   </div>
                   {refineError && (
                     <p className="text-[10px] text-red-400/80 mt-1.5">{refineError}</p>
                   )}
                </div>
              </div>
            )}

            {/* Output Footer — stats */}
            {output && !loading && (
              <div className="px-4 py-2.5 border-t border-[#1f1f1f] bg-[#0a0a0a] shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[11px] font-mono text-[#525252]">
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-[#525252]" />
                    {wordCount} words
                  </span>
                  <span>·</span>
                  <span>~{tokenEst} tokens</span>
                </div>
                <span className="text-[11px] font-mono text-[#525252]">
                  {mode} / {intensity}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}