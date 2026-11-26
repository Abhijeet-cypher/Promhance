"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Clock, Loader2 } from "lucide-react";
import {
  PENDING_SUBSCRIPTION_KEY,
  useBilling,
  type BillingStatusResponse,
} from "@/components/billing/use-billing";
import { PLANS, type Plan } from "@/lib/plans";

const RANK = { free: 0, pro: 1, power: 2 } as const;

export default function PricingPlans() {
  const { data } = useBilling();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(plan: Plan) {
    if (
      data?.subscription &&
      !data.subscription.lapsed &&
      !window.confirm(
        `Upgrade to ${plan.name}? You pay $${plan.priceMonthly.toFixed(2)} today and a new monthly period starts. ` +
          "Your current plan is cancelled and its unused time is not refunded."
      )
    ) {
      return;
    }

    setBusy(plan.id);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || typeof body.url !== "string") {
        throw new Error(body.error ?? "Could not start checkout.");
      }
      try {
        sessionStorage.setItem(PENDING_SUBSCRIPTION_KEY, body.subscriptionId);
      } catch {
        /* PayPal also puts the id on the return URL */
      }
      window.location.assign(body.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setBusy(null);
    }
  }

  return (
    <>
      {data?.sandbox && (
        <p className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-300">
          PayPal sandbox mode: no real money is charged.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400"
        >
          {error}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-3 items-stretch">
        {PLANS.map((plan) => (
          <section
            key={plan.id}
            className={`relative flex flex-col rounded-2xl p-7 border bg-[#111111] ${
              plan.highlighted
                ? "border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.15)]"
                : "border-[#2a2a2a]"
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-1 text-[11px] font-semibold text-white">
                {plan.badge}
              </span>
            )}
            <p className="text-xs uppercase tracking-widest text-[#525252] mb-2">{plan.tagline}</p>
            <h2 className="text-xl font-bold text-white">{plan.name}</h2>
            <p className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">
                ${plan.priceMonthly === 0 ? "0" : plan.priceMonthly.toFixed(2)}
              </span>
              <span className="text-sm text-[#a1a1a1]">{plan.priceNote}</span>
            </p>
            <p className="mt-3 text-sm text-[#a1a1a1] min-h-[40px]">{plan.audience}</p>

            <ul className="mt-6 mb-8 space-y-3 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2.5 text-sm text-[#d4d4d4]">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" strokeWidth={2.5} />
                  <span>{feature}</span>
                </li>
              ))}
              {plan.comingSoon?.map((feature) => (
                <li key={feature} className="flex gap-2.5 text-sm text-[#737373]">
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
                  <span>{feature} (coming soon)</span>
                </li>
              ))}
            </ul>

            <PlanAction plan={plan} data={data} busy={busy} onSubscribe={subscribe} />
          </section>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-[#525252]">
        {data?.available
          ? "Paid plans are billed monthly through PayPal and renew automatically until you cancel. By subscribing you agree to the "
          : "Paid plans are not live yet — joining the waitlist is free and non-binding. See the "}
        <Link href="/terms" className="text-blue-400 hover:text-blue-300">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/terms#refund-policy" className="text-blue-400 hover:text-blue-300">
          refund policy
        </Link>
        . Fair-use limits apply to unlimited features.
      </p>
    </>
  );
}

function PlanAction({
  plan,
  data,
  busy,
  onSubscribe,
}: {
  plan: Plan;
  data: BillingStatusResponse | null;
  busy: string | null;
  onSubscribe: (plan: Plan) => void;
}) {
  const className = `flex items-center justify-center gap-2 text-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
    plan.highlighted
      ? "bg-blue-500 text-white hover:bg-blue-400"
      : "bg-white/5 border border-[#2a2a2a] text-white hover:bg-white/10"
  }`;

  const link = (href: string, label: string) => (
    <Link href={href} className={className}>
      {label}
    </Link>
  );

  if (plan.id === "free") return link("/", plan.cta);

  // A lapsed plan unlocks nothing, so it can be bought again.
  const current = data?.subscription?.lapsed ? null : data?.subscription;
  if (current?.plan === plan.id) return link("/profile#billing", "Your current plan");
  if (!data?.available) return link("/survey", plan.cta);
  if (!data.signedIn) return link("/login", "Sign in to subscribe");
  if (current && RANK[plan.id] < RANK[current.plan]) return link("/profile#billing", "Manage plan");

  return (
    <button
      type="button"
      onClick={() => onSubscribe(plan)}
      disabled={busy !== null}
      className={className}
    >
      {busy === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
      {current ? `Upgrade to ${plan.name}` : `Subscribe to ${plan.name}`}
    </button>
  );
}
