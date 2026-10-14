"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

type Status = "idle" | "submitting" | "error";

export default function NewsletterSignup() {
  const { user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState<boolean | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [needsAccount, setNeedsAccount] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    let active = true;

    fetch("/api/newsletter")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) setOptIn(Boolean(data.optIn));
      })
      .catch(() => {
        /* preference is only used to label the button */
      });

    return () => {
      active = false;
    };
  }, [user, loading]);

  const loadingPreference = Boolean(user) && optIn === null;

  async function updatePreference(nextOptIn: boolean) {
    setStatus("submitting");
    setMessage(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set", optIn: nextOptIn }),
      });
      if (!res.ok) throw new Error();
      setOptIn(nextOptIn);
      setMessage(nextOptIn ? "You're subscribed." : "You've been unsubscribed.");
      setStatus("idle");
    } catch {
      setMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  async function subscribeWithEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("submitting");
    setMessage(null);
    setNeedsAccount(false);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe", email: email.trim() }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setMessage(data?.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      if (data?.needsAccount) {
        setNeedsAccount(true);
        setMessage("We couldn't find that email. Create a free account to subscribe.");
        setStatus("idle");
        return;
      }

      setMessage("You're subscribed. Check your inbox for updates.");
      setEmail("");
      setStatus("idle");
    } catch {
      setMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div>
      <h3 className="mb-5 flex items-center gap-3 text-base font-semibold tracking-wide text-white">
        <span className="h-px w-6 bg-blue-500/50" />
        Newsletter
      </h3>

      <p className="text-[#a1a1a1] text-sm leading-relaxed mb-4 max-w-xs">
        Prompt tips, product updates, and new features. Unsubscribe anytime.
      </p>

      {user ? (
        <div className="space-y-3">
          {loadingPreference ? (
            <div className="flex items-center gap-2 text-xs text-[#525252]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading your preference…
            </div>
          ) : (
            <button
              type="button"
              onClick={() => updatePreference(!(optIn ?? true))}
              disabled={status === "submitting"}
              className="inline-flex items-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#111111] px-4 py-2.5 text-sm text-[#f5f5f5] transition-colors hover:border-[#3a3a3a] disabled:opacity-50"
            >
              {status === "submitting" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : optIn ? (
                <Check className="h-4 w-4 text-blue-400" />
              ) : (
                <Mail className="h-4 w-4 text-[#a1a1a1]" />
              )}
              {optIn === null
                ? "Subscribe to the newsletter"
                : optIn
                  ? "Subscribed — click to unsubscribe"
                  : "Subscribe to the newsletter"}
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={subscribeWithEmail} className="space-y-2.5">
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#525252]"
              strokeWidth={1.75}
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#2a2a2a] bg-[#111111] pl-10 pr-3 py-2.5 text-sm text-[#f5f5f5] placeholder:text-[#3a3a3a] transition-all focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            />
          </div>
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#f5f5f5] disabled:opacity-50"
          >
            {status === "submitting" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Subscribe"
            )}
          </button>
        </form>
      )}

      {message && (
        <p
          className={`mt-3 text-xs leading-relaxed ${
            status === "error" ? "text-red-400" : "text-[#a1a1a1]"
          }`}
        >
          {message}
          {needsAccount && (
            <>
              {" "}
              <Link href="/login" className="text-blue-400 hover:text-blue-300">
                Sign up free
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
