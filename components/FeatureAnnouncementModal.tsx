"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Telescope, ListChecks, BookOpenText, Layers, LogIn } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import GoogleIcon from "@/components/GoogleIcon";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/**
 * Bump this id to announce something new. Every account sees the modal once
 * per id ("seen" is stored on the account itself, in user metadata, so a new
 * device or browser doesn't show it again, with localStorage as a fallback).
 * Signed-out visitors see it once per device, together with the Google sign-in
 * prompt, which is what nudges new visitors to create an account.
 */
const ANNOUNCEMENT_ID = "deep_research_beta_v1";

const storageKey = (userId: string | undefined) =>
  `promhance_announcement_${ANNOUNCEMENT_ID}_${userId ?? "anon"}`;

export default function FeatureAnnouncementModal() {
  const pathname = usePathname();
  const { user, loading, signInWithGoogle } = useAuth();
  const [open, setOpen] = useState(false);
  const userId = user?.id;
  const seenOnAccount = (
    (user?.user_metadata?.announcements_seen as string[] | undefined) ?? []
  ).includes(ANNOUNCEMENT_ID);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(storageKey(userId), "1");
    } catch {
      // Storage unavailable — signed-in users still have the account flag below.
    }
    if (!userId) return;
    // Best effort: remember it on the account so it never shows again.
    const supabase = createBrowserSupabaseClient();
    const previous = (user?.user_metadata?.announcements_seen as string[] | undefined) ?? [];
    void supabase?.auth
      .updateUser({ data: { announcements_seen: [...new Set([...previous, ANNOUNCEMENT_ID])] } })
      .catch(() => {});
  }, [userId, user?.user_metadata?.announcements_seen]);

  const handleGoogle = useCallback(() => {
    dismiss();
    // Redirects to Google; errors surface on the login page.
    void signInWithGoogle();
  }, [dismiss, signInWithGoogle]);

  // Show once: to a signed-in account on its first page after login, and to a
  // signed-out visitor on their first visit (never on the auth pages).
  useEffect(() => {
    if (loading || seenOnAccount) return;
    if (pathname?.startsWith("/login") || pathname?.startsWith("/auth")) return;

    try {
      if (window.localStorage.getItem(storageKey(userId)) === "1") return;
    } catch {
      // Can't read storage: signed-out visitors are left alone (we couldn't
      // remember a dismissal); signed-in users fall through to the account flag.
      if (!userId) return;
    }

    const timer = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(timer);
  }, [loading, userId, seenOnAccount, pathname]);

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
          <Telescope className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
        </div>

        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="inline-block text-[11px] font-semibold tracking-[0.18em] uppercase text-blue-400">
            What&apos;s new
          </span>
          <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-blue-300">
            Beta
          </span>
        </div>
        <h2
          id="announcement-title"
          className="text-2xl font-bold text-white tracking-tight mb-2.5 text-center"
        >
          Meet Deep Research
        </h2>
        <p className="text-sm text-[#a1a1a1] leading-relaxed mb-6 text-center">
          Before writing your prompt, Promhance now researches your topic, so you get a
          more complete, detailed prompt and better results from any AI.
        </p>

        <ul className="space-y-3 mb-7">
          {[
            { icon: ListChecks, text: "Finds best practices for your topic" },
            { icon: Layers, text: "Builds key details and constraints into your prompt" },
            { icon: BookOpenText, text: "Shows the research notes behind every result" },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="w-8 h-8 shrink-0 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-400" strokeWidth={1.75} />
              </span>
              <span className="text-sm text-[#d4d4d4]">{text}</span>
            </li>
          ))}
        </ul>

        {/* Google sign-in: the nudge that gets new visitors to create an account */}
        {!user && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white">
                <GoogleIcon className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-white">New: Google sign-in</span>
            </div>
            <p className="text-xs text-[#a1a1a1] leading-relaxed mb-3">
              Skip the password. Create your account and sync your prompt history in a
              single tap.
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

        {user ? (
          <Link href="/#deep-research" onClick={dismiss} className="btn-primary btn-shimmer">
            <Telescope className="w-4 h-4" />
            Try Deep Research
          </Link>
        ) : (
          <>
            <Link href="/login" onClick={dismiss} className="btn-primary btn-shimmer">
              <LogIn className="w-4 h-4" />
              Create an account with email
            </Link>
            <Link
              href="/#deep-research"
              onClick={dismiss}
              className="mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
            >
              <Telescope className="w-4 h-4" />
              Try Deep Research
            </Link>
          </>
        )}

        <button
          onClick={dismiss}
          className="w-full mt-1 py-2 text-xs text-[#525252] hover:text-[#a1a1a1] transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
