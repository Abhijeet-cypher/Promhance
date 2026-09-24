import PromptEnhancer from "@/components/PromptEnhancer";
import Footer from "@/components/Footer";
import { breadcrumbSchema } from "@/lib/schema";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Midjourney Prompt Generator',
  description: 'Create stunning Midjourney prompts with artistic styles, lighting, camera settings, and aspect ratios — generated from your basic ideas.',
  keywords: [
    'midjourney prompt generator',
    'midjourney prompts',
    'ai image prompt generator',
    'midjourney prompt builder',
    'ai art prompts',
    'midjourney parameters',
  ],
  alternates: {
    canonical: 'https://www.promhance.com/midjourney-prompt-generator',
  },
  openGraph: {
    title: 'Midjourney Prompt Generator - Promhance',
    description: 'Transform basic concepts into breathtaking AI image prompts.',
    url: 'https://www.promhance.com/midjourney-prompt-generator',
    type: 'website',
    images: [
      {
        url: '/og',
        width: 1200,
        height: 630,
        alt: 'Midjourney Prompt Generator - Promhance',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Midjourney Prompt Generator - Promhance',
    description: 'Transform basic concepts into breathtaking AI image prompts.',
    images: ['/og'],
  },
};

const FAQS = [
  {
    q: 'What is a Midjourney prompt generator?',
    a: 'A Midjourney prompt generator turns a plain description into a fully structured Midjourney prompt. Promhance automatically adds subject detail, artistic style, lighting, camera and lens settings, mood, and aspect ratio — the ingredients that consistently produce striking AI art.',
  },
  {
    q: 'How do I write a good Midjourney prompt?',
    a: 'Describe your subject first, then layer in style, lighting, composition, and technical parameters. Promhance handles this structuring for you: give it a rough idea like "a fox in a snowy forest" and it expands it into a detailed, parameter-rich prompt ready to paste into Midjourney.',
  },
  {
    q: 'Does Promhance add Midjourney parameters automatically?',
    a: 'Yes. Promhance includes relevant parameters such as aspect ratio (--ar) and style guidance so your prompt is ready to run. You can always edit the result before pasting it into Midjourney.',
  },
  {
    q: 'Is the Midjourney prompt generator free?',
    a: 'Yes — Promhance is 100% free with no account, no credit card, and no rate limits. Generate as many image prompts as you like.',
  },
  {
    q: 'Do Midjourney prompts from Promhance work with other image tools?',
    a: 'The structured prompts are primarily tuned for Midjourney, but the same descriptive detail — subject, style, lighting, composition — also improves results in DALL·E, Stable Diffusion, Ideogram, and other text-to-image models.',
  },
];

export default function MidjourneyPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden bg-[#0a0a0a] text-[#f5f5f5] selection:bg-white/20 pt-24">
      {/* Monochrome grid overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <div className="relative z-10 w-full flex flex-col items-center flex-grow mb-12">
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10">
          {/* Header area */}
          <div className="mb-6 sm:mb-10 text-center space-y-4 pt-12 sm:pt-16">
            <h1
              className="animate-fade-in-up text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white"
              style={{ animationDelay: "0ms" }}
            >
              Midjourney Prompt Generator
            </h1>

            <p
              className="animate-fade-in-up max-w-lg mx-auto text-base sm:text-lg text-[#a1a1a1] leading-relaxed"
              style={{ animationDelay: "140ms" }}
            >
              Generate breathtaking AI art. Describe your vision, and we&apos;ll instantly format it with the optimal lighting, camera parameters, and aesthetic tags Midjourney loves.
            </p>
          </div>

          {/* Enhancer Component */}
          <div
            className="animate-fade-in-up pb-4"
            style={{ animationDelay: "280ms" }}
          >
            <PromptEnhancer defaultMode="Image Generation" />
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="w-full max-w-3xl mx-auto px-6 sm:px-10 py-16 sm:py-24 border-t border-[#1a1a1a]">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-[#a1a1a1] max-w-xl mx-auto text-base leading-relaxed">
              Everything you need to know about the Midjourney Prompt Generator.
            </p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl bg-[#111111] border border-[#2a2a2a] hover:border-[#2f2f2f] hover:bg-[#131313] transition-all duration-200 p-6 sm:p-7"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mt-0.5">
                    <span className="text-[11px] font-bold text-blue-400 leading-none">Q</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 leading-snug">
                      {faq.q}
                    </h3>
                    <p className="text-base text-[#a1a1a1] leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Midjourney Prompt Generator",
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "Any",
            "description": "Create stunning Midjourney prompts with artistic styles and lighting.",
            "url": "https://www.promhance.com/midjourney-prompt-generator",
            "publisher": { "@id": "https://www.promhance.com/#organization" },
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": FAQS.map((faq) => ({
              "@type": "Question",
              "name": faq.q,
              "acceptedAnswer": { "@type": "Answer", "text": faq.a }
            }))
          })
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Midjourney Prompt Generator", path: "/midjourney-prompt-generator" },
            ])
          ),
        }}
      />

      <Footer />
    </main>
  );
}

