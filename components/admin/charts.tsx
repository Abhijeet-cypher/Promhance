"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const CHART_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

const AXIS_STYLE = { fill: "#525252", fontSize: 11 };
const TOOLTIP_STYLE = {
  backgroundColor: "#111111",
  border: "1px solid #2a2a2a",
  borderRadius: 12,
  fontSize: 12,
  color: "#f5f5f5",
};

const emptySubscribe = () => () => {};

/** True on the client, false during SSR — so ResponsiveContainer measures after mount. */
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function ChartFrame({ height, children }: { height: number; children: ReactNode }) {
  const mounted = useMounted();
  if (!mounted) {
    return <div style={{ height }} className="animate-pulse rounded-xl bg-[#0d0d0d]" />;
  }
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as never}
      </ResponsiveContainer>
    </div>
  );
}

export type SeriesPoint = {
  day: string;
  prompts: number;
  signups: number;
  feedback: number;
  survey: number;
};

export function TrendChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ChartFrame height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#1f1f1f" vertical={false} />
        <XAxis
          dataKey="day"
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={{ stroke: "#2a2a2a" }}
          tickFormatter={(value: string) => value.slice(5)}
          minTickGap={24}
        />
        <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#a1a1a1" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#a1a1a1" }} />
        <Line
          type="monotone"
          dataKey="prompts"
          name="Enhancements"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="signups"
          name="Sign-ups"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="feedback"
          name="Feedback"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartFrame>
  );
}

export type BreakdownDatum = { label: string; count: number };

export function BreakdownBar({
  data,
  height = 260,
  color = "#3b82f6",
}: {
  data: BreakdownDatum[];
  height?: number;
  color?: string;
}) {
  return (
    <ChartFrame height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#1f1f1f" vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={{ stroke: "#2a2a2a" }}
          interval={0}
          angle={-25}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: "#a1a1a1" }}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="count" name="Count" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartFrame>
  );
}

export function DonutChart({
  data,
  height = 260,
}: {
  data: BreakdownDatum[];
  height?: number;
}) {
  return (
    <ChartFrame height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          stroke="#111111"
        >
          {data.map((entry, index) => (
            <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#a1a1a1" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#a1a1a1" }} />
      </PieChart>
    </ChartFrame>
  );
}
