"use client";

import { useState, useMemo, useCallback, useRef, useId } from "react";
import type { ViralPromptJSON } from "@/lib/viral-prompts-types";
import { getEra, normaliseType } from "@/lib/viral-prompts-data";
import {
  Search, Copy, Check, X, SlidersHorizontal,
  ChevronDown, Sparkles, Zap, Flame, Clock,
  Image as ImageIcon, Video, Music, FileText, Lightbulb, Hash,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS / CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

const ERA_BADGE = {
  current: {
    label: "⚡ Current 2025–2026",
    short: "Current",
    icon: Zap,
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    dot: "bg-blue-400",
  },
  peak: {
    label: "🔥 Peak 2024–2025",
    short: "Peak",
    icon: Flame,
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    dot: "bg-amber-400",
  },
  classic: {
    label: "📅 Classic 2022–2023",
    short: "Classic",
    icon: Clock,
    text: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/25",
    dot: "bg-purple-400",
  },
} as const;

const TYPE_BADGE: Record<string, { text: string; bg: string; border: string; Icon: typeof ImageIcon }> = {
  "Image":      { text: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-500/25",   Icon: ImageIcon },
  "Video":      { text: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/25",   Icon: Video },
  "Music":      { text: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/25",Icon: Music },
  "Script":     { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/25", Icon: FileText },
  "Text / Post":{ text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/25", Icon: Hash },
  "Concept":    { text: "text-teal-400",   bg: "bg-teal-500/10",   border: "border-teal-500/25",   Icon: Lightbulb },
  "Other":      { text: "text-gray-400",   bg: "bg-gray-500/10",   border: "border-gray-500/25",   Icon: Sparkles },
};

const ALL_TYPES = ["Image", "Video", "Music", "Script", "Text / Post", "Concept"];

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

/** Highlight matched query substring inside text */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-blue-500/30 text-blue-200 rounded-sm px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

/** Pill filter button */
function Pill({
  active,
  onClick,
  children,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
        active
          ? "bg-blue-500 border-blue-500 text-white shadow-[0_0_14px_rgba(59,130,246,0.4)]"
          : "bg-[#111111] border-[#242424] text-[#888] hover:text-white hover:border-[#3a3a3a]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   COPY BUTTON
───────────────────────────────────────────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2200);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy prompt"}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
        copied
          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
          : "bg-[#181818] border-[#2a2a2a] text-[#888] hover:text-white hover:bg-[#222] hover:border-[#3a3a3a]"
      }`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          Copy
        </>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROMPT CARD
───────────────────────────────────────────────────────────────────────────── */

function PromptCard({
  prompt,
  query,
  index,
}: {
  prompt: ViralPromptJSON;
  query: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const era = getEra(prompt.trend_year);
  const normType = normaliseType(prompt.type);
  const eraConf = ERA_BADGE[era];
  const typeConf = TYPE_BADGE[normType] ?? TYPE_BADGE["Other"];
  const TypeIcon = typeConf.Icon;

  const isLong = prompt.prompt_text.length > 180;

  return (
    <article
      id={`prompt-${prompt.id}`}
      aria-label={prompt.style ? `${prompt.style} prompt` : `${normType} prompt #${prompt.id}`}
      className="group relative flex flex-col bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl overflow-hidden hover:border-[#2a2a2a] transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.08),0_8px_32px_rgba(0,0,0,0.4)]"
      style={{ animationDelay: `${(index % 12) * 40}ms` }}
    >
      {/* Top accent line — era colour */}
      <div
        className={`h-px w-full ${
          era === "current"
            ? "bg-gradient-to-r from-transparent via-blue-500/60 to-transparent"
            : era === "peak"
            ? "bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"
            : "bg-gradient-to-r from-transparent via-purple-500/60 to-transparent"
        }`}
      />

      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Header — badges row */}
        <header className="flex flex-wrap items-center gap-2">
          {/* Era badge */}
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${eraConf.bg} ${eraConf.border} ${eraConf.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${eraConf.dot} shrink-0`} />
            {eraConf.short}
          </span>

          {/* Type badge */}
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${typeConf.bg} ${typeConf.border} ${typeConf.text}`}
          >
            <TypeIcon className="w-2.5 h-2.5" />
            {normType}
          </span>

          {/* Prompt number */}
          <span className="ml-auto text-[10px] text-[#3a3a3a] font-mono tabular-nums">
            #{String(prompt.id).padStart(3, "0")}
          </span>
        </header>

        {/* Style / title */}
        {prompt.style && (
          <h3 className="text-sm font-semibold text-white leading-tight tracking-tight">
            {prompt.style}
          </h3>
        )}

        {/* Prompt text */}
        <div className="relative">
          <p
            className={`text-sm text-[#b0b0b0] leading-[1.75] ${
              !expanded && isLong ? "line-clamp-4" : ""
            }`}
          >
            <Highlight text={prompt.prompt_text} query={query} />
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-[11px] text-blue-500 hover:text-blue-400 font-medium transition-colors"
            >
              {expanded ? "Show less ↑" : "Show full prompt ↓"}
            </button>
          )}
        </div>

        {/* Platform tag */}
        <p className="text-[10px] text-[#444] uppercase tracking-wider font-semibold truncate">
          {prompt.section}
        </p>

        {/* Divider */}
        <div className="h-px bg-[#1a1a1a]" />

        {/* Footer */}
        <footer className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {/* trend_category as a subtle tag */}
            <span className="text-[10px] text-[#3d3d3d] bg-[#171717] border border-[#242424] px-2 py-0.5 rounded-full font-medium truncate max-w-[140px]">
              {prompt.trend_category}
            </span>
          </div>
          <CopyButton text={prompt.prompt_text} />
        </footer>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION GROUP HEADER (rendered inside the list for SEO)
───────────────────────────────────────────────────────────────────────────── */

function SectionDivider({ label, count }: { label: string; count: number }) {
  return (
    <div className="col-span-full flex items-center gap-4 pt-4 pb-2">
      <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-[#555] shrink-0">
        {label}
      </h2>
      <div className="flex-1 h-px bg-[#1e1e1e]" />
      <span className="text-[10px] text-[#333] font-mono shrink-0">{count} prompts</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STATS BAR
───────────────────────────────────────────────────────────────────────────── */

function StatsBar({ prompts }: { prompts: ViralPromptJSON[] }) {
  const counts = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const p of prompts) {
      const t = normaliseType(p.type);
      byType[t] = (byType[t] || 0) + 1;
    }
    return byType;
  }, [prompts]);

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {entries.map(([type, count]) => {
        const conf = TYPE_BADGE[type] ?? TYPE_BADGE["Other"];
        const Icon = conf.Icon;
        return (
          <div
            key={type}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${conf.bg} ${conf.border} ${conf.text}`}
          >
            <Icon className="w-3 h-3" />
            {type} <span className="font-bold">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN CLIENT COMPONENT
───────────────────────────────────────────────────────────────────────────── */

const PER_PAGE = 48;

export default function ViralPromptsClient({ prompts }: { prompts: ViralPromptJSON[] }) {
  const searchId = useId();

  // ── State ──────────────────────────────────────────────────────────────────
  const [query,      setQuery]      = useState("");
  const [activeType, setActiveType] = useState("All");
  const [activeEra,  setActiveEra]  = useState("All");
  const [activeSec,  setActiveSec]  = useState("All");
  const [showPanel,  setShowPanel]  = useState(false);
  const [page,       setPage]       = useState(1);
  const [groupBySec, setGroupBySec] = useState(false);

  // ── Derived unique values ──────────────────────────────────────────────────
  const sections = useMemo(
    () => ["All", ...Array.from(new Set(prompts.map((p) => p.section))).sort()],
    [prompts]
  );

  const eras = ["All", "⚡ Current 2025–2026", "🔥 Peak 2024–2025", "📅 Classic 2022–2023"];

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return prompts.filter((p) => {
      if (activeSec  !== "All" && p.section !== activeSec) return false;
      if (activeType !== "All" && normaliseType(p.type) !== activeType) return false;
      if (activeEra  !== "All") {
        const era = getEra(p.trend_year);
        if (activeEra.includes("Current") && era !== "current") return false;
        if (activeEra.includes("Peak")    && era !== "peak")    return false;
        if (activeEra.includes("Classic") && era !== "classic") return false;
      }
      if (q) {
        return (
          p.prompt_text.toLowerCase().includes(q) ||
          p.style?.toLowerCase().includes(q) ||
          p.section.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          p.trend_category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [prompts, query, activeSec, activeType, activeEra]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore   = paginated.length < filtered.length;

  // ── Section grouping ───────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    if (!groupBySec) return null;
    const map: Map<string, ViralPromptJSON[]> = new Map();
    for (const p of paginated) {
      const arr = map.get(p.section) ?? [];
      arr.push(p);
      map.set(p.section, arr);
    }
    return map;
  }, [paginated, groupBySec]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const hasFilters = query || activeType !== "All" || activeEra !== "All" || activeSec !== "All";

  const reset = () => {
    setQuery("");
    setActiveType("All");
    setActiveEra("All");
    setActiveSec("All");
    setPage(1);
  };

  const applyFilter = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  /* ───────────────────────────────────────────────────────────────────────────
     RENDER
  ─────────────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-14 px-4 text-center overflow-hidden">
        {/* ambient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/6 blur-[140px] rounded-full" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-blue-400 mb-5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Sparkles className="w-3 h-3" />
            Promhance Vault — June 2026
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-white tracking-tight leading-[1.1] mb-5">
            Viral{" "}
            <span className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 bg-clip-text text-transparent">
              Prompt
            </span>{" "}
            Collection
          </h1>

          <p className="text-[#777] text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            {prompts.length}+ hand-curated viral prompts — Image, Video, Music, Scripts & Text.
            Trending across every major platform and AI tool.
          </p>

          {/* Era legend */}
          <div className="flex flex-wrap justify-center gap-4 text-xs text-[#666] mb-8">
            <span className="flex items-center gap-1.5 text-blue-400"><Zap className="w-3 h-3" /> Currently viral</span>
            <span className="flex items-center gap-1.5 text-amber-400"><Flame className="w-3 h-3" /> Peak trend</span>
            <span className="flex items-center gap-1.5 text-purple-400"><Clock className="w-3 h-3" /> Classic / evergreen</span>
          </div>

          {/* Stats breakdown */}
          <div className="flex justify-center">
            <StatsBar prompts={prompts} />
          </div>
        </div>
      </section>

      {/* ── STICKY TOOLBAR ───────────────────────────────────────────────── */}
      <div className="sticky top-[64px] z-30 bg-[#0a0a0a]/95 backdrop-blur-2xl border-b border-[#181818]">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 py-3">

          {/* Row 1: search + controls */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <label htmlFor={searchId} className="sr-only">Search prompts</label>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444] pointer-events-none" />
              <input
                id={searchId}
                type="search"
                autoComplete="off"
                placeholder="Search by style, keyword, platform…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#111] border border-[#222] text-sm text-[#f0f0f0] placeholder:text-[#444] focus:outline-none focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] transition-all"
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowPanel(!showPanel)}
              aria-expanded={showPanel}
              aria-label="Toggle filters"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                showPanel
                  ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                  : "bg-[#111] border-[#222] text-[#888] hover:text-white hover:border-[#333]"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
            </button>

            {/* Group by section toggle */}
            <button
              onClick={() => setGroupBySec(!groupBySec)}
              title={groupBySec ? "Disable grouping" : "Group by platform"}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all hidden sm:flex items-center gap-2 ${
                groupBySec
                  ? "bg-[#111] border-blue-500/40 text-blue-400"
                  : "bg-[#111] border-[#222] text-[#666] hover:text-white hover:border-[#333]"
              }`}
            >
              Group
            </button>

            {/* Clear */}
            {hasFilters && (
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#222] text-[#666] hover:text-white text-xs transition-all"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            {/* Count (desktop) */}
            <p className="hidden md:block ml-auto text-xs text-[#444] shrink-0 tabular-nums">
              <span className="text-white font-medium">{filtered.length}</span>
              <span className="mx-1">/</span>
              {prompts.length} prompts
            </p>
          </div>

          {/* Row 2: filter panel */}
          {showPanel && (
            <div className="flex flex-col gap-3 mt-3 pb-2 animate-fade-in border-t border-[#181818] pt-3">

              {/* Era quick buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-[#444] w-10 shrink-0">Era</span>
                {eras.map((e) => (
                  <Pill key={e} active={activeEra === e} onClick={() => applyFilter(setActiveEra, e)}>
                    {e === "All" ? "All Eras" : e}
                  </Pill>
                ))}
              </div>

              {/* Type buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-[#444] w-10 shrink-0">Type</span>
                <Pill active={activeType === "All"} onClick={() => applyFilter(setActiveType, "All")}>All</Pill>
                {ALL_TYPES.map((t) => {
                  const conf = TYPE_BADGE[t];
                  const Icon = conf.Icon;
                  return (
                    <Pill key={t} active={activeType === t} onClick={() => applyFilter(setActiveType, t)}>
                      <Icon className="w-3 h-3 inline mr-1" />
                      {t}
                    </Pill>
                  );
                })}
              </div>

              {/* Platform / section — horizontally scrollable */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-[#444] w-10 shrink-0">Platform</span>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                  {sections.map((s) => (
                    <Pill key={s} active={activeSec === s} onClick={() => applyFilter(setActiveSec, s)}>
                      {s === "All" ? "All Platforms" : s.replace(/\(.*?\)/g, "").trim()}
                    </Pill>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ACTIVE FILTER CHIPS ───────────────────────────────────────────── */}
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6">
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-5 items-center">
            <span className="text-[10px] text-[#444] uppercase tracking-wider font-bold">Active:</span>
            {query && (
              <FilterChip label={`"${query}"`} onRemove={() => { setQuery(""); setPage(1); }} />
            )}
            {activeEra !== "All" && (
              <FilterChip label={activeEra} onRemove={() => applyFilter(setActiveEra, "All")} />
            )}
            {activeType !== "All" && (
              <FilterChip label={activeType} onRemove={() => applyFilter(setActiveType, "All")} />
            )}
            {activeSec !== "All" && (
              <FilterChip label={activeSec.replace(/\(.*?\)/g, "").trim()} onRemove={() => applyFilter(setActiveSec, "All")} />
            )}
          </div>
        )}

        {/* Result count row */}
        <div className="flex items-center justify-between mt-5 mb-6">
          <p className="text-sm text-[#555]">
            Showing{" "}
            <span className="text-white font-semibold">{Math.min(paginated.length, filtered.length)}</span>
            {" "}of{" "}
            <span className="text-white font-semibold">{filtered.length}</span>
            {" "}prompts
            {activeType !== "All" || activeEra !== "All" || activeSec !== "All" ? " matching your filters" : ""}
          </p>
          {/* mobile count */}
          <p className="text-xs text-[#444] md:hidden">
            {filtered.length} / {prompts.length}
          </p>
        </div>
      </div>

      {/* ── PROMPT GRID ──────────────────────────────────────────────────── */}
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 pb-24">

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#111] border border-[#222] flex items-center justify-center">
              <Search className="w-7 h-7 text-[#333]" />
            </div>
            <div>
              <p className="text-white text-lg font-semibold mb-1">No prompts found</p>
              <p className="text-[#555] text-sm">Try a different keyword or adjust your filters</p>
            </div>
            <button
              onClick={reset}
              className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors"
            >
              Reset all filters
            </button>
          </div>
        )}

        {/* ── Grouped view ── */}
        {grouped && (
          <div className="space-y-12">
            {Array.from(grouped.entries()).map(([section, sectionPrompts]) => (
              <section key={section} aria-label={section}>
                <div className="flex items-center gap-4 mb-5">
                  <h2 className="text-xs font-extrabold tracking-[0.15em] uppercase text-[#555] shrink-0">
                    {section.replace(/\(.*?\)/g, "").trim()}
                  </h2>
                  <div className="flex-1 h-px bg-[#1a1a1a]" />
                  <span className="text-[10px] text-[#333] font-mono">{sectionPrompts.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sectionPrompts.map((p, i) => (
                    <PromptCard key={p.id} prompt={p} query={query} index={i} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ── Flat grid view ── */}
        {!grouped && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map((p, i) => (
              <PromptCard key={p.id} prompt={p} query={query} index={i} />
            ))}
          </div>
        )}

        {/* Load more */}
        {!grouped && hasMore && (
          <div className="flex flex-col items-center gap-3 mt-12">
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#111] border border-[#242424] text-sm font-semibold text-[#888] hover:text-white hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-200"
            >
              <ChevronDown className="w-4 h-4" />
              Load more — {filtered.length - paginated.length} remaining
            </button>
            <p className="text-[11px] text-[#333]">
              Showing {paginated.length} of {filtered.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* Inline small component to keep it co-located */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 text-xs bg-[#161616] border border-[#2a2a2a] text-[#aaa] px-3 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="text-[#555] hover:text-white transition-colors" aria-label={`Remove filter ${label}`}>
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
