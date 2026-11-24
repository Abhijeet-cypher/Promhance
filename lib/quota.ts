import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { getEntitlements, type Entitlements } from "@/lib/entitlements";
import { ANON_IP_MULTIPLIER } from "@/lib/plans";
import { isQuotaEnforced } from "@/lib/app-settings";
import { getAdmin } from "@/lib/admin";

/**
 * 'basic'  — Basic-mode enhancement (counts toward the total)
 * 'detail' — Detail-mode (`high` intensity) enhancement (total + detail)
 * 'refine' — quick-action refinement (its own bucket)
 * 'research' — Deep Research run (its own bucket; the same request also reserves
 *             a 'basic'/'detail' unit for the enhancement itself)
 */
export type QuotaKind = "basic" | "detail" | "refine" | "research";

export type Reservation = {
  /** Gives the reserved unit back (model failed). Idempotent, never throws. */
  release: () => Promise<void>;
};

type ConsumeResult = {
  allowed: boolean;
  total: number;
  detail: number;
  refine: number;
  research: number;
};

type Bucket = { ownerKey: string; totalLimit: number };

const NOOP: Reservation = { release: async () => {} };

const TIER_LABEL = { anonymous: "Anonymous", free: "Free", pro: "Pro", power: "Power" } as const;

function deny(
  ent: Entitlements,
  code: "quota_exceeded" | "upgrade_required",
  kind: QuotaKind,
  used: number,
  limit: number
) {
  const anon = ent.tier === "anonymous";
  const reset = new Date(ent.resetsAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  let message: string;
  if (kind === "research") {
    message =
      code === "upgrade_required"
        ? "Deep research isn't available on your plan."
        : anon
          ? `You've used all ${limit} free Deep Research runs this month (beta). Sign in for a free account to get more. Resets ${reset}.`
          : `You've used all ${limit} Deep Research runs this month (beta). Resets ${reset}.`;
  } else if (code === "upgrade_required") {
    message = anon
      ? `${kind === "refine" ? "Refinements" : "Detail Mode"} need a free account. Sign in to unlock it.`
      : `${kind === "refine" ? "Refinements" : "Detail Mode"} are not included in your plan.`;
  } else if (kind === "refine") {
    message = `You've used all ${limit} refinements on the ${TIER_LABEL[ent.tier]} plan this month. Resets ${reset}.`;
  } else if (kind === "detail") {
    message = `You've used all ${limit} Detail Mode runs this month. Switch to a lower intensity, or upgrade. Resets ${reset}.`;
  } else if (anon) {
    message = `You've used all ${limit} free enhancements this month. Sign in for a free account to get more. Resets ${reset}.`;
  } else {
    message = `You've reached your ${limit} enhancements for this month. Upgrade for more, or wait until ${reset}.`;
  }

  return NextResponse.json(
    {
      error: message,
      code,
      tier: ent.tier,
      kind,
      used,
      limit,
      resetsAt: ent.resetsAt,
      upgradeUrl: anon ? "/login" : "/pricing",
    },
    { status: 402 }
  );
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    console.error(`${name} failed:`, error.message);
    return null;
  }
  return data as T;
}

/**
 * Reserves one unit of quota BEFORE the model call and returns a handle that
 * refunds it if the call fails. Everything is enforced server-side.
 *
 * Fails open when quota storage is unavailable (no Supabase, migration not
 * run, transient error), matching the rate limiter: an outage of our own
 * bookkeeping should not lock real users out.
 */
export async function reserveQuota(
  req: Request,
  opts: { userId: string | null; anonId: string | null; kind: QuotaKind }
): Promise<{ ok: true; reservation: Reservation } | { ok: false; response: NextResponse }> {
  const { userId, anonId, kind } = opts;

  // Master switch (admin → Settings). Off by default: nothing is counted or
  // blocked until limits are explicitly enabled.
  if (!(await isQuotaEnforced())) return { ok: true, reservation: NOOP };

  const ent = await getEntitlements(userId);
  const { limits } = ent;
  const ip = getClientIp(req);

  const idKey = userId ? `u:${userId}` : anonId ? `a:${anonId}` : `ip:${ip}`;

  // Short-window burst guard per identity (on top of the per-IP limiter).
  if (await isRateLimited(`burst:${idKey}`, limits.perMinute, 60)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again.", code: "rate_limited" },
        { status: 429, headers: { "Retry-After": "60" } }
      ),
    };
  }

  // Features the tier does not have at all.
  if (kind === "detail" && limits.detailPerMonth === 0) {
    return { ok: false, response: deny(ent, "upgrade_required", kind, 0, 0) };
  }
  if (kind === "refine" && limits.refinePerMonth === 0) {
    return { ok: false, response: deny(ent, "upgrade_required", kind, 0, 0) };
  }

  const buckets: Bucket[] = [{ ownerKey: idKey, totalLimit: limits.enhancementsPerMonth }];
  // A reset anon id must not reset the quota: also cap per IP. Skip when the
  // primary key is already the IP.
  if (!userId && anonId && kind !== "refine") {
    buckets.push({
      ownerKey: `ip:${ip}`,
      totalLimit: limits.enhancementsPerMonth * ANON_IP_MULTIPLIER,
    });
  }

  const taken: Bucket[] = [];
  const refundAll = async () => {
    await Promise.all(
      taken.splice(0).map((b) =>
        rpc("refund_quota", { p_owner: b.ownerKey, p_period: ent.period, p_kind: kind })
      )
    );
  };

  for (const bucket of buckets) {
    const result = await rpc<ConsumeResult>("consume_quota", {
      p_owner: bucket.ownerKey,
      p_period: ent.period,
      p_kind: kind,
      p_total_limit: bucket.totalLimit,
      p_detail_limit: limits.detailPerMonth,
      p_refine_limit: limits.refinePerMonth,
      p_research_limit: limits.researchPerMonth,
    });

    if (!result) continue; // storage unavailable: fail open for this bucket

    if (!result.allowed) {
      await refundAll();
      const isDetail = kind === "detail" && limits.detailPerMonth !== null && result.detail >= limits.detailPerMonth;
      const effectiveKind: QuotaKind = isDetail ? "detail" : kind;
      const used = kind === "refine" ? result.refine : isDetail ? result.detail : result.total;
      const limit =
        kind === "refine"
          ? limits.refinePerMonth
          : isDetail
            ? (limits.detailPerMonth as number)
            : bucket.totalLimit;
      return { ok: false, response: deny(ent, "quota_exceeded", effectiveKind, used, limit) };
    }
    taken.push(bucket);
  }

  if (taken.length === 0) return { ok: true, reservation: NOOP };

  let released = false;
  return {
    ok: true,
    reservation: {
      release: async () => {
        if (released) return;
        released = true;
        try {
          await refundAll();
        } catch (error) {
          console.error("Quota refund failed:", error);
        }
      },
    },
  };
}

/**
 * Reservation for Deep Research (beta: open to every user, with per-tier
 * monthly limits in PLAN_LIMITS). Unlike {@link reserveQuota} this is ALWAYS
 * enforced, independent of the admin "plan limits" switch, because a research
 * run is the most token-hungry feature:
 *  - admins (ADMIN_EMAILS) bypass the limit, so the feature is easy to test;
 *  - signed-out visitors are counted per anonymous id AND per IP (ceiling of
 *    ANON_IP_MULTIPLIER x), since an anonymous id is trivially reset;
 *  - it fails CLOSED if usage storage is unavailable, so a bookkeeping outage
 *    can never turn into unmetered spend.
 */
export async function reserveResearch(
  req: Request,
  opts: { userId: string | null; anonId: string | null }
): Promise<{ ok: true; reservation: Reservation } | { ok: false; response: NextResponse }> {
  const admin = await getAdmin();
  if (admin.admin) return { ok: true, reservation: NOOP };

  const { userId, anonId } = opts;
  const ent = await getEntitlements(userId);
  const { limits } = ent;

  if (limits.researchPerMonth <= 0) {
    return { ok: false, response: deny(ent, "upgrade_required", "research", 0, 0) };
  }

  const ip = getClientIp(req);
  const idKey = userId ? `u:${userId}` : anonId ? `a:${anonId}` : `ip:${ip}`;
  const buckets: { ownerKey: string; limit: number }[] = [
    { ownerKey: idKey, limit: limits.researchPerMonth },
  ];
  if (!userId && anonId) {
    buckets.push({ ownerKey: `ip:${ip}`, limit: limits.researchPerMonth * ANON_IP_MULTIPLIER });
  }

  const taken: string[] = [];
  const refundAll = async () => {
    await Promise.all(
      taken
        .splice(0)
        .map((ownerKey) =>
          rpc("refund_quota", { p_owner: ownerKey, p_period: ent.period, p_kind: "research" })
        )
    );
  };

  for (const bucket of buckets) {
    const result = await rpc<ConsumeResult>("consume_quota", {
      p_owner: bucket.ownerKey,
      p_period: ent.period,
      p_kind: "research",
      p_total_limit: limits.enhancementsPerMonth,
      p_detail_limit: limits.detailPerMonth,
      p_refine_limit: limits.refinePerMonth,
      p_research_limit: bucket.limit,
    });

    if (!result) {
      await refundAll();
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Deep research is temporarily unavailable.", code: "research_unavailable" },
          { status: 503 }
        ),
      };
    }

    if (!result.allowed) {
      await refundAll();
      return {
        ok: false,
        response: deny(ent, "quota_exceeded", "research", result.research, bucket.limit),
      };
    }
    taken.push(bucket.ownerKey);
  }

  let released = false;
  return {
    ok: true,
    reservation: {
      release: async () => {
        if (released) return;
        released = true;
        try {
          await refundAll();
        } catch (error) {
          console.error("Research refund failed:", error);
        }
      },
    },
  };
}

/** Current usage for the signed-in/anonymous caller (for the UI). */
export async function getUsage(
  userId: string | null,
  anonId: string | null,
  ent: Entitlements
): Promise<{ total: number; detail: number; refine: number; research: number }> {
  const empty = { total: 0, detail: 0, refine: 0, research: 0 };
  const supabase = getSupabaseAdmin();
  const ownerKey = userId ? `u:${userId}` : anonId ? `a:${anonId}` : null;
  if (!supabase || !ownerKey) return empty;

  const { data, error } = await supabase
    .from("usage_counters")
    .select("total, detail, refine, research")
    .eq("owner_key", ownerKey)
    .eq("period", ent.period)
    .maybeSingle<typeof empty>();
  if (error) {
    console.error("Usage lookup failed:", error.message);
    return empty;
  }
  return data ?? empty;
}
