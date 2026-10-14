"use client";

import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#525252]">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-bold tracking-tight ${
          accent ? "text-blue-400" : "text-white"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-[#525252]">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#2a2a2a] bg-[#111111] p-5 ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-white">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-[#525252]">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-[#a1a1a1]">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2a2a2a] border-t-blue-400" />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-6 text-center text-sm text-red-300">
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-10 text-center text-sm text-[#525252]">
      {message}
    </div>
  );
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return "never";
  const date = new Date(value).getTime();
  if (!Number.isFinite(date)) return "never";
  const seconds = Math.max(0, Math.floor((Date.now() - date) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(value);
}
