/**
 * Single source of truth for subscription plans.
 * Used by the /pricing page now, and by quota enforcement later
 * (see PLAN_LIMITS — keep marketing copy and limits in one place).
 */

export type PlanId = "free" | "pro" | "power";

/** `anonymous` = visitors who have not signed in. Not a purchasable plan. */
export type TierId = PlanId | "anonymous";

export type PlanLimits = {
  /** Total enhancements per period (Basic + Detail runs). */
  enhancementsPerMonth: number;
  /** Cap on Detail-mode (`high` intensity) runs, counted inside the total. null = only the total applies. */
  detailPerMonth: number | null;
  /** Quick-action refinements per period. Tracked separately from the total. */
  refinePerMonth: number;
  /**
   * Deep Research runs per period (research before enhancing). Open to every
   * tier during the beta; 0 would mean "not included". Each run also uses one
   * enhancement, and it is the most token-hungry feature, so it is capped.
   */
  researchPerMonth: number;
  /** Per-minute burst limit per identity. */
  perMinute: number;
};

/**
 * ONE place to tune every number. Enforcement (lib/quota.ts) reads only this
 * table; the /pricing copy in PLANS below must be kept in step by hand.
 */
export const PLAN_LIMITS: Record<TierId, PlanLimits> = {
  anonymous: { enhancementsPerMonth: 10, detailPerMonth: 0, refinePerMonth: 0, researchPerMonth: 3, perMinute: 5 },
  free: { enhancementsPerMonth: 30, detailPerMonth: 5, refinePerMonth: 5, researchPerMonth: 5, perMinute: 5 },
  pro: { enhancementsPerMonth: 300, detailPerMonth: null, refinePerMonth: 60, researchPerMonth: 15, perMinute: 15 },
  power: { enhancementsPerMonth: 1000, detailPerMonth: null, refinePerMonth: 200, researchPerMonth: 60, perMinute: 30 },
};

/** Anonymous ids are client-generated and resettable, so each IP also gets a monthly ceiling of this multiple. */
export const ANON_IP_MULTIPLIER = 3;

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  badge?: string;
  priceMonthly: number;
  priceNote: string;
  audience: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Acquisition",
    priceMonthly: 0,
    priceNote: "Forever",
    audience: "Try Promhance on any supported AI platform.",
    features: [
      "30 enhancements/month",
      "Basic Mode",
      "Limited Detail Mode (5/month)",
      "Access to supported AI platforms",
      "Basic prompt optimization",
      "Standard processing",
    ],
    cta: "Get started free",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "My recommendation",
    badge: "Most popular",
    priceMonthly: 4.99,
    priceNote: "/ month",
    audience: "For students, developers and everyday AI users",
    features: [
      "300 enhancements/month",
      "Unlimited Basic Mode, subject to fair-use limits",
      "Full Detail Mode",
      "Advanced prompt optimization",
      "Save prompt history",
      "Custom prompt preferences",
      "Prompt templates",
      "Faster processing",
      "Access to new Pro features",
    ],
    cta: "Join the Pro waitlist",
    highlighted: true,
  },
  {
    id: "power",
    name: "Power",
    tagline: "Advanced users",
    priceMonthly: 9.99,
    priceNote: "/ month",
    audience: "For developers, freelancers, creators and heavy AI users",
    features: [
      "1,000 enhancements/month",
      "Everything in Pro",
      "Advanced customization",
      "Multiple prompt variations",
      "Model-specific optimization",
      "Personal prompt library",
      "Export and organize prompts",
      "Priority processing",
      "Early access to experimental features",
    ],
    cta: "Join the Power waitlist",
  },
];
