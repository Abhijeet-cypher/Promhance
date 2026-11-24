"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getAnonId } from "@/lib/anon-id";
import { hasLocalConsent, recordConsent, userHasConsent } from "@/lib/consent";
import { saveConsentOnAccount } from "@/lib/use-terms-consent";

/**
 * Ties an agreement given before signing in (the first-use gate or the sign-up
 * checkbox, including Google sign-up) to the user's account once they are
 * signed in: writes a server-side record with their user id and saves the
 * agreement on the account so it follows them to other devices.
 */
export default function ConsentSync() {
  const { user, loading } = useAuth();
  const syncedFor = useRef<string | null>(null);
  const userId = user?.id;
  const alreadyOnAccount = userHasConsent(user);

  useEffect(() => {
    if (loading || !userId || alreadyOnAccount) return;
    if (!hasLocalConsent() || syncedFor.current === userId) return;
    syncedFor.current = userId;
    void (async () => {
      await recordConsent("login_sync", getAnonId());
      await saveConsentOnAccount();
    })();
  }, [loading, userId, alreadyOnAccount]);

  return null;
}
