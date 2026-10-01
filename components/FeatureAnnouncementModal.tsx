"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Sparkles, History, RefreshCw, LogIn } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import GoogleIcon from "@/components/GoogleIcon";

const STORAGE_KEY = "promhance_announcement_seen_v2";

export default function FeatureAnnouncementModal() {
  const pathname = usePathname();
  const { user, signInWithGoogle } = useAuth();
  const [open, setOpen] = useState(false);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Storage unavailable — the modal simply shows again next visit.
    }
  }, []);

  const handleGoogle = useCallback(() => {
    dismiss();
    // Redirects to Google; errors surface on the login page.
    void signInWithGoogle();
  }, [dismiss, signInWithGoogle]);

  useEffect(() => {
    if (pathname?.startsWith("/login") || pathname?.startsWith("/auth")) return;

    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // If we can't remember dismissal, don't nag the user at all.
      return;
    }

    const timer = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in-up overflow-y-auto"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-md text-[#525252] hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center mb-5">
          <Sparkles className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
        </div>

        <span className="inline-block text-[11px] font-semibold tracking-[0.18em] uppercase text-blue-400 mb-2">
          What&apos;s new
        </span>
        <h2
          id="announcement-title"
          className="text-2xl font-bold text-white tracking-tight mb-2.5"
        >
          Sign in with Google
        </h2>
        <p className="text-sm text-[#a1a1a1] leading-relaxed mb-6">
          You can now create your free account with Google in one tap — and keep
          every prompt you enhance on any device. No more losing a great prompt.
        </p>

        <ul className="space-y-3 mb-7">
          {[
            { icon: History, text: "Every enhancement saved automatically" },
            { icon: RefreshCw, text: "Reuse and refine past prompts in one click" },
            { icon: LogIn, text: "One-tap sign in with Google or email" },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="w-8 h-8 shrink-0 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-400" strokeWidth={1.75} />
              </span>
              <span className="text-sm text-[#d4d4d4]">{text}</span>
            </li>
          ))}
        </ul>

        {/* Google sign-in announcement */}
        {!user && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white">
                <GoogleIcon className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-white">
                New: Google sign-in
              </span>
            </div>
            <p className="text-xs text-[#a1a1a1] leading-relaxed mb-3">
              Skip the password. Create your account and sync your prompt history
              in a single tap.
            </p>
            <button
              type="button"
              onClick={handleGoogle}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#f0f0f0]"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </div>
        )}

        <Link
          href={user ? "/history" : "/login"}
          onClick={dismiss}
          className="btn-primary btn-shimmer"
        >
          {user ? <History className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          {user ? "View your prompt history" : "Create an account with email"}
        </Link>

        <button
          onClick={dismiss}
          className="w-full mt-3 py-2 text-xs text-[#525252] hover:text-[#a1a1a1] transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
