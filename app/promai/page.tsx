import type { Metadata } from "next";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import PromaiChat from "@/components/PromaiChat";

export const metadata: Metadata = {
  title: "PromAI — Ask Anything or Test Your Prompt Instantly",
  description:
    "PromAI is Promhance's built-in AI. Ask any question or run and test your prompts instantly — no need to open ChatGPT, Claude, or Gemini in another tab.",
  keywords: [
    "promAI",
    "test ai prompt",
    "ask ai online",
    "free ai assistant",
    "prompt tester",
    "run prompt online",
    "chatgpt alternative",
    "ai chat no signup",
  ],
  alternates: {
    canonical: "https://www.promhance.com/promai",
  },
  openGraph: {
    title: "PromAI — Ask Anything or Test Your Prompt Instantly",
    description:
      "Ask a question or test any prompt instantly with PromAI — Promhance's built-in AI. Free, no sign-up, results in seconds.",
    url: "https://www.promhance.com/promai",
    type: "website",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "PromAI — Promhance's built-in AI assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PromAI — Ask Anything or Test Your Prompt Instantly",
    description:
      "Ask a question or test any prompt instantly with PromAI. Free, no sign-up.",
    images: ["/og"],
  },
};

const FAQS = [
  {
    q: "What is PromAI?",
    a: "PromAI is Promhance's built-in AI assistant. It lets you ask questions or test prompts directly on Promhance — so you can see how a prompt performs without opening ChatGPT, Claude, or Gemini in another tab.",
  },
  {
    q: "How do I test a prompt with PromAI?",
    a: "Switch PromAI to Test mode, paste the prompt you want to check, and press send. PromAI runs it as-is and streams back the exact output, so you can judge the prompt's quality before using it elsewhere.",
  },
  {
    q: "How is Ask mode different from Test mode?",
    a: "Ask mode treats PromAI like a helpful assistant — it answers your question and formats the reply clearly. Test mode sends your input to the model with no assistant persona, so you see the raw result your prompt actually produces.",
  },
  {
    q: "Is PromAI free to use?",
    a: "Yes. PromAI is free with no account, credit card, or rate limits. Responses stream in as they are generated.",
  },
  {
    q: "Does PromAI store my questions or prompts?",
    a: "No. PromAI processes your messages in real time and does not store, log, or share their content.",
  },
];

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PromAI",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  description:
    "Promhance's built-in AI assistant. Ask any question or test your AI prompts instantly without leaving Promhance.",
  url: "https://www.promhance.com/promai",
  publisher: { "@id": "https://www.promhance.com/#organization" },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export default function PromaiPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-x-hidden bg-[#0a0a0a] text-[#f5f5f5] selection:bg-blue-500/20 pt-24">
      {/* Monochrome grid overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <div className="relative z-10 w-full flex flex-col items-center flex-grow">
        {/* ── Hero ── */}
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="mb-6 sm:mb-8 text-center space-y-3 pt-6 sm:pt-8">
            <span className="animate-fade-in-up inline-block text-xs font-semibold tracking-[0.18em] uppercase text-blue-400">
              Try it with PromAI
            </span>
            <h1
              className="animate-fade-in-up text-2xl sm:text-4xl font-extrabold tracking-tight text-white"
              style={{ animationDelay: "80ms" }}
            >
              Ask anything.{" "}
              <span className="text-blue-400">Test any prompt.</span>
            </h1>
            <p
              className="animate-fade-in-up max-w-xl mx-auto text-sm sm:text-base text-[#a1a1a1] leading-relaxed"
              style={{ animationDelay: "160ms" }}
            >
              PromAI is Promhance&apos;s built-in AI. Get instant answers, or run
              your prompts and see the real output — without opening another platform.
            </p>
          </div>

          {/* Chat tool */}
          <div
            className="animate-fade-in-up pb-16 sm:pb-24"
            style={{ animationDelay: "280ms" }}
          >
            <Suspense
              fallback={
                <div className="w-full max-w-4xl mx-auto">
                  <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl h-[calc(100dvh-16rem)] min-h-[560px] animate-pulse" />
                </div>
              }
            >
              <PromaiChat />
            </Suspense>
          </div>
        </div>

        {/* ── Below-fold ── */}
        <div className="w-full max-w-5xl mx-auto px-6 sm:px-10">
          {/* How it works */}
          <section className="py-16 sm:py-24 border-t border-[#1a1a1a]">
            <ScrollReveal>
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                  Two ways to use PromAI
                </h2>
                <p className="text-[#a1a1a1] max-w-xl mx-auto text-base leading-relaxed">
                  Switch between modes depending on what you need — no extra tabs,
                  no copy-pasting into another AI.
                </p>
              </div>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
              {[
                {
                  title: "Ask mode",
                  desc: "Treat PromAI like a knowledgeable assistant. Ask questions on writing, code, marketing, or prompt engineering and get clear, formatted answers streamed back instantly.",
                },
                {
                  title: "Test mode",
                  desc: "Paste any prompt and run it as-is. PromAI returns the raw model output so you can judge exactly how well your prompt performs before using it elsewhere.",
                },
              ].map((item, i) => (
                <ScrollReveal key={item.title} delay={i * 100}>
                  <div className="h-full p-7 rounded-2xl bg-[#111111] border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all duration-300 space-y-3">
                    <h3 className="text-lg font-semibold text-white tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-base text-[#a1a1a1] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="py-16 sm:py-24 border-t border-[#1a1a1a]">
            <ScrollReveal>
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                  Frequently asked questions
                </h2>
                <p className="text-[#a1a1a1] max-w-xl mx-auto text-base leading-relaxed">
                  Everything you need to know about PromAI.
                </p>
              </div>
            </ScrollReveal>
            <div className="space-y-3 max-w-3xl mx-auto">
              {FAQS.map((faq, i) => (
                <ScrollReveal key={faq.q} delay={i * 60}>
                  <div className="rounded-2xl bg-[#111111] border border-[#2a2a2a] hover:border-[#2f2f2f] hover:bg-[#131313] transition-all duration-200 p-6 sm:p-7">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mt-0.5">
                        <span className="text-[11px] font-bold text-blue-400 leading-none">
                          Q
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 leading-snug">
                          {faq.q}
                        </h3>
                        <p className="text-base text-[#a1a1a1] leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ─── JSON-LD ─── */}
      {[softwareSchema, faqSchema].map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <Footer />
    </main>
  );
}
