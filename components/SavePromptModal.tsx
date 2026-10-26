"use client";

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Cloud, LogIn } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import GoogleIcon from "@/components/GoogleIcon";

export default function SavePromptModal({ onClose }: { onClose: () => void }) {
  const { signInWithGoogle } = useAuth();

  const handleGoogle = useCallback(() => {
    onClose();
    // Redirects to Google; errors surface on the login page.
    void signInWithGoogle();
  }, [onClose, signInWithGoogle]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  // Portal to body so transformed ancestors can't break `fixed` positioning.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-prompt-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in-up overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-md text-[#525252] hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center mb-5">
          <Cloud className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
        </div>

        <h2
          id="save-prompt-title"
          className="text-2xl font-bold text-white tracking-tight mb-2.5"
        >
          Want to keep this prompt?
        </h2>
        <p className="text-sm text-[#a1a1a1] leading-relaxed mb-6">
          Your prompt is copied. Sign up for free to store it and access it
          anytime, on any device.
        </p>

        <button
          type="button"
          onClick={handleGoogle}
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#f0f0f0] mb-3"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <Link href="/login" onClick={onClose} className="btn-primary btn-shimmer">
          <LogIn className="w-4 h-4" />
          Sign up with email
        </Link>

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-xs text-[#525252] hover:text-[#a1a1a1] transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>,
    document.body
  );
}
