import PromptEnhancer from "@/components/PromptEnhancer";
import Footer from "@/components/Footer";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouTube Script & Title Prompt Generator',
  description: 'Generate high-retention YouTube scripts, catchy titles, and optimized video descriptions. Transform your topic ideas into viral-ready AI prompts.',
  keywords: [
    'youtube prompt generator',
    'youtube script generator',
    'youtube title generator',
    'youtube description generator',
    'ai script writer',
    'viral video prompts',
  ],
  alternates: {
    canonical: 'https://www.promhance.com/youtube-prompt-generator',
  },
  openGraph: {
    title: 'YouTube Prompt Generator - Promhance',
    description: 'Transform basic ideas into viral YouTube scripts and ideas.',
    url: 'https://www.promhance.com/youtube-prompt-generator',
    type: 'website',
    images: [
      {
        url: '/og',
        width: 1200,
        height: 630,
        alt: 'YouTube Prompt Generator - Promhance',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Prompt Generator - Promhance',
    description: 'Transform basic ideas into viral YouTube scripts and ideas.',
    images: ['/og'],
  },
};

const FAQS = [
  {
    q: 'What is a YouTube prompt generator?',
    a: 'A YouTube prompt generator turns a rough video idea into a structured prompt that an AI can use to produce a full script, clickable title, and optimized description. Promhance adds the hook, structure, tone, and retention beats that make YouTube content perform.',
  },
  {
    q: 'Can Promhance write a full YouTube script?',
    a: 'Promhance generates the expert prompt you paste into ChatGPT, Claude, or Gemini to produce the script. The prompt specifies the hook, narrative arc, pacing, and call to action — so the AI returns a retention-optimized script instead of generic text.',
  },
  {
    q: 'How do I write a good YouTube title with AI?',
    a: 'Give Promhance your video topic and audience, then let it structure a prompt that asks for multiple title variations — including curiosity gaps, numbers, and benefit-driven angles. You pick the strongest one.',
  },
  {
    q: 'Is the YouTube prompt generator free?',
    a: 'Yes — Promhance is completely free with no sign-up, no credit card, and no usage limits. Generate as many scripts, titles, and descriptions as you need.',
  },
  {
    q: 'Does it work for Shorts and long-form videos?',
    a: 'Yes. Specify your format in the input, and Promhance will tailor the prompt structure for Shorts, long-form videos, tutorials, reviews, or vlogs.',
  },
];

export default function YouTubePage() {
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
              YouTube Prompt Generator
            </h1>

            <p
              className="animate-fade-in-up max-w-lg mx-auto text-base sm:text-lg text-[#a1a1a1] leading-relaxed"
              style={{ animationDelay: "140ms" }}
            >
              Create content that hooks viewers. Give us your video concept, and we&apos;ll format it into an expert prompt for LLMs to generate high-retention scripts, brilliant titles, and optimized descriptions.
            </p>
          </div>

          {/* Enhancer Component */}
          <div
            className="animate-fade-in-up pb-4"
            style={{ animationDelay: "280ms" }}
          >
            <PromptEnhancer defaultMode="Creative Writing" />
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="w-full max-w-3xl mx-auto px-6 sm:px-10 py-16 sm:py-24 border-t border-[#1a1a1a]">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-[#a1a1a1] max-w-xl mx-auto text-base leading-relaxed">
              Everything you need to know about the YouTube Prompt Generator.
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
            "name": "YouTube Prompt Generator",
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "Any",
            "description": "Generate high-retention YouTube scripts, catchy titles, and optimized video descriptions.",
            "url": "https://www.promhance.com/youtube-prompt-generator",
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

      <Footer />
    </main>
  );
}

