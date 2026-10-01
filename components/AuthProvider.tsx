"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getAnonId } from "@/lib/anon-id";

type SignInResult = { error: string | null };
type SignUpResult = { error: string | null; needsConfirmation: boolean };
type AuthOptions = { newsletterOptIn?: boolean };

const NEWSLETTER_PENDING_KEY = "promhance_newsletter_pending";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string, options?: AuthOptions) => Promise<SignInResult>;
  signUp: (email: string, password: string, options?: AuthOptions) => Promise<SignUpResult>;
  signInWithGoogle: (options?: AuthOptions) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  claimAnonHistory: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createBrowserSupabaseClient();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  const claimAnonHistory = useCallback(async () => {
    try {
      await fetch("/api/auth/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonId: getAnonId() }),
      });
    } catch {
      // Best effort — history is already keyed by anon_id and will be
      // claimed on the next successful sign-in.
    }
  }, []);

  /**
   * Applies a newsletter preference captured before an OAuth redirect (where
   * `signInWithOAuth` can't carry user metadata the way email sign-up can).
   * The value is stored in localStorage just before redirecting and consumed
   * once the session comes back.
   */
  const applyPendingNewsletterPreference = useCallback(async () => {
    if (typeof window === "undefined") return;

    let pending: string | null = null;
    try {
      pending = window.localStorage.getItem(NEWSLETTER_PENDING_KEY);
      if (pending === null) return;
      window.localStorage.removeItem(NEWSLETTER_PENDING_KEY);
    } catch {
      return;
    }

    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set", optIn: pending === "true" }),
      });
    } catch {
      // Best effort — the user can always change it from the footer.
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);

      // Covers flows where the session was established server-side
      // (e.g. clicking an email-confirmation link) rather than via an
      // in-page sign-in event.
      if (data.session?.user) {
        claimAnonHistory();
        applyPendingNewsletterPreference();
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        // Claim is idempotent and append-only, so it is safe to call on
        // any authenticated state change.
        if (newSession?.user) {
          claimAnonHistory();
          applyPendingNewsletterPreference();
        }
      }
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase, claimAnonHistory, applyPendingNewsletterPreference]);

  const signIn = useCallback(
    async (
      email: string,
      password: string,
      options?: AuthOptions
    ): Promise<SignInResult> => {
      if (!supabase) return { error: "Authentication is not configured." };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };

      // Only write when the user explicitly changed the newsletter checkbox,
      // so an existing opt-out is never silently overwritten on sign-in.
      if (options?.newsletterOptIn !== undefined) {
        try {
          await fetch("/api/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "set", optIn: options.newsletterOptIn }),
          });
        } catch {
          // Preference update is best effort — sign-in already succeeded.
        }
      }

      return { error: null };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      options?: AuthOptions
    ): Promise<SignUpResult> => {
      if (!supabase) {
        return { error: "Authentication is not configured.", needsConfirmation: false };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
          // Picked up by the handle_new_user trigger so the preference is
          // correct even when email confirmation is required.
          data: { newsletter_opt_in: options?.newsletterOptIn ?? true },
        },
      });

      if (error) return { error: error.message, needsConfirmation: false };
      return { error: null, needsConfirmation: !data.session };
    },
    [supabase]
  );

  const signInWithGoogle = useCallback(
    async (options?: AuthOptions): Promise<SignInResult> => {
      if (!supabase) return { error: "Authentication is not configured." };

      // OAuth can't carry sign-up metadata, so stash the newsletter choice
      // locally and apply it once the session returns from the callback.
      if (options?.newsletterOptIn !== undefined && typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            NEWSLETTER_PENDING_KEY,
            options.newsletterOptIn ? "true" : "false"
          );
        } catch {
          // localStorage unavailable — fall back to the profile default.
        }
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });

      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        configured: Boolean(supabase),
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        claimAnonHistory,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
