import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import Footer from "@/components/Footer";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Pricing — Promhance Free, Pro & Power Plans",
  description:
    "Promhance pricing: Free forever (30 enhancements/month), Pro at $4.99/month (300) and Power at $9.99/month (1,000). Engineered prompts for ChatGPT, Claude, Gemini and Midjourney.",
  alternates: { canonical: "https://www.promhance.com/pricing" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Promhance",
  description: "AI prompt enhancer that turns rough ideas into engineered prompts.",
  offers: PLANS.map((p) => ({
    "@type": "Offer",
    name: p.name,
    price: p.priceMonthly.toFixed(2),
    priceCurrency: "USD",
    url: "https://www.promhance.com/pricing",
  })),
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="relative min-h-screen flex flex-col items-center overflow-hidden bg-[#0a0a0a] text-[#f5f5f5] pt-28 pb-24 selection:bg-white/20">
        <div className="fixed inset-0 bg-grid-overlay pointer-events-none z-0" />

        <div className="relative z-10 w-[92%] max-w-6xl mx-auto">
          <header className="mb-14 text-center">
            <span className="inline-block text-xs font-semibold tracking-[0.18em] uppercase text-blue-400 mb-3">
              Pricing
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
              Simple plans, built for how you prompt
            </h1>
            <p className="text-[#a1a1a1] text-base leading-relaxed max-w-xl mx-auto">
              Start free. Upgrade when you need more enhancements, Detail Mode and a
              saved prompt library.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-3 items-stretch">
            {PLANS.map((plan) => (
              <section
                key={plan.id}
                className={`relative flex flex-col rounded-2xl p-7 border ${
                  plan.highlighted
                    ? "bg-[#111111] border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.15)]"
                    : "bg-[#111111] border-[#2a2a2a]"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-1 text-[11px] font-semibold text-white">
                    {plan.badge}
                  </span>
                )}
                <p className="text-xs uppercase tracking-widest text-[#525252] mb-2">
                  {plan.tagline}
                </p>
                <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">
                    ${plan.priceMonthly === 0 ? "0" : plan.priceMonthly.toFixed(2)}
                  </span>
                  <span className="text-sm text-[#a1a1a1]">{plan.priceNote}</span>
                </p>
                <p className="mt-3 text-sm text-[#a1a1a1] min-h-[40px]">{plan.audience}</p>

                <ul className="mt-6 mb-8 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm text-[#d4d4d4]">
                      <Check className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" strokeWidth={2.5} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.id === "free" ? "/" : "/survey"}
                  className={`text-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-blue-500 text-white hover:bg-blue-400"
                      : "bg-white/5 border border-[#2a2a2a] text-white hover:bg-white/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              </section>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-[#525252]">
            Paid plans are not live yet — joining the waitlist is free and non-binding.
            Fair-use limits apply to unlimited features. Cancel anytime, with a 7-day
            refund on your first payment — see the{" "}
            <Link href="/terms#refund-policy" className="text-blue-400 hover:text-blue-300">
              refund policy
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
