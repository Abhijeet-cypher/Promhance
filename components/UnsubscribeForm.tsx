"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, Mail, AlertCircle } from "lucide-react";

type Status = "idle" | "submitting" | "done";

export default function UnsubscribeForm({
  initialEmail = "",
  token = "",
}: {
  initialEmail?: string;
  token?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const hasTokenLink = Boolean(token && initialEmail);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setError("Enter the email address you subscribed with.");
      return;
    }

    setError(null);
    setStatus("submitting");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unsubscribe",
          email: value,
          ...(token ? { token } : {}),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        setStatus("idle");
        return;
      }

      setStatus("done");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-8 sm:p-12 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10">
          <Check className="h-7 w-7 text-blue-400" strokeWidth={2.5} />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-white">You&apos;re unsubscribed.</h2>
        <p className="mx-auto mb-8 max-w-md text-[#a1a1a1]">
          We&apos;ve removed you from the Promhance newsletter. You can subscribe
          again anytime from the site footer.
        </p>
        <Link
          href="/"
          className="btn-cta inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0a0a0a] no-underline shadow-lg transition-colors hover:bg-[#f5f5f5]"
          style={{ textDecoration: "none" }}
        >
          Back to Promhance
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-6 sm:p-8 shadow-xl"
    >
      <div className="space-y-2">
        <label
          htmlFor="unsubscribe-email"
          className="text-[11px] font-semibold uppercase tracking-widest text-[#525252]"
        >
          Email address
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]"
            strokeWidth={1.75}
          />
          <input
            id="unsubscribe-email"
            type="email"
            required
            readOnly={hasTokenLink}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] py-2.5 pl-10 pr-4 text-sm text-[#f5f5f5] transition-all placeholder:text-[#3a3a3a] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/40 read-only:opacity-70"
          />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0a0a0a] shadow-lg transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Unsubscribing…
          </>
        ) : (
          "Unsubscribe me"
        )}
      </button>

      <p className="mt-4 text-center text-xs text-[#525252]">
        Changed your mind? Manage your preference from the site footer.
      </p>
    </form>
  );
}
