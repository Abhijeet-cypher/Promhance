"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EmptyState,
  ErrorState,
  Panel,
  Spinner,
  formatDateTime,
  formatNumber,
} from "@/components/admin/AdminUI";

type FeedbackRow = {
  id: string;
  created_at: string;
  reaction: string;
  comment: string | null;
  prompt_id: string | null;
  user_id: string | null;
  user_email: string | null;
  page_path: string | null;
  status: string;
};

const PAGE_SIZE = 25;
const STATUSES = ["new", "reviewed", "archived"] as const;

const REACTION_STYLES: Record<string, string> = {
  great: "bg-green-500/10 text-green-400 border-green-500/20",
  meh: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  bad: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function FeedbackTable() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/feedback?${params}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not load feedback.");
      }
      const data = await res.json();
      setRows(data.feedback);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load feedback.");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

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

  const updateStatus = async (id: string, next: string) => {
    setSaving(id);
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      if (!res.ok) throw new Error("Could not update feedback.");
      setRows((current) =>
        current.map((row) => (row.id === id ? { ...row, status: next } : row))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update feedback.");
    } finally {
      setSaving(null);
    }
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Feedback</h1>
        <p className="mt-1 text-sm text-[#a1a1a1]">
          Reactions and comments, with triage status.
        </p>
      </header>

      <Panel
        title={`${formatNumber(total)} items`}
        action={
          <div className="flex items-center gap-1 rounded-full border border-[#2a2a2a] bg-[#0a0a0a] p-1">
            {["", ...STATUSES].map((value) => (
              <button
                key={value || "all"}
                onClick={() => {
                  setStatus(value);
                  setPage(0);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  status === value
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
        {loading && rows.length === 0 ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} />
        ) : rows.length === 0 ? (
          <EmptyState message="No feedback found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-left text-[11px] uppercase tracking-widest text-[#525252]">
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Reaction</th>
                  <th className="px-3 py-2 font-semibold">User</th>
                  <th className="px-3 py-2 font-semibold">Comment</th>
                  <th className="px-3 py-2 font-semibold">Page</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#1f1f1f] align-top hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-[#a1a1a1]">
                      {formatDateTime(row.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
                          REACTION_STYLES[row.reaction] ??
                          "border-[#2a2a2a] text-[#a1a1a1]"
                        }`}
                      >
                        {row.reaction}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {row.user_email ? (
                        <span className="text-white">{row.user_email}</span>
                      ) : (
                        <span className="text-[#525252]">anon</span>
                      )}
                    </td>
                    <td className="max-w-[360px] px-3 py-3 text-xs text-[#a1a1a1]">
                      {row.comment || <span className="text-[#3a3a3a]">—</span>}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#525252]">
                      {row.page_path ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={row.status}
                        disabled={saving === row.id}
                        onChange={(e) => void updateStatus(row.id, e.target.value)}
                        className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-2 py-1 text-xs capitalize text-[#a1a1a1] focus:border-blue-500/50 focus:outline-none disabled:opacity-50"
                      >
                        {STATUSES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
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
