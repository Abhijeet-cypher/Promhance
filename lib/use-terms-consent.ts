"use client";

import { useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getAnonId } from "@/lib/anon-id";
import {
  TERMS_VERSION,
  hasLocalConsent,
  recordConsent,
  setLocalConsent,
  userHasConsent,
  type ConsentSource,
} from "@/lib/consent";

/** Saves the agreement on the account itself so it follows the user to any device. */
export async function saveConsentOnAccount(): Promise<void> {
  try {
    await createBrowserSupabaseClient()?.auth.updateUser({
      data: { terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString() },
    });
  } catch {
    // The server-side record is the source of truth; this is a convenience copy.
  }
}

/**
 * Terms-agreement state for the current visitor.
 * `isAccepted()` checks this browser and, when signed in, the account, so a
 * returning user on a new device is not asked again.
 */
export function useTermsConsent() {
  const { user } = useAuth();

  const isAccepted = useCallback(() => hasLocalConsent() || userHasConsent(user), [user]);

  const accept = useCallback(
    async (source: ConsentSource) => {
      setLocalConsent();
      await recordConsent(source, getAnonId());
      if (user) await saveConsentOnAccount();
    },
    [user]
  );

  return { isAccepted, accept };
}
