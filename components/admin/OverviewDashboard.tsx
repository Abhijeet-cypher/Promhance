"use client";

import { useCallback, useEffect, useState } from "react";
import { countryName } from "@/lib/geo";
import {
  BreakdownBar,
  DonutChart,
  TrendChart,
  type BreakdownDatum,
  type SeriesPoint,
} from "@/components/admin/charts";
import {
  ErrorState,
  Panel,
  Spinner,
  StatCard,
  formatNumber,
} from "@/components/admin/AdminUI";

type Totals = {
  totalUsers: number;
  totalProfiles: number;
  totalPrompts: number;
  totalVersions: number;
  totalRefinements: number;
  totalFeedback: number;
  totalSurvey: number;
  newsletterSubs: number;
  promptsToday: number;
  prompts7d: number;
  prompts30d: number;
  signups7d: number;
  signups30d: number;
  feedback7d: number;
  active7d: number;
  active30d: number;
  anonPrompts: number;
  authPrompts: number;
};

type OverviewResponse = {
  totals: Totals;
  series: SeriesPoint[];
  prompts: { modes: BreakdownDatum[]; intensities: BreakdownDatum[] };
  reactions: { reaction: string; count: number }[];
  countries: { country: string; count: number }[];
  days: number;
};

const RANGES = [7, 30, 90, 365];

export default function OverviewDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (range: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/overview?days=${range}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not load analytics.");
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      // Defer past the synchronous effect body to avoid a cascading render.
      await Promise.resolve();
      if (active) await load(days);
    })();
    return () => {
      active = false;
    };
  }, [days, load]);

  if (loading && !data) return <Spinner label="Loading dashboard…" />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return null;

  const t = data.totals;
  const reactions: BreakdownDatum[] = data.reactions.map((r) => ({
    label: r.reaction,
    count: Number(r.count),
  }));
  const reactionTotal = reactions.reduce((sum, r) => sum + r.count, 0);
  const countryMax = Math.max(1, ...data.countries.map((c) => Number(c.count)));
  const seriesPrompts = data.series.reduce((sum, p) => sum + Number(p.prompts), 0);
  const seriesSignups = data.series.reduce((sum, p) => sum + Number(p.signups), 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Overview</h1>
          <p className="mt-1 text-sm text-[#a1a1a1]">
            Product analytics from your Supabase database. Traffic &amp; SEO live in GA4.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-[#2a2a2a] bg-[#111111] p-1">
          {RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setDays(range)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                days === range
                  ? "bg-blue-500/15 text-blue-300"
                  : "text-[#a1a1a1] hover:text-white"
              }`}
            >
              {range === 365 ? "1y" : `${range}d`}
            </button>
          ))}
        </div>
      </header>

      {error && <ErrorState message={error} />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total users" value={formatNumber(t.totalUsers)} accent />
        <StatCard
          label="Total prompts"
          value={formatNumber(t.totalPrompts)}
          hint={`${formatNumber(t.promptsToday)} today`}
        />
        <StatCard
          label="Active devices"
          value={formatNumber(t.active7d)}
          hint={`${formatNumber(t.active30d)} in 30d`}
        />
        <StatCard
          label="Refinements"
          value={formatNumber(t.totalRefinements)}
          hint={`${formatNumber(t.totalVersions)} versions`}
        />
        <StatCard
          label={`Prompts (${days}d)`}
          value={formatNumber(seriesPrompts)}
          hint={`${formatNumber(t.promptsToday)} today`}
        />
        <StatCard
          label={`Sign-ups (${days}d)`}
          value={formatNumber(seriesSignups)}
          hint={`${formatNumber(t.signups7d)} in 7d`}
        />
        <StatCard
          label="Feedback"
          value={formatNumber(t.totalFeedback)}
          hint={`${formatNumber(t.feedback7d)} in 7d`}
        />
        <StatCard
          label="Survey responses"
          value={formatNumber(t.totalSurvey)}
          hint={`${formatNumber(t.newsletterSubs)} newsletter subs`}
        />
      </div>

      <Panel
        title="Activity over time"
        subtitle="Enhancements, sign-ups and feedback per day"
      >
        <TrendChart data={data.series} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Prompts by mode" subtitle="All-time distribution">
          {data.prompts.modes.length ? (
            <BreakdownBar data={data.prompts.modes} />
          ) : (
            <p className="py-10 text-center text-sm text-[#525252]">No prompts yet.</p>
          )}
        </Panel>

        <Panel title="Feedback reactions" subtitle={`${formatNumber(reactionTotal)} total`}>
          {reactions.length ? (
            <DonutChart data={reactions} />
          ) : (
            <p className="py-10 text-center text-sm text-[#525252]">No feedback yet.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Users by country" subtitle="Inferred from edge headers or self-reported">
          {data.countries.length ? (
            <ul className="space-y-3">
              {data.countries.slice(0, 12).map((row) => (
                <li key={row.country}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-[#a1a1a1]">{countryName(row.country)}</span>
                    <span className="text-white">{formatNumber(Number(row.count))}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1a1a1a]">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(Number(row.count) / countryMax) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-[#525252]">No country data yet.</p>
          )}
        </Panel>

        <Panel title="Prompts by intensity">
          {data.prompts.intensities.length ? (
            <BreakdownBar data={data.prompts.intensities} color="#8b5cf6" />
          ) : (
            <p className="py-10 text-center text-sm text-[#525252]">No prompts yet.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
