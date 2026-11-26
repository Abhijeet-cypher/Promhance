import type { Metadata } from "next";
import Footer from "@/components/Footer";
import PricingPlans from "@/components/billing/PricingPlans";
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
              Start free. Upgrade when you need more enhancements, full Detail Mode and
              more Deep Research.
            </p>
          </header>

          <PricingPlans />
        </div>
      </main>
      <Footer />
    </>
  );
}
