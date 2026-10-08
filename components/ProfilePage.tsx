"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Save, Globe, Check } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { COUNTRIES } from "@/lib/geo";

type Profile = {
  email: string | null;
  displayName: string | null;
  country: string | null;
  countrySource: string;
  newsletterOptIn: boolean;
  createdAt: string;
};

export default function ProfilePage() {
  const { user, loading: authLoading, configured } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not load your profile.");
      }
      const data = await res.json();
      const p: Profile = data.profile;
      setProfile(p);
      setDisplayName(p.displayName ?? "");
      setCountry(p.country ?? "");
      setNewsletterOptIn(p.newsletterOptIn);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      // Defer past the synchronous effect body to avoid a cascading render.
      await Promise.resolve();
      if (!active || authLoading) return;
      if (user) await load();
      else setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [authLoading, user, load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          country,
          newsletterOptIn,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save your profile.");
      }
      const data = await res.json();
      setProfile(data.profile);
      setDisplayName(data.profile.displayName ?? "");
      setCountry(data.profile.country ?? "");
      setNewsletterOptIn(data.profile.newsletterOptIn);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (loading && user)) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-sm text-[#a1a1a1]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your profile…
      </div>
    );
  }

  if (!configured) {
    return (
      <p className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
        Authentication is not configured. Add your Supabase keys to
        <span className="font-mono"> .env.local</span>.
      </p>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-8 text-center">
        <h1 className="text-xl font-bold text-white">Sign in to view your profile</h1>
        <p className="mt-2 text-sm text-[#a1a1a1]">
          Your profile stores your name and country across devices.
        </p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Profile</h1>
        <p className="mt-1 text-sm text-[#a1a1a1]">
          Manage your account details and tell us where you&apos;re from.
        </p>
      </header>

      <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-[#525252]">
            Email
          </label>
          <input
            value={profile?.email ?? user.email ?? ""}
            disabled
            className="w-full rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#a1a1a1] opacity-70"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="displayName"
            className="text-[11px] font-semibold uppercase tracking-widest text-[#525252]"
          >
            Display name
          </label>
          <input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            placeholder="How should we address you?"
            className="w-full rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#f5f5f5] placeholder:text-[#3a3a3a] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="country"
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#525252]"
          >
            <Globe className="h-3.5 w-3.5" />
            Country
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#f5f5f5] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
          >
            <option value="">Prefer not to say</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-[#525252]">
            {profile?.countrySource === "self"
              ? "Set by you."
              : "Auto-detected from your location — correct it if it's wrong."}
            {" "}Used only for aggregate analytics.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-3.5 py-3 transition-colors hover:border-[#3a3a3a]">
          <input
            type="checkbox"
            checked={newsletterOptIn}
            onChange={(e) => setNewsletterOptIn(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-blue-500"
          />
          <span className="text-xs leading-relaxed text-[#a1a1a1]">
            Email me the Promhance newsletter — tips, product updates, and new
            features. You can unsubscribe anytime.
          </span>
        </label>

        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
