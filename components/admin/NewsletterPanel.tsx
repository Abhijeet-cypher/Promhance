"use client";

import { useCallback, useEffect, useState } from "react";
import { countryName } from "@/lib/geo";
import {
  EmptyState,
  ErrorState,
  Panel,
  Spinner,
  StatCard,
  formatDate,
  formatNumber,
} from "@/components/admin/AdminUI";

type Subscriber = {
  id: string;
  email: string | null;
  display_name: string | null;
  country: string | null;
  newsletter_opt_in: boolean | null;
  created_at: string;
};

type NewsletterResponse = {
  stats: { subscribed: number; unsubscribed: number; total: number };
  subscribers: Subscriber[];
  total: number;
};

const PAGE_SIZE = 25;
const FILTERS = ["", "subscribed", "unsubscribed"];

export default function NewsletterPanel() {
  const [data, setData] = useState<NewsletterResponse | null>(null);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (filter) params.set("filter", filter);
      const res = await fetch(`/api/admin/newsletter?${params}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not load subscribers.");
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load subscribers.");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

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

  if (loading && !data) return <Spinner />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return null;

  const pageCount = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Newsletter</h1>
        <p className="mt-1 text-sm text-[#a1a1a1]">
          Subscriber preference across registered accounts.
        </p>
      </header>

      {error && <ErrorState message={error} />}

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Subscribed" value={formatNumber(data.stats.subscribed)} accent />
        <StatCard label="Opted out" value={formatNumber(data.stats.unsubscribed)} />
        <StatCard label="Total accounts" value={formatNumber(data.stats.total)} />
      </div>

      <Panel
        title={`${formatNumber(data.total)} shown`}
        action={
          <div className="flex items-center gap-1 rounded-full border border-[#2a2a2a] bg-[#0a0a0a] p-1">
            {FILTERS.map((value) => (
              <button
                key={value || "all"}
                onClick={() => {
                  setFilter(value);
                  setPage(0);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  filter === value
                    ? "bg-blue-500/15 text-blue-300"
                    : "text-[#a1a1a1] hover:text-white"
                }`}
              >
                {value || "all"}
              </button>
            ))}
          </div>
        }
      >
        {data.subscribers.length === 0 ? (
          <EmptyState message="No accounts found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-left text-[11px] uppercase tracking-widest text-[#525252]">
                  <th className="px-3 py-2 font-semibold">Email</th>
                  <th className="px-3 py-2 font-semibold">Country</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.subscribers.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#1f1f1f] hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-3 text-xs text-white">
                      {row.email ?? "—"}
                      {row.display_name && (
                        <span className="ml-2 text-[#525252]">{row.display_name}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#a1a1a1]">
                      {countryName(row.country)}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {row.newsletter_opt_in ? (
                        <span className="text-green-400">subscribed</span>
                      ) : (
                        <span className="text-[#525252]">opted out</span>
                      )}
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
