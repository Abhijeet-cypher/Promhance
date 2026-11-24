"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Copy,
  Check,
  Trash2,
  Wand2,
  LogIn,
  Loader2,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { getAnonId } from "@/lib/anon-id";

const PAGE_SIZE = 10;

/** Matches the modes offered in the enhancer. */
const MODE_FILTERS = [
  "LLM Prompt",
  "General",
  "Image Generation",
  "Creative Writing",
  "Technical/Code",
  "Marketing",
];

/** Text longer than this gets a "Show more" toggle. */
const COLLAPSE_CHARS = 280;

/** Builds a compact page list (numbers + ellipses) for the pager. */
function pageWindow(current: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push("...");
  pages.push(totalPages);
  return pages;
}

type PromptVersion = {
  id: string | null;
  version_number: number;
  text: string;
  action: string | null;
  action_label: string | null;
  created_at: string;
};

type Prompt = {
  id: string;
  anon_id: string;
  user_id: string | null;
  original_prompt: string;
  enhanced_prompt: string;
  mode: string | null;
  intensity: string | null;
  research_used?: boolean;
  created_at: string;
  versions?: PromptVersion[];
};

/** Returns a prompt's versions, synthesizing v1 when none are stored. */
function getVersions(prompt: Prompt): PromptVersion[] {
  if (prompt.versions && prompt.versions.length > 0) return prompt.versions;
  return [
    {
      id: null,
      version_number: 1,
      text: prompt.enhanced_prompt,
      action: "base",
      action_label: null,
      created_at: prompt.created_at,
    },
  ];
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

/** "5m ago", "3h ago", "Yesterday", or a short date for older items. */
function relativeTime(value: string): string {
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return value;
  const minutes = Math.floor((Date.now() - then) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(then)
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-[#1f1f1f] bg-[#111111] p-5 space-y-3">
      <div className="flex gap-2">
        <div className="h-5 w-20 rounded-md bg-[#1a1a1a]" />
        <div className="h-5 w-14 rounded-md bg-[#1a1a1a]" />
      </div>
      <div className="h-3 w-3/4 rounded bg-[#1a1a1a]" />
      <div className="h-16 rounded-xl bg-[#0d0d0d]" />
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded-lg bg-[#1a1a1a]" />
        <div className="h-8 w-32 rounded-lg bg-[#1a1a1a]" />
      </div>
    </div>
  );
}

/** Two columns on xl screens (>= 1280px), otherwise one. */
const XL_QUERY = "(min-width: 1280px)";

function subscribeToViewport(onChange: () => void) {
  const mql = window.matchMedia(XL_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export default function HistoryClient() {
  const router = useRouter();
  const columnCount = useSyncExternalStore(
    subscribeToViewport,
    () => (window.matchMedia(XL_QUERY).matches ? 2 : 1),
    () => 1
  );
  const { user, loading: authLoading } = useAuth();

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedVersion, setSelectedVersion] = useState<Record<string, number>>({});

  // Debounce the search box; a new search always starts from page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (authLoading) return;

    let active = true;
    const controller = new AbortController();

    (async () => {
      // Defer past the synchronous effect body to avoid a cascading render.
      await Promise.resolve();
      if (!active) return;

      setLoading(true);
      setError(null);
      try {
        const anonId = getAnonId();
        const params = new URLSearchParams({
          anon_id: anonId,
          limit: String(PAGE_SIZE),
          offset: String((page - 1) * PAGE_SIZE),
        });
        const search = debouncedQuery.trim();
        if (search) params.set("q", search);
        if (modeFilter) params.set("mode", modeFilter);

        const res = await fetch(`/api/prompts?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          if (active) {
            setError(data?.error ?? "Could not load your history.");
            setPrompts([]);
            setTotal(0);
          }
          return;
        }
        const data = await res.json();
        if (active) {
          const nextPrompts = Array.isArray(data.prompts) ? data.prompts : [];
          const nextTotal =
            typeof data.total === "number" ? data.total : nextPrompts.length;
          setPrompts(nextPrompts);
          setTotal(nextTotal);

          // If the current page no longer exists (e.g. after deletions),
          // step back to the last valid page.
          const maxPage = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
          if (page > maxPage) setPage(maxPage);
        }
      } catch (err) {
        if (active && (err as Error).name !== "AbortError") {
          setError("Could not load your history.");
          setPrompts([]);
          setTotal(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [authLoading, user?.id, page, debouncedQuery, modeFilter, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtering = query.trim() !== "" || modeFilter !== "";

  // Bring the list back into view when paging (pagination sits at the bottom).
  useEffect(() => {
    if (page > 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page]);

  const handleCopy = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(key);
      setTimeout(() => setCopiedId((id) => (id === key ? null : id)), 1800);
    } catch {
      // Clipboard unavailable — no-op.
    }
  }, []);

  const handleDelete = useCallback(async (prompt: Prompt) => {
    setDeletingId(prompt.id);
    try {
      const anonId = getAnonId();
      const res = await fetch(
        `/api/prompts?id=${encodeURIComponent(prompt.id)}&anon_id=${encodeURIComponent(anonId)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        // Deleting the only row on a page steps back; otherwise refill in place.
        if (prompts.length === 1 && page > 1) {
          setPage((p) => p - 1);
        } else {
          setReloadKey((k) => k + 1);
        }
      }
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }, [prompts.length, page]);

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const chooseMode = (mode: string) => {
    setModeFilter((current) => (current === mode ? "" : mode));
    setPage(1);
  };

  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setModeFilter("");
    setPage(1);
  };

  // Deal prompts into columns left-to-right so reading order stays newest-first.
  const columns = Array.from({ length: columnCount }, (_, c) =>
    prompts.filter((_, i) => i % columnCount === c)
  );

  const showToolbar =
    !authLoading && (total > 0 || prompts.length > 0 || filtering);

  return (
    <div className="w-full">
      {/* Header row */}
      <div className="flex flex-col items-center text-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Your prompt history
          </h1>
          <p className="text-sm text-[#a1a1a1] mt-2">
            {user
              ? "Synced to your account — available on any device."
              : "Saved on this device. Sign in to sync across devices."}
            {!loading && !error && total > 0 && !filtering && (
              <span className="text-[#525252]">
                {" "}
                · {total} {total === 1 ? "prompt" : "prompts"}
              </span>
            )}
          </p>
        </div>

        {!user && !authLoading && (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/15 hover:border-blue-500/45 transition-all"
          >
            <LogIn className="w-4 h-4" />
            Sign in to sync
          </Link>
        )}
      </div>

      {/* Sidebar (search + filters) on large screens, stacked above the list otherwise */}
      <div
        className={`grid gap-6 lg:gap-10 items-start ${
          showToolbar ? "lg:grid-cols-[260px_minmax(0,1fr)]" : ""
        }`}
      >
      {showToolbar && (
        <aside className="space-y-3 lg:sticky lg:top-28">
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your prompts…"
              className="w-full bg-[#111111] border border-[#2a2a2a] rounded-xl pl-10 pr-10 py-3 text-sm text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all placeholder:text-[#3a3a3a]"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#525252] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="hidden lg:block pt-2 text-[11px] font-semibold uppercase tracking-widest text-[#525252]">
            Prompt type
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] lg:flex-col lg:gap-1 lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0">
            {["", ...MODE_FILTERS].map((mode) => {
              const active = modeFilter === mode;
              return (
                <button
                  key={mode || "all"}
                  onClick={() => (mode ? chooseMode(mode) : clearFilters())}
                  aria-pressed={active || (mode === "" && !modeFilter)}
                  className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all lg:w-full lg:text-left lg:text-sm lg:rounded-xl lg:px-3.5 lg:py-2 ${
                    active || (mode === "" && !modeFilter)
                      ? "bg-blue-500/15 text-blue-300 border-blue-500/40"
                      : "bg-[#111111] text-[#a1a1a1] border-[#2a2a2a] hover:text-white hover:border-[#3a3a3a]"
                  }`}
                >
                  {mode || "All"}
                </button>
              );
            })}
          </div>

          {/* Summary + shortcut: fills the sidebar and gives a clear next action */}
          <div className="hidden lg:block mt-4 rounded-2xl border border-[#2a2a2a] bg-[#111111] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#525252]">
              {filtering ? "Matching prompts" : "Total prompts"}
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-white tabular-nums">
              {total}
            </p>
            <Link
              href="/"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-400"
            >
              <Sparkles className="w-4 h-4" />
              New prompt
            </Link>
            {!user && (
              <p className="mt-3 text-xs leading-relaxed text-[#525252]">
                Stored on this device only.{" "}
                <Link href="/login" className="text-blue-400 hover:text-blue-300">
                  Sign in
                </Link>{" "}
                to keep it across devices.
              </p>
            )}
          </div>
        </aside>
      )}

      <div className="min-w-0">
      {loading && prompts.length === 0 ? (
        <div className="grid gap-4 xl:grid-cols-2" aria-label="Loading history">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-400/70" strokeWidth={1.5} />
          <p className="text-sm text-[#a1a1a1]">{error}</p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Try again
          </button>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-5 rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0d0d0d]/60">
          <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
            {filtering ? (
              <Search className="w-6 h-6 text-blue-500/40" strokeWidth={1.5} />
            ) : (
              <Clock className="w-6 h-6 text-blue-500/40" strokeWidth={1.5} />
            )}
          </div>
          <div className="space-y-1.5 px-6">
            <p className="text-base font-medium text-white">
              {filtering ? "No matching prompts" : "No prompts yet"}
            </p>
            <p className="text-sm text-[#525252] max-w-sm">
              {filtering
                ? "Try a different search term or clear the filters."
                : "Every prompt you enhance is saved here automatically, so you can reuse it any time."}
            </p>
          </div>
          {filtering ? (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-[#111111] border border-[#2a2a2a] text-[#d4d4d4] hover:border-[#3a3a3a] hover:text-white transition-all"
            >
              Clear filters
            </button>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-500 text-white hover:bg-blue-400 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Enhance your first prompt
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className={`transition-opacity ${loading ? "opacity-60 pointer-events-none" : ""}`}>
                {/* Independent columns (masonry): expanding one card never stretches its neighbour. */}
                <div className={`grid gap-4 items-start ${columnCount === 2 ? "grid-cols-2" : ""}`}>
                {columns.map((column, columnIndex) => (
                <ul key={columnIndex} className="flex min-w-0 flex-col gap-4">
                  {column.map((prompt) => {
                    const versions = getVersions(prompt);
                    const activeNum =
                      selectedVersion[prompt.id] ?? versions[versions.length - 1].version_number;
                    const activeV =
                      versions.find((v) => v.version_number === activeNum) ??
                      versions[versions.length - 1];
                    const isOpen = expanded.has(prompt.id);
                    const canCollapse =
                      activeV.text.length > COLLAPSE_CHARS ||
                      prompt.original_prompt.length > 160;
                    const confirming = confirmDeleteId === prompt.id;

                    return (
                      <li
                        key={prompt.id}
                        className="flex flex-col bg-[#111111] border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-2xl p-4 sm:p-5 transition-all duration-200"
                      >
                        {/* Meta */}
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          {prompt.mode && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                              {prompt.mode}
                            </span>
                          )}
                          {prompt.intensity && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#1a1a1a] text-[#a1a1a1] border border-[#2a2a2a] capitalize">
                              {prompt.intensity}
                            </span>
                          )}
                          {prompt.research_used && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/25">
                              Deep research
                            </span>
                          )}
                          {versions.length > 1 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#1a1a1a] text-[#a1a1a1] border border-[#2a2a2a]">
                              {versions.length} versions
                            </span>
                          )}
                          <span
                            title={formatDate(prompt.created_at)}
                            className="text-[11px] text-[#525252] ml-auto flex items-center gap-1"
                          >
                            <Clock className="w-3 h-3" />
                            {relativeTime(prompt.created_at)}
                          </span>
                        </div>

                        {/* Original */}
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#525252] mb-1">
                          Original
                        </p>
                        <p
                          className={`text-sm text-[#a1a1a1] leading-relaxed whitespace-pre-wrap break-words mb-4 ${
                            isOpen ? "" : "line-clamp-2"
                          }`}
                        >
                          {prompt.original_prompt}
                        </p>

                        {/* Enhanced */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-400/80">
                            Enhanced
                            {activeV.action_label ? ` · ${activeV.action_label}` : ""}
                          </p>
                          {versions.length > 1 && (
                            <div className="flex items-center gap-1">
                              {versions.map((v) => {
                                const isActive = v.version_number === activeV.version_number;
                                return (
                                  <button
                                    key={v.version_number}
                                    onClick={() =>
                                      setSelectedVersion((prev) => ({
                                        ...prev,
                                        [prompt.id]: v.version_number,
                                      }))
                                    }
                                    title={v.action_label ?? "Initial enhancement"}
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all ${
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
                          )}
                        </div>
                        <div className="rounded-xl bg-[#0a0a0a] border border-[#1f1f1f] px-3.5 py-3 mb-3">
                          <p
                            className={`text-sm text-[#d4d4d4] leading-relaxed whitespace-pre-wrap break-words ${
                              isOpen ? "" : "line-clamp-4"
                            }`}
                          >
                            {activeV.text}
                          </p>
                        </div>

                        {canCollapse && (
                          <button
                            onClick={() => toggleExpanded(prompt.id)}
                            aria-expanded={isOpen}
                            className="mb-3 flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                            {isOpen ? "Show less" : "Show full prompt"}
                          </button>
                        )}

                        {/* Actions */}
                        <div className="mt-auto flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleCopy(prompt.id, activeV.text)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                              copiedId === prompt.id
                                ? "bg-blue-500/15 text-blue-300 border-blue-500/40"
                                : "bg-[#0a0a0a] text-[#a1a1a1] border-[#2a2a2a] hover:text-white hover:border-[#3a3a3a]"
                            }`}
                          >
                            {copiedId === prompt.id ? (
                              <><Check className="w-3.5 h-3.5" /> Copied</>
                            ) : (
                              <><Copy className="w-3.5 h-3.5" /> Copy</>
                            )}
                          </button>

                          <button
                            onClick={() =>
                              router.push(
                                `/?prompt=${encodeURIComponent(prompt.id)}&version=${activeV.version_number}`
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] text-[#a1a1a1] hover:text-white hover:border-[#3a3a3a] transition-all text-xs font-medium"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            Open in enhancer
                          </button>

                          <div className="ml-auto flex items-center gap-2">
                            {confirming ? (
                              <>
                                <span className="text-xs text-[#a1a1a1]">Delete?</span>
                                <button
                                  onClick={() => handleDelete(prompt)}
                                  disabled={deletingId === prompt.id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-all text-xs font-medium disabled:opacity-50"
                                >
                                  {deletingId === prompt.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                  Yes, delete
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  disabled={deletingId === prompt.id}
                                  className="px-3 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] text-[#a1a1a1] hover:text-white transition-all text-xs font-medium"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(prompt.id)}
                                aria-label="Delete prompt"
                                title="Delete prompt"
                                className="flex items-center px-2.5 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] text-[#525252] hover:text-red-400 hover:border-red-500/30 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                ))}
                </div>
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-5 border-t border-[#1f1f1f]">
              <p className="text-xs text-[#525252] tabular-nums">
                Showing{" "}
                <span className="text-[#a1a1a1]">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}
                </span>{" "}
                of <span className="text-[#a1a1a1]">{total}</span>
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    aria-label="Previous page"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] text-[#a1a1a1] hover:text-white hover:border-[#3a3a3a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {pageWindow(page, totalPages).map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-[#525252]">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        disabled={loading}
                        aria-current={p === page ? "page" : undefined}
                        className={`min-w-[32px] h-8 px-2 flex items-center justify-center rounded-lg border text-xs font-medium transition-all disabled:cursor-not-allowed ${
                          p === page
                            ? "bg-blue-500/15 text-blue-300 border-blue-500/40"
                            : "bg-[#0a0a0a] text-[#a1a1a1] border-[#2a2a2a] hover:text-white hover:border-[#3a3a3a]"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    aria-label="Next page"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] text-[#a1a1a1] hover:text-white hover:border-[#3a3a3a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
      </div>
      </div>
    </div>
  );
}
