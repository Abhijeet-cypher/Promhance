"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BreakdownBar,
  DonutChart,
  type BreakdownDatum,
} from "@/components/admin/charts";
import {
  EmptyState,
  ErrorState,
  Panel,
  Spinner,
  formatDateTime,
  formatNumber,
} from "@/components/admin/AdminUI";

type SurveyRow = {
  id: string;
  created_at: string;
  usage_frequency: string;
  desired_features: string[] | null;
  desired_features_other: string | null;
  regular_use_reason: string | null;
  price_likelihood: string;
  additional_notes: string | null;
  user_email: string | null;
};

type SurveyResponse = {
  breakdown: {
    usage: BreakdownDatum[];
    price: BreakdownDatum[];
    features: BreakdownDatum[];
  };
  responses: SurveyRow[];
  total: number;
};

const PAGE_SIZE = 25;

const USAGE_LABELS: Record<string, string> = {
  first_time: "First time",
  monthly: "Monthly",
  weekly: "Weekly",
  daily: "Daily",
};

const PRICE_LABELS: Record<string, string> = {
  definitely: "Definitely",
  probably: "Probably",
  not_sure: "Not sure",
  probably_not: "Probably not",
  definitely_not: "Definitely not",
};

const FEATURE_LABELS: Record<string, string> = {
  advanced_enhancement: "Advanced enhancement",
  custom_instructions: "Custom instructions",
  templates: "Templates",
  history_organization: "History organization",
  multiple_models: "Multiple models",
  bulk_enhancement: "Bulk enhancement",
  api: "API",
  other: "Other",
};

function relabel(data: BreakdownDatum[], map: Record<string, string>): BreakdownDatum[] {
  return data.map((d) => ({ ...d, label: map[d.label] ?? d.label }));
}

export default function SurveyPanel() {
  const [data, setData] = useState<SurveyResponse | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/survey?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not load survey responses.");
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load survey responses.");
    } finally {
      setLoading(false);
    }
  }, [page]);

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
  const usage = relabel(data.breakdown.usage, USAGE_LABELS);
  const price = relabel(data.breakdown.price, PRICE_LABELS);
  const features = relabel(data.breakdown.features, FEATURE_LABELS);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Survey</h1>
        <p className="mt-1 text-sm text-[#a1a1a1]">
          Pro pricing and feature-interest responses.
        </p>
      </header>

      {error && <ErrorState message={error} />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#525252]">
            Responses
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatNumber(data.total)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Price likelihood" subtitle="Would you pay $1.99/month?">
          {price.length ? (
            <DonutChart data={price} />
          ) : (
            <p className="py-10 text-center text-sm text-[#525252]">No responses yet.</p>
          )}
        </Panel>
        <Panel title="Usage frequency">
          {usage.length ? (
            <BreakdownBar data={usage} height={260} />
          ) : (
            <p className="py-10 text-center text-sm text-[#525252]">No responses yet.</p>
          )}
        </Panel>
      </div>

      <Panel title="Most wanted features">
        {features.length ? (
          <BreakdownBar data={features} height={280} color="#22c55e" />
        ) : (
          <p className="py-10 text-center text-sm text-[#525252]">No responses yet.</p>
        )}
      </Panel>

      <Panel title="Recent responses">
        {data.responses.length === 0 ? (
          <EmptyState message="No responses found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-left text-[11px] uppercase tracking-widest text-[#525252]">
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">User</th>
                  <th className="px-3 py-2 font-semibold">Usage</th>
                  <th className="px-3 py-2 font-semibold">Price</th>
                  <th className="px-3 py-2 font-semibold">Wanted features</th>
                  <th className="px-3 py-2 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.responses.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#1f1f1f] align-top hover:bg-white/[0.02]"
                  >
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
                      {USAGE_LABELS[row.usage_frequency] ?? row.usage_frequency}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#a1a1a1]">
                      {PRICE_LABELS[row.price_likelihood] ?? row.price_likelihood}
                    </td>
                    <td className="max-w-[260px] px-3 py-3 text-xs text-[#a1a1a1]">
                      {(row.desired_features ?? [])
                        .map((f) => FEATURE_LABELS[f] ?? f)
                        .join(", ") || "—"}
                      {row.desired_features_other && (
                        <span className="block text-[#525252]">
                          + {row.desired_features_other}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[260px] px-3 py-3 text-xs text-[#525252]">
                      {row.additional_notes ?? "—"}
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
