"use client";

import { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { getAnonId } from "@/lib/anon-id";

const PAGE_SIZE = 10;

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

export default function HistoryClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
  }, [authLoading, user?.id, page, debouncedQuery, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Bring the list back into view when paging (pagination sits at the bottom).
  useEffect(() => {
    if (page > 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page]);

  const handleCopy = useCallback(async (promptId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(promptId);
      setTimeout(() => setCopiedId((id) => (id === promptId ? null : id)), 1800);
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
    }
  }, [prompts.length, page]);

  return (
    <div className="w-full">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Your prompt history
          </h1>
          <p className="text-sm text-[#a1a1a1] mt-1.5">
            {user
              ? "Synced to your account — available on any device."
              : "Saved on this device. Sign in to sync across devices."}
          </p>
        </div>

        {!user && (
          <Link
            href="/login"
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/15 hover:border-blue-500/45 transition-all"
          >
            <LogIn className="w-4 h-4" />
            Sign in to sync
          </Link>
        )}
      </div>

      {/* Search */}
      {!authLoading && (total > 0 || prompts.length > 0 || query.trim() !== "") && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" strokeWidth={1.75} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your prompts…"
            className="w-full bg-[#111111] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all placeholder:text-[#3a3a3a]"
          />
        </div>
      )}

      {loading && prompts.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-[#525252] gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading history…</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-400/70" strokeWidth={1.5} />
          <p className="text-sm text-[#a1a1a1]">{error}</p>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-500/30" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#a1a1a1]">
              {query.trim() === "" ? "No prompts yet" : "No matches"}
            </p>
            <p className="text-xs text-[#525252]">
              {query.trim() === ""
                ? "Enhance your first prompt and it will show up here."
                : "Try a different search term."}
            </p>
          </div>
          {query.trim() === "" && (
            <Link
              href="/"
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Enhance a prompt
            </Link>
          )}
        </div>
      ) : (
        <>
        <ul className={`space-y-3 transition-opacity ${loading ? "opacity-60 pointer-events-none" : ""}`}>
          {prompts.map((prompt) => {
            const versions = getVersions(prompt);
            const activeNum =
              selectedVersion[prompt.id] ?? versions[versions.length - 1].version_number;
            const activeV =
              versions.find((v) => v.version_number === activeNum) ??
              versions[versions.length - 1];

            return (
              <li
                key={prompt.id}
                className="bg-[#111111] border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-2xl p-5 transition-all duration-200"
              >
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {prompt.mode && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                      {prompt.mode}
                    </span>
                  )}
                  {prompt.intensity && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#1a1a1a] text-[#a1a1a1] border border-[#2a2a2a] capitalize">
                      {prompt.intensity}
                    </span>
                  )}
                  <span className="text-[10px] text-[#525252] ml-auto flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(prompt.created_at)}
                  </span>
                </div>

                <p className="text-xs text-[#525252] mb-1.5">Original</p>
                <p className="text-sm text-[#a1a1a1] leading-relaxed line-clamp-2 mb-4">
                  {prompt.original_prompt}
                </p>

                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-xs text-[#525252]">
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
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-all ${
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
                <p className="text-sm text-[#d4d4d4] leading-relaxed line-clamp-4 whitespace-pre-wrap mb-4">
                  {activeV.text}
                </p>

                <div className="flex flex-wrap items-center gap-2">
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

                  <button
                    onClick={() => handleDelete(prompt)}
                    disabled={deletingId === prompt.id}
                    aria-label="Delete prompt"
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] text-[#525252] hover:text-red-400 hover:border-red-500/30 transition-all text-xs font-medium disabled:opacity-50"
                  >
                    {deletingId === prompt.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-[#1f1f1f]">
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
  );
}
