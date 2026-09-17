"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { getAnonId } from "@/lib/anon-id";

type Prompt = {
  id: string;
  anon_id: string;
  user_id: string | null;
  original_prompt: string;
  enhanced_prompt: string;
  mode: string | null;
  intensity: string | null;
  created_at: string;
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        const res = await fetch(
          `/api/prompts?anon_id=${encodeURIComponent(anonId)}`,
          { cache: "no-store", signal: controller.signal }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          if (active) {
            setError(data?.error ?? "Could not load your history.");
            setPrompts([]);
          }
          return;
        }
        const data = await res.json();
        if (active) {
          setPrompts(Array.isArray(data.prompts) ? data.prompts : []);
        }
      } catch (err) {
        if (active && (err as Error).name !== "AbortError") {
          setError("Could not load your history.");
          setPrompts([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [authLoading, user?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return prompts;
    return prompts.filter(
      (p) =>
        p.original_prompt.toLowerCase().includes(q) ||
        p.enhanced_prompt.toLowerCase().includes(q) ||
        (p.mode ?? "").toLowerCase().includes(q)
    );
  }, [prompts, query]);

  const handleCopy = useCallback(async (prompt: Prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.enhanced_prompt);
      setCopiedId(prompt.id);
      setTimeout(() => setCopiedId((id) => (id === prompt.id ? null : id)), 1800);
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
        setPrompts((prev) => prev.filter((p) => p.id !== prompt.id));
      }
    } finally {
      setDeletingId(null);
    }
  }, []);

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
      {!loading && prompts.length > 0 && (
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

      {loading ? (
        <div className="flex items-center justify-center py-24 text-[#525252] gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading history…</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-400/70" strokeWidth={1.5} />
          <p className="text-sm text-[#a1a1a1]">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-500/30" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#a1a1a1]">
              {prompts.length === 0 ? "No prompts yet" : "No matches"}
            </p>
            <p className="text-xs text-[#525252]">
              {prompts.length === 0
                ? "Enhance your first prompt and it will show up here."
                : "Try a different search term."}
            </p>
          </div>
          {prompts.length === 0 && (
            <Link
              href="/"
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Enhance a prompt
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((prompt) => (
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

              <p className="text-xs text-[#525252] mb-1.5">Enhanced</p>
              <p className="text-sm text-[#d4d4d4] leading-relaxed line-clamp-4 whitespace-pre-wrap mb-4">
                {prompt.enhanced_prompt}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(prompt)}
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
                  onClick={() => router.push(`/?prompt=${encodeURIComponent(prompt.id)}`)}
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
          ))}
        </ul>
      )}
    </div>
  );
}
