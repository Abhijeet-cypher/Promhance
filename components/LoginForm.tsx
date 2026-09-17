"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, ArrowRight, MailCheck } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

type Mode = "signin" | "signup";

export default function LoginForm() {
  const router = useRouter();
  const { user, loading, configured, signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/history");
    }
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signin") {
        const { error: signInError } = await signIn(email.trim(), password);
        if (signInError) {
          setError(signInError);
          return;
        }
        router.replace("/history");
        router.refresh();
      } else {
        const { error: signUpError, needsConfirmation } = await signUp(
          email.trim(),
          password
        );
        if (signUpError) {
          setError(signUpError);
          return;
        }
        if (needsConfirmation) {
          setConfirmationSent(true);
        } else {
          router.replace("/history");
          router.refresh();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmationSent) {
    return (
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-8 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center">
          <MailCheck className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-bold text-white">Check your inbox</h1>
        <p className="text-sm text-[#a1a1a1] leading-relaxed">
          We sent a confirmation link to <span className="text-white">{email}</span>.
          Click it to activate your account, then sign in to see your history on
          every device.
        </p>
        <button
          onClick={() => {
            setConfirmationSent(false);
            setMode("signin");
          }}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-7 sm:p-8">
      <div className="text-center mb-7 space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-[#a1a1a1]">
          {mode === "signin"
            ? "Sign in to access your prompt history on any device."
            : "Save your prompts and pick up where you left off."}
        </p>
      </div>

      {!configured && (
        <p className="mb-5 text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          Authentication is not configured. Add your Supabase keys to
          <span className="font-mono"> .env.local</span>.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-widest text-[#525252]">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" strokeWidth={1.75} />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all placeholder:text-[#3a3a3a]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-widest text-[#525252]">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" strokeWidth={1.75} />
            <input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all placeholder:text-[#3a3a3a]"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !configured}
          className="btn-shimmer relative overflow-hidden w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-blue-500 text-white text-sm font-semibold transition-all duration-200 hover:bg-blue-400 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_28px_rgba(59,130,246,0.4)]"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{mode === "signin" ? "Sign in" : "Create account"}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[#a1a1a1]">
        {mode === "signin" ? (
          <>
            New to Promhance?{" "}
            <button
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign in
            </button>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-[#525252]">
        Don&apos;t want an account?{" "}
        <Link href="/" className="text-[#a1a1a1] hover:text-white transition-colors">
          Keep enhancing anonymously
        </Link>{" "}
        — your history stays on this device.
      </p>

      <p className="mt-3 text-center text-xs text-[#525252]">
        By continuing, you agree to our{" "}
        <Link href="/privacy" className="text-[#a1a1a1] hover:text-white transition-colors">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="text-[#a1a1a1] hover:text-white transition-colors">
          Terms of Service
        </Link>
        .
      </p>
    </div>
  );
}
