"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { PENDING_SUBSCRIPTION_KEY, useBilling } from "@/components/billing/use-billing";
import { useAuth } from "@/components/AuthProvider";
import { PLANS } from "@/lib/plans";

type Activation = "idle" | "checking" | "done" | "slow" | "problem";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

/** Plan, usage and cancellation on /profile; also finishes a PayPal checkout. */
export default function BillingSection() {
  const { user } = useAuth();
  const { data, refresh } = useBilling();
  const [activation, setActivation] = useState<Activation>("idle");
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirming = useRef(false);

  // Returning from PayPal: confirm, and keep asking while the first charge posts.
  useEffect(() => {
    if (!user || confirming.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;

    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(PENDING_SUBSCRIPTION_KEY);
    } catch {
      /* storage blocked: rely on the URL */
    }
    const subscriptionId = params.get("subscription_id") ?? stored;
    if (!subscriptionId) return;
    confirming.current = true;

    void (async () => {
      setActivation("checking");
      for (let attempt = 0; attempt < 10; attempt++) {
        const res = await fetch("/api/billing/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionId }),
        }).catch(() => null);
        const body = res?.ok ? await res.json().catch(() => null) : null;
        if (body && body.status !== "pending") {
          // Only a live subscription is a success. "superseded" is an old return
          // link (nothing to report); anything else unlocked no plan.
          setActivation(
            body.status === "active" ? "done" : body.status === "superseded" ? "idle" : "problem"
          );
          window.history.replaceState(null, "", "/profile#billing");
          await refresh();
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      setActivation("slow");
    })();
  }, [user, refresh]);

  if (!user || !data) return null;
  const sub = data.subscription;
  // Nothing to show until billing is offered or the user already pays.
  if (!sub && !data.available && activation === "idle") return null;

  const activePlan = sub && !sub.lapsed ? sub.plan : "free";
  const planName = PLANS.find((p) => p.id === activePlan)?.name ?? "Free";

  async function cancel() {
    if (
      !window.confirm(
        "Cancel your subscription? You keep your plan until the end of the period you paid for and will not be charged again."
      )
    ) {
      return;
    }
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not cancel.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section
      id="billing"
      className="mt-6 scroll-mt-28 rounded-2xl border border-[#2a2a2a] bg-[#111111] p-6 space-y-3"
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
        <CreditCard className="h-4 w-4 text-blue-400" />
        Plan and billing
      </h2>

      <div aria-live="polite">
        {activation === "checking" && (
          <p className="flex items-center gap-2 text-sm text-[#a1a1a1]">
            <Loader2 className="h-4 w-4 animate-spin" /> Confirming your payment…
          </p>
        )}
        {activation === "done" && (
          <p className="text-sm text-green-400">Payment received. Thank you!</p>
        )}
        {activation === "problem" && (
          <p className="text-sm text-amber-300">
            We could not activate a plan from this payment. Do not pay again — email
            admin@promhance.com.
          </p>
        )}
        {activation === "slow" && (
          <p className="text-sm text-amber-300">
            PayPal has not reported your payment yet. This can take a few minutes — reload this
            page shortly. Do not pay again.
          </p>
        )}
      </div>

      <p className="text-sm text-[#d4d4d4]">
        Current plan: <span className="font-semibold text-white">{planName}</span>
        {data.sandbox && <span className="ml-2 text-xs text-amber-300">sandbox</span>}
      </p>

      {sub?.currentPeriodEnd && (
        <p className="text-sm text-[#a1a1a1]">
          {sub.status === "past_due" || sub.status === "suspended"
            ? "Your last payment failed. "
            : sub.renews
              ? `Renews on ${formatDate(sub.currentPeriodEnd)}.`
              : `Cancelled. Access ends on ${formatDate(sub.currentPeriodEnd)}.`}
          {(sub.status === "past_due" || sub.status === "suspended") && (
            <a
              href="https://www.paypal.com/myaccount/autopay/"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              Update your payment method in PayPal
            </a>
          )}
        </p>
      )}

      {data.usage && (
        <p className="text-xs text-[#525252]">
          {data.usage.limit} enhancements per month
          {data.usage.used > 0 ? ` · ${data.usage.used} used this period` : ""}
        </p>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex flex-wrap items-center gap-4 pt-1 text-sm">
        {sub?.plan !== "power" && data.available && (
          <Link href="/pricing" className="text-blue-400 hover:text-blue-300">
            {sub ? "Upgrade" : "See paid plans"}
          </Link>
        )}
        {sub?.cancellable && (
          <button
            type="button"
            onClick={cancel}
            disabled={cancelling}
            className="text-[#a1a1a1] underline underline-offset-4 hover:text-white disabled:opacity-50"
          >
            {cancelling ? "Cancelling…" : "Cancel subscription"}
          </button>
        )}
      </div>
    </section>
  );
}
