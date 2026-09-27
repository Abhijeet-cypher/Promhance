import Link from "next/link";
import PromptEnhancer from "@/components/PromptEnhancer";
import Footer from "@/components/Footer";
import { breadcrumbSchema } from "@/lib/schema";

export type ModelLandingConfig = {
  name: string;
  path: string;
  h1: string;
  intro: string;
  /** 40–60 word direct answer shown first, for answer engines and snippets. */
  quickAnswer: string;
  defaultMode?: string;
  tips: { title: string; body: string }[];
  example: { before: string; after: string };
  faqs: { q: string; a: string }[];
  related: { href: string; label: string }[];
};

const BASE_URL = "https://www.promhance.com";

function jsonLd(data: unknown) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Shared layout for model-specific enhancer landing pages. */
export default function ModelLandingPage({ config }: { config: ModelLandingConfig }) {
  const url = `${BASE_URL}${config.path}`;

  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden bg-[#0a0a0a] text-[#f5f5f5] selection:bg-white/20 pt-24">
      <div className="relative z-10 w-full flex flex-col items-center flex-grow mb-12">
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="mb-6 sm:mb-10 text-center space-y-4 pt-12 sm:pt-16">
            <h1 className="animate-fade-in-up text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
              {config.h1}
            </h1>
            <p className="animate-fade-in-up max-w-xl mx-auto text-base sm:text-lg text-[#a1a1a1] leading-relaxed">
              {config.intro}
            </p>
          </div>
          <div className="animate-fade-in-up pb-4">
            <PromptEnhancer defaultMode={config.defaultMode ?? "LLM Prompt"} />
          </div>
        </div>

        <article className="w-full max-w-3xl mx-auto px-6 sm:px-10 py-16 sm:py-20 border-t border-[#1a1a1a] space-y-14">
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 tracking-tight">
              What is a {config.name} prompt enhancer?
            </h2>
            <p className="text-base text-[#a1a1a1] leading-relaxed">{config.quickAnswer}</p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 tracking-tight">
              How to write better prompts for {config.name}
            </h2>
            <ol className="space-y-5">
              {config.tips.map((tip, i) => (
                <li key={tip.title} className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[11px] font-bold text-blue-400">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-1">{tip.title}</h3>
                    <p className="text-base text-[#a1a1a1] leading-relaxed">{tip.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 tracking-tight">
              Before and after example
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#111111] border border-[#2a2a2a] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#a1a1a1] mb-2">Rough prompt</p>
                <p className="text-sm text-[#d4d4d4] leading-relaxed whitespace-pre-line">{config.example.before}</p>
              </div>
              <div className="rounded-2xl bg-[#111111] border border-blue-500/20 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">Enhanced prompt</p>
                <p className="text-sm text-[#d4d4d4] leading-relaxed whitespace-pre-line">{config.example.after}</p>
              </div>
            </div>
            <p className="text-sm text-[#a1a1a1] mt-3">
              Illustrative example of the structure Promhance produces; exact output varies with your input, mode and intensity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 tracking-tight">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {config.faqs.map((faq) => (
                <div key={faq.q} className="rounded-2xl bg-[#111111] border border-[#2a2a2a] p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2 leading-snug">{faq.q}</h3>
                  <p className="text-base text-[#a1a1a1] leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          <nav aria-label="Related tools" className="flex flex-wrap gap-3">
            {config.related.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="text-sm px-4 py-2 rounded-xl bg-[#111111] border border-[#2a2a2a] text-[#d4d4d4] hover:border-blue-500/40 transition-colors"
              >
                {r.label}
              </Link>
            ))}
          </nav>
        </article>
      </div>

      {jsonLd({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: config.h1,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        url,
        publisher: { "@id": `${BASE_URL}/#organization` },
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      })}
      {jsonLd({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: config.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      })}
      {jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: config.h1, path: config.path },
        ])
      )}

      <Footer />
    </main>
  );
}
