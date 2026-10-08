"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { INTENSITY_NAMES, MODE_NAMES } from "@/lib/prompt-modes";
import {
  EmptyState,
  ErrorState,
  Panel,
  Spinner,
  formatDateTime,
  formatNumber,
} from "@/components/admin/AdminUI";

type PromptRow = {
  id: string;
  anon_id: string;
  user_id: string | null;
  user_email: string | null;
  original_prompt: string;
  enhanced_prompt: string;
  mode: string | null;
  intensity: string | null;
  created_at: string;
};

const PAGE_SIZE = 25;

const fieldLabel =
  "mb-1 block text-[10px] font-semibold uppercase tracking-widest text-[#525252]";
const fieldClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder:text-[#3a3a3a] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/40";

export default function PromptsTable() {
  const [rows, setRows] = useState<PromptRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [query, setQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState("");
  const [intensity, setIntensity] = useState("");
  const [identity, setIdentity] = useState("");
  const [sort, setSort] = useState("newest");

  // Debounce the free-text inputs; any filter change resets to page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setUserFilter(userQuery.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, userQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (search) params.set("q", search);
      if (userFilter) params.set("user", userFilter);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (mode) params.set("mode", mode);
      if (intensity) params.set("intensity", intensity);
      if (identity) params.set("identity", identity);
      if (sort !== "newest") params.set("sort", sort);

      const res = await fetch(`/api/admin/prompts?${params}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not load prompts.");
      }
      const data = await res.json();
      setRows(data.prompts);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load prompts.");
    } finally {
      setLoading(false);
    }
  }, [page, search, userFilter, from, to, mode, intensity, identity, sort]);

  useEffect(() => {
    let active = true;
    (async () => {
      // Defer past the synchronous effect body to avoid a cascading render.
      await Promise.resolve();
      if (active) await load();
    })();
    return () => {
      active = false;
    };
  }, [load]);

  const hasFilters = Boolean(
    query || userQuery || from || to || mode || intensity || identity || sort !== "newest"
  );

  const reset = () => {
    setQuery("");
    setUserQuery("");
    setFrom("");
    setTo("");
    setMode("");
    setIntensity("");
    setIdentity("");
    setSort("newest");
    setPage(0);
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Prompts</h1>
        <p className="mt-1 text-sm text-[#a1a1a1]">
          Every enhancement, with original and enhanced text.
        </p>
      </header>

      <Panel title={`${formatNumber(total)} prompts`}>
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className={fieldLabel} htmlFor="filter-q">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" />
              <input
                id="filter-q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Prompt text…"
                className={`${fieldClass} pl-9`}
              />
            </div>
          </div>

          <div>
            <label className={fieldLabel} htmlFor="filter-user">
              User email
            </label>
            <input
              id="filter-user"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="name@example.com"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={fieldLabel} htmlFor="filter-from">
              From
            </label>
            <input
              id="filter-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(0);
              }}
              className={`${fieldClass} [color-scheme:dark]`}
            />
          </div>

          <div>
            <label className={fieldLabel} htmlFor="filter-to">
              To
            </label>
            <input
              id="filter-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(0);
              }}
              className={`${fieldClass} [color-scheme:dark]`}
            />
          </div>

          <div>
            <label className={fieldLabel} htmlFor="filter-mode">
              Mode
            </label>
            <select
              id="filter-mode"
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setPage(0);
              }}
              className={fieldClass}
            >
              <option value="">All modes</option>
              {MODE_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={fieldLabel} htmlFor="filter-intensity">
              Intensity
            </label>
            <select
              id="filter-intensity"
              value={intensity}
              onChange={(e) => {
                setIntensity(e.target.value);
                setPage(0);
              }}
              className={fieldClass}
            >
              <option value="">All intensities</option>
              {INTENSITY_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={fieldLabel} htmlFor="filter-identity">
              Identity
            </label>
            <select
              id="filter-identity"
              value={identity}
              onChange={(e) => {
                setIdentity(e.target.value);
                setPage(0);
              }}
              className={fieldClass}
            >
              <option value="">Everyone</option>
              <option value="user">Registered</option>
              <option value="anon">Anonymous</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className={fieldLabel} htmlFor="filter-sort">
                Sort
              </label>
              <select
                id="filter-sort"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(0);
                }}
                className={fieldClass}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
            {hasFilters && (
              <button
                onClick={reset}
                className="inline-flex h-[38px] shrink-0 items-center gap-1.5 rounded-xl border border-[#2a2a2a] px-3 text-xs text-[#a1a1a1] transition-colors hover:border-[#3a3a3a] hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {loading && rows.length === 0 ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} />
        ) : rows.length === 0 ? (
          <EmptyState message="No prompts match these filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-left text-[11px] uppercase tracking-widest text-[#525252]">
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">User</th>
                  <th className="px-3 py-2 font-semibold">Mode</th>
                  <th className="px-3 py-2 font-semibold">Original prompt</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <Fragment key={row.id}>
                    <tr className="border-b border-[#1f1f1f] align-top hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-[#a1a1a1]">
                        {formatDateTime(row.created_at)}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {row.user_email ? (
                          <span className="text-white">{row.user_email}</span>
                        ) : (
                          <span className="text-[#525252]">anon</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-[#a1a1a1]">
                        {row.mode ?? "—"}
                        <span className="ml-1 text-[#525252]">· {row.intensity ?? "—"}</span>
                      </td>
                      <td className="max-w-[420px] px-3 py-3 text-xs text-[#a1a1a1]">
                        <p className="line-clamp-2">{row.original_prompt}</p>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() =>
                            setExpanded((id) => (id === row.id ? null : row.id))
                          }
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                        >
                          View
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform ${
                              expanded === row.id ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                    {expanded === row.id && (
                      <tr className="border-b border-[#1f1f1f] bg-[#0d0d0d]">
                        <td colSpan={5} className="px-3 py-4">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div>
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#525252]">
                                Original
                              </p>
                              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-xs text-[#a1a1a1]">
                                {row.original_prompt}
                              </pre>
                            </div>
                            <div>
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#525252]">
                                Enhanced
                              </p>
                              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-xs text-[#f5f5f5]">
                                {row.enhanced_prompt}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 && (
          <div className="mt-4 flex items-center justify-between text-xs text-[#a1a1a1]">
            <span>
              Page {page + 1} of {pageCount}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-[#2a2a2a] px-3 py-1.5 transition-colors hover:border-[#3a3a3a] hover:text-white disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                className="rounded-lg border border-[#2a2a2a] px-3 py-1.5 transition-colors hover:border-[#3a3a3a] hover:text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
