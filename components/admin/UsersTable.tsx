"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { countryName } from "@/lib/geo";
import {
  EmptyState,
  ErrorState,
  Panel,
  Spinner,
  formatDate,
  formatNumber,
  timeAgo,
} from "@/components/admin/AdminUI";

type UserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  country: string | null;
  country_source: string | null;
  newsletter_opt_in: boolean | null;
  created_at: string;
  prompt_count: number | string;
  version_count: number | string;
  feedback_count: number | string;
  survey_count: number | string;
  last_active: string | null;
};

const PAGE_SIZE = 25;

export default function UsersTable() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (search) params.set("q", search);
      const res = await fetch(`/api/admin/users?${params}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not load users.");
      }
      const data = await res.json();
      setRows(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

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

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Users</h1>
        <p className="mt-1 text-sm text-[#a1a1a1]">
          Registered accounts, their country and activity.
        </p>
      </header>

      <Panel
        title={`${formatNumber(total)} users`}
        action={
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search email or name…"
              className="w-full rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] py-2 pl-9 pr-3 text-sm text-white placeholder:text-[#3a3a3a] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            />
          </div>
        }
      >
        {loading && rows.length === 0 ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} />
        ) : rows.length === 0 ? (
          <EmptyState message="No users found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-left text-[11px] uppercase tracking-widest text-[#525252]">
                  <th className="px-3 py-2 font-semibold">User</th>
                  <th className="px-3 py-2 font-semibold">Country</th>
                  <th className="px-3 py-2 font-semibold">Prompts</th>
                  <th className="px-3 py-2 font-semibold">Versions</th>
                  <th className="px-3 py-2 font-semibold">Feedback</th>
                  <th className="px-3 py-2 font-semibold">Survey</th>
                  <th className="px-3 py-2 font-semibold">Newsletter</th>
                  <th className="px-3 py-2 font-semibold">Last active</th>
                  <th className="px-3 py-2 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#1f1f1f] hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-3">
                      <p className="text-xs text-white">{row.email ?? "—"}</p>
                      {row.display_name && (
                        <p className="text-[11px] text-[#525252]">{row.display_name}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#a1a1a1]">
                      {countryName(row.country)}
                      {row.country_source === "self" && (
                        <span className="ml-1 text-[10px] text-blue-400/70">verified</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-white">
                      {formatNumber(Number(row.prompt_count))}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#a1a1a1]">
                      {formatNumber(Number(row.version_count))}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#a1a1a1]">
                      {formatNumber(Number(row.feedback_count))}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#a1a1a1]">
                      {formatNumber(Number(row.survey_count))}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {row.newsletter_opt_in ? (
                        <span className="text-green-400">subscribed</span>
                      ) : (
                        <span className="text-[#525252]">out</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-[#a1a1a1]">
                      {timeAgo(row.last_active)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-[#525252]">
                      {formatDate(row.created_at)}
                    </td>
                  </tr>
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
