import PromptEnhancer from "@/components/PromptEnhancer";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Brain, Palette, Code, PenTool, Megaphone, Clapperboard, Zap, Target, Unlock } from "lucide-react";

/* ─── Reusable section header ─── */
function SectionHeader({
  overline, heading, sub
}: { overline: string; heading: string; sub: string }) {
  return (
    <div className="text-center mb-12 sm:mb-16">
      <span className="inline-block text-xs font-semibold tracking-[0.18em] uppercase text-blue-400 mb-3">
        {overline}
      </span>
      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
        {heading}
      </h2>
      <p className="text-[#a1a1a1] max-w-xl mx-auto text-base leading-relaxed">
        {sub}
      </p>
    </div>
  );
}

const USE_CASES = [
  { icon: Brain,       label: "ChatGPT" },
  { icon: Palette,     label: "Image Generation" },
  { icon: Code,        label: "Coding" },
  { icon: PenTool,     label: "Blog Writing" },
  { icon: Megaphone,   label: "Marketing" },
  { icon: Clapperboard,label: "Content Creation" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "10× Faster PromptOps",
    desc: "Stop spending minutes crafting the perfect prompt. Type a rough idea and get a production-ready prompt optimized for any AI.",
  },
  {
    icon: Target,
    title: "Data-Driven Prompting",
    desc: "Structured prompts with context, constraints, and formatting instructions consistently produce higher quality, predictable responses.",
  },
  {
    icon: Unlock,
    title: "The Ultimate Prompt Enhancer",
    desc: "No accounts, no paywalls, no rate limits. Start enhancing your prompts using professional prompt engineering frameworks right away.",
  },
];

const FAQS = [
  {
    q: "What is an AI Prompt Enhancer?",
    a: "An AI Prompt Enhancer is a tool that takes a simple idea and restructures it into a highly detailed, optimized prompt. Promhance uses proven prompt engineering frameworks to improve the quality of AI outputs automatically.",
  },
  {
    q: "Which AI models work with Promhance?",
    a: "Promhance generates prompts optimized for ChatGPT, Claude, Gemini, Midjourney, and most modern LLMs. It is designed to be the ultimate PromptOps tool for any AI workflow.",
  },
  {
    q: "Is Promhance completely free to use?",
    a: "Yes, Promhance is a 100% free prompt generator. There are no credit cards, accounts, or paywalls required to start generating production-ready prompts.",
  },
  {
    q: "What is PromptOps and how does Promhance help?",
    a: "PromptOps refers to the professional lifecycle management and optimization of AI prompts. Promhance acts as your first layer of PromptOps by ensuring every prompt is structurally sound, contextual, and formatted for maximum AI comprehension.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden bg-[#0a0a0a] text-[#f5f5f5] selection:bg-blue-500/20 pt-24">

      {/* Subtle monochrome grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <div className="relative z-10 w-full flex flex-col items-center flex-grow">

        {/* ── Hero ── */}
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="mb-6 sm:mb-10 text-center space-y-4 pt-12 sm:pt-16">
            <h1
              className="animate-fade-in-up text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight"
              style={{ animationDelay: "0ms" }}
            >
              <span className="text-white">Prom</span>
              <span className="text-blue-400">hance</span>
            </h1>
            <p
              className="animate-fade-in-up max-w-lg mx-auto text-base sm:text-lg text-[#a1a1a1] leading-relaxed"
              style={{ animationDelay: "140ms" }}
            >
              Transform rough ideas into masterfully engineered AI prompts — in seconds.
            </p>
          </div>

          {/* ── Enhancer Tool ── */}
          <div
            className="animate-fade-in-up pb-4"
            style={{ animationDelay: "280ms" }}
          >
            <PromptEnhancer />
          </div>
        </div>

        {/* ── Below-fold sections ── */}
        <div className="w-full max-w-5xl mx-auto px-6 sm:px-10">

          {/* ═══ How It Works ═══ */}
          <section className="py-20 sm:py-28 border-t border-[#1a1a1a]">
            <ScrollReveal>
              <SectionHeader
                overline="How It Works"
                heading="Three steps to better AI results"
                sub="You don't need to be a prompt engineer. Give us a rough idea and we'll take it from there."
              />
            </ScrollReveal>

            <div className="grid sm:grid-cols-3 gap-5 sm:gap-6 relative">
              {/* Connector line on desktop */}
              <div className="hidden sm:block absolute top-9 left-[calc(33.33%+12px)] right-[calc(33.33%+12px)] h-px bg-gradient-to-r from-blue-500/20 via-blue-500/40 to-blue-500/20 -z-10" />

              {[
                { n: "01", title: "Enter Your Idea", desc: "Write a simple sentence or rough prompt describing what you want the AI to generate." },
                { n: "02", title: "Enhance the Prompt", desc: "Promhance restructures and expands your idea into a precise, structured prompt with clear instructions." },
                { n: "03", title: "Use With Any AI", desc: "Copy and paste the optimized prompt into ChatGPT, Claude, Midjourney, or any other AI tool you use." },
              ].map((step, i) => (
                <ScrollReveal key={step.n} delay={i * 120}>
                  <div className="relative p-7 rounded-2xl bg-[#111111] border border-[#2a2a2a] group hover:border-[#3a3a3a] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden">
                    {/* Large watermark number */}
                    <span className="absolute -bottom-2 right-4 text-7xl font-black text-white/[0.03] select-none leading-none pointer-events-none">
                      {step.n}
                    </span>
                    {/* Step badge */}
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center mb-5">
                      <span className="text-blue-400 font-bold text-xs tracking-wider">{step.n}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2.5 tracking-tight">{step.title}</h3>
                    <p className="text-base text-[#a1a1a1] leading-relaxed">{step.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* ═══ Use Cases ═══ */}
          <section className="py-20 sm:py-28 border-t border-[#1a1a1a]">
            <ScrollReveal>
              <SectionHeader
                overline="Use Cases"
                heading="One tool, every AI workflow"
                sub="From text to images, code to marketing — Promhance enhances prompts for every major AI category."
              />
            </ScrollReveal>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
              {USE_CASES.map(({ icon: Icon, label }, i) => (
                <ScrollReveal key={label} delay={i * 60}>
                  <div className="group flex flex-col items-center justify-center gap-4 py-8 px-4 rounded-2xl bg-[#111111] border border-[#2a2a2a] hover:bg-[#141414] hover:border-[#3a3a3a] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-300 text-center cursor-default">
                    <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/25 transition-all duration-300">
                      <Icon
                        className="w-5 h-5 text-[#525252] group-hover:text-blue-400 transition-colors duration-300"
                        strokeWidth={1.5}
                      />
                    </div>
                    <span className="text-sm font-medium text-[#a1a1a1] group-hover:text-white transition-colors leading-tight">
                      {label}
                    </span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* ═══ Why Promhance ═══ */}
          <section className="py-20 sm:py-28 border-t border-[#1a1a1a]">
            <ScrollReveal>
              <SectionHeader
                overline="Why Promhance"
                heading="Built for people who use AI every day"
                sub="Promhance removes the trial-and-error from prompt writing so you can focus on what matters."
              />
            </ScrollReveal>

            <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
              {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                <ScrollReveal key={title} delay={i * 120}>
                  <div className="p-7 sm:p-8 rounded-2xl bg-[#111111] border border-[#2a2a2a] hover:border-[#3a3a3a] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-300 h-full space-y-5 group">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/15 transition-colors duration-300">
                      <Icon className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-2.5">
                      <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
                      <p className="text-base text-[#a1a1a1] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* ═══ FAQ ═══ */}
          <section className="py-20 sm:py-28 border-t border-[#1a1a1a]">
            <ScrollReveal>
              <SectionHeader
                overline="FAQ"
                heading="Frequently asked questions"
                sub="Everything you need to know about Promhance."
              />
            </ScrollReveal>

            <div className="space-y-3 max-w-3xl mx-auto">
              {FAQS.map((faq, i) => (
                <ScrollReveal key={i} delay={i * 80}>
                  <div className="rounded-2xl bg-[#111111] border border-[#2a2a2a] hover:border-[#2f2f2f] hover:bg-[#131313] transition-all duration-200 p-6 sm:p-7">
                    <div className="flex gap-4">
                      {/* Q badge */}
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mt-0.5">
                        <span className="text-[11px] font-bold text-blue-400 leading-none">Q</span>
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": FAQS.map((faq) => ({
              "@type": "Question",
              "name": faq.q,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.a
              }
            }))
          })
        }}
      />

      <Footer />
    </main>
  );
}