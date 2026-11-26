"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export type BillingStatusResponse = {
  /** Checkout is switched on for this visitor. */
  available: boolean;
  sandbox: boolean;
  signedIn: boolean;
  subscription: {
    plan: "pro" | "power";
    status: string;
    renews: boolean;
    currentPeriodEnd: string | null;
    cancellable: boolean;
    /** Payment failed long enough that paid access is off, but PayPal may still retry. */
    lapsed: boolean;
  } | null;
  usage: { tier: string; used: number; limit: number; resetsAt: string } | null;
};

/** The caller's billing status. `data` stays null until loaded (or on error). */
export function useBilling() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<BillingStatusResponse | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/subscription", { cache: "no-store" });
      if (res.ok) setData((await res.json()) as BillingStatusResponse);
    } catch {
      /* the page keeps its default (not purchasable) state */
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    (async () => {
      // Defer past the synchronous effect body to avoid a cascading render.
      await Promise.resolve();
      if (active) await refresh();
    })();
    return () => {
      active = false;
    };
  }, [authLoading, user?.id, refresh]);

  return { data, refresh };
}

/** sessionStorage key holding the subscription id while the buyer is at PayPal. */
export const PENDING_SUBSCRIPTION_KEY = "promhance_pending_subscription";
