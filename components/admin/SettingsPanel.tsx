"use client";

import { useEffect, useState } from "react";
import { ErrorState, Panel, Spinner, formatDateTime } from "@/components/admin/AdminUI";
import { PLAN_LIMITS, type TierId } from "@/lib/plans";

type QuotaSetting = { enabled: boolean; updatedAt: string | null; updatedBy: string | null };

const TIERS: { id: TierId; label: string }[] = [
  { id: "anonymous", label: "Not signed in" },
  { id: "free", label: "Free" },
  { id: "pro", label: "Pro" },
  { id: "power", label: "Power" },
];

export default function SettingsPanel() {
  const [setting, setSetting] = useState<QuotaSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/settings", { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Could not load settings.");
        if (active) setSetting(body.quotaEnforcement);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load settings.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function toggle() {
    if (!setting || saving) return;
    const next = !setting.enabled;
    if (
      next &&
      !window.confirm(
        "Turn ON plan limits? Visitors will be blocked once they reach their monthly quota."
      )
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotaEnforcement: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not save.");
      setSetting(body.quotaEnforcement);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>

      {error && <ErrorState message={error} />}

      <Panel
        title="Plan limits"
        subtitle="Enforce monthly enhancement quotas for anonymous, Free, Pro and Power users. Off until subscriptions are ready."
        action={
          <button
            type="button"
            role="switch"
            aria-checked={setting?.enabled ?? false}
            aria-label="Enforce plan limits"
            disabled={!setting || saving}
            onClick={toggle}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              setting?.enabled ? "bg-blue-500" : "bg-[#2a2a2a]"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                setting?.enabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        }
      >
        <p className="text-sm text-[#d4d4d4]">
          Status:{" "}
          <span className={setting?.enabled ? "font-semibold text-blue-400" : "text-[#a1a1a1]"}>
            {setting?.enabled ? "Enforced" : "Not enforced — everyone is unlimited"}
          </span>
        </p>
        {setting?.updatedAt && (
          <p className="mt-1 text-xs text-[#525252]">
            Last changed {formatDateTime(setting.updatedAt)}
            {setting.updatedBy ? ` by ${setting.updatedBy}` : ""}
          </p>
        )}
        <p className="mt-3 text-xs text-[#525252]">
          Changes apply within ~10 seconds. Usage is only counted while enforcement is on.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[#525252]">
              <tr>
                <th className="py-2 pr-4 font-semibold">Tier</th>
                <th className="py-2 pr-4 font-semibold">Enhancements</th>
                <th className="py-2 pr-4 font-semibold">Detail</th>
                <th className="py-2 pr-4 font-semibold">Refinements</th>
                <th className="py-2 pr-4 font-semibold">Research</th>
                <th className="py-2 font-semibold">Per minute</th>
              </tr>
            </thead>
            <tbody className="text-[#d4d4d4]">
              {TIERS.map(({ id, label }) => {
                const l = PLAN_LIMITS[id];
                return (
                  <tr key={id} className="border-t border-[#1f1f1f]">
                    <td className="py-2 pr-4">{label}</td>
                    <td className="py-2 pr-4">{l.enhancementsPerMonth}/mo</td>
                    <td className="py-2 pr-4">
                      {l.detailPerMonth === null ? "in total" : `${l.detailPerMonth}/mo`}
                    </td>
                    <td className="py-2 pr-4">{l.refinePerMonth}/mo</td>
                    <td className="py-2 pr-4">
                      {l.researchPerMonth === 0 ? "—" : `${l.researchPerMonth}/mo`}
                    </td>
                    <td className="py-2">{l.perMinute}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-[#525252]">
            Edit numbers in <code>lib/plans.ts</code>.
          </p>
        </div>
      </Panel>
    </div>
  );
}
