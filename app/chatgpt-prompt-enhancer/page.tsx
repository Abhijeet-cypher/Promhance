import PromptEnhancer from "@/components/PromptEnhancer";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Metadata } from "next";
import {
  UserCheck,
  SlidersHorizontal,
  FileText,
  ArrowRight,
  Code2,
  PenLine,
  FlaskConical,
  Briefcase,
  GitBranch,
  Layers,
  Filter,
  CheckCircle2,
  MessageSquareQuote,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   METADATA
───────────────────────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "Free ChatGPT Prompt Enhancer — Better Prompts, Better Answers",
  description:
    "Turn vague ideas into expert-level ChatGPT prompts in one click. Adds role context, constraints & output format automatically. Free, no login, instant results.",
  keywords: [
    "chatgpt prompt enhancer",
    "chatgpt prompt generator",
    "improve chatgpt prompts",
    "prompt engineering tool",
    "better chatgpt responses",
    "chatgpt prompt optimizer",
    "ai prompt builder",
  ],
  alternates: {
    canonical: "https://www.promhance.com/chatgpt-prompt-enhancer",
  },
  openGraph: {
    title: "Free ChatGPT Prompt Enhancer — Better Prompts, Better Answers",
    description:
      "Transform rough ideas into powerful ChatGPT prompts instantly. Role context, constraints & output format — added automatically.",
    url: "https://www.promhance.com/chatgpt-prompt-enhancer",
    type: "website",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "Free ChatGPT Prompt Enhancer — Promhance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free ChatGPT Prompt Enhancer — Better Prompts, Better Answers",
    description:
      "Turn vague ideas into expert-level ChatGPT prompts in one click. Free, no login, instant.",
    images: ["/og"],
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────────────────── */
const WHAT_IT_DOES = [
  {
    icon: UserCheck,
    title: "Adds Role Context",
    desc: "Automatically assigns an expert persona to your prompt — \"Act as a senior software architect\" — so ChatGPT responds from a position of depth, not generality.",
  },
  {
    icon: SlidersHorizontal,
    title: "Injects Constraints",
    desc: "Adds tone, length, audience, and format constraints that guide ChatGPT to produce exactly what you need, every time — no more vague, bloated answers.",
  },
  {
    icon: FileText,
    title: "Structures the Output",
    desc: "Specifies the exact output format — bullet lists, markdown tables, numbered steps — so the response is copy-paste ready, not raw prose to reformat.",
  },
];

const TECHNIQUES = [
  {
    icon: UserCheck,
    title: "Role Prompting",
    desc: "Prefix your prompt with a specific expert role. \"Act as a senior UX designer\" forces ChatGPT to apply domain expertise and professional judgment to its answer.",
    tag: "Most Effective",
  },
  {
    icon: GitBranch,
    title: "Chain-of-Thought",
    desc: "Ask ChatGPT to \"think step by step\" before answering. This technique dramatically improves reasoning quality on complex problems, math, and multi-step logic.",
    tag: "For Complex Tasks",
  },
  {
    icon: MessageSquareQuote,
    title: "Few-Shot Prompting",
    desc: "Include 2–3 examples of the input-output pattern you want. ChatGPT learns the format from the examples and replicates it precisely for your actual request.",
    tag: "For Consistency",
  },
  {
    icon: Filter,
    title: "Constraint Injection",
    desc: "Explicitly state tone (professional, casual), length (under 200 words), audience (5-year-old, C-suite), and format. Constraints eliminate ambiguity and bloat.",
    tag: "For Precision",
  },
];

const BEFORE_AFTER = [
  {
    category: "Writing",
    before: "Write a blog post about productivity.",
    after:
      "Act as a professional content strategist writing for busy startup founders. Write a 600-word blog post titled '5 Productivity Systems That Actually Stick' using the Problem-Agitate-Solution framework. Use H2 subheadings, short paragraphs, and end with a single clear CTA. Tone: direct, actionable, no fluff.",
  },
  {
    category: "Coding",
    before: "Write code to fetch data from an API.",
    after:
      "Act as a senior TypeScript engineer. Write a production-ready async function that fetches paginated data from a REST API endpoint. Include: retry logic (3 attempts, exponential backoff), TypeScript generics for the response type, error handling with typed custom errors, and inline JSDoc comments. Return a typed array of results.",
  },
  {
    category: "Research",
    before: "Explain machine learning.",
    after:
      "Act as a university lecturer explaining machine learning to first-year computer science students with no prior ML experience. Explain supervised vs unsupervised learning using one concrete real-world analogy each. Then provide a 5-bullet summary of key takeaways. Length: 400 words max. Avoid jargon — define any technical terms you use.",
  },
];

const PROMPT_CATEGORIES = [
  {
    icon: Code2,
    label: "Coding Prompts",
    color: "blue",
    prompts: [
      "Review this function for bugs, edge cases, and performance issues. Suggest specific improvements with code examples.",
      "Refactor this code to follow SOLID principles. Explain each change and why it improves maintainability.",
      "Write unit tests for this function covering happy path, edge cases, and error states. Use Jest syntax.",
    ],
  },
  {
    icon: PenLine,
    label: "Writing Prompts",
    color: "purple",
    prompts: [
      "Write a LinkedIn post announcing [achievement]. Hook in the first line, story in the middle, CTA at the end. Under 200 words.",
      "Rewrite this paragraph to be 50% shorter without losing key information. Keep the original tone.",
      "Write 5 email subject line variations for [topic]. Include one curiosity gap, one number, one benefit-driven.",
    ],
  },
  {
    icon: FlaskConical,
    label: "Research Prompts",
    color: "emerald",
    prompts: [
      "Summarize the key arguments for and against [topic] from an academic perspective. Cite the main schools of thought.",
      "Compare [Option A] and [Option B] across 5 criteria: cost, scalability, ease of use, community support, and long-term viability.",
      "Identify the 5 most common misconceptions about [topic] and explain what the evidence actually shows.",
    ],
  },
  {
    icon: Briefcase,
    label: "Business Prompts",
    color: "amber",
    prompts: [
      "Write a SWOT analysis for a [business type] targeting [audience]. Format as a 2×2 table with 3 bullet points per quadrant.",
      "Draft a cold outreach email for [product/service] targeting [role] at [company type]. Focus on one pain point. Under 100 words.",
      "Create a 90-day onboarding plan for a new [role]. Break into weeks, include goals, resources, and success metrics.",
    ],
  },
];

const TIPS = [
  {
    n: "01",
    title: "Specify the output format upfront",
    desc: "Tell ChatGPT exactly how you want the answer — bullet list, table, numbered steps, JSON. Without a format instruction, you get unstructured prose every time.",
  },
  {
    n: "02",
    title: "Assign a role before every request",
    desc: "\"Act as a [expert]\" unlocks domain vocabulary, professional reasoning, and appropriate depth. It's the single highest-ROI change you can make to any prompt.",
  },
  {
    n: "03",
    title: "Add 2–3 examples for pattern tasks",
    desc: "For anything repetitive — rewriting, classifying, formatting — show ChatGPT one or two examples of what good output looks like. It will mirror the pattern exactly.",
  },
  {
    n: "04",
    title: "Set a hard word or sentence limit",
    desc: "ChatGPT defaults to verbose. Add \"under 150 words\" or \"maximum 3 sentences\" to every prompt where conciseness matters. The constraint wins every time.",
  },
  {
    n: "05",
    title: "Iterate with targeted follow-ups",
    desc: "Don't start over when you don't like the answer. Say \"Make it more concise\", \"Use a more formal tone\", or \"Add a concrete example to point 2\". Iteration beats regeneration.",
  },
];

const FAQS = [
  {
    q: "What does a ChatGPT prompt enhancer do?",
    a: "A ChatGPT prompt enhancer takes your rough idea and automatically restructures it into a well-engineered prompt. It adds role context, explicit constraints, output format instructions, and audience specifications — all the elements that produce high-quality, consistent ChatGPT responses.",
  },
  {
    q: "How is this different from just typing a better prompt myself?",
    a: "Writing a great prompt requires knowing prompt engineering frameworks — role prompting, chain-of-thought, constraint injection, few-shot patterns. Promhance encodes all of these frameworks and applies them automatically to any input in under a second, saving you the learning curve and trial-and-error.",
  },
  {
    q: "Is Promhance completely free to use?",
    a: "Yes — Promhance is 100% free with no account, no credit card, and no rate limits. You can enhance as many prompts as you want without creating a login.",
  },
  {
    q: "Which AI models work best with Promhance-enhanced prompts?",
    a: "Promhance-enhanced prompts are primarily optimized for ChatGPT (GPT-4o, GPT-4, GPT-3.5) but work equally well with Claude, Gemini, Llama, and any other instruction-following LLM. The underlying prompt engineering principles are model-agnostic.",
  },
  {
    q: "Does Promhance store or read my prompts?",
    a: "No. Promhance does not store, log, or share your prompt content. Each enhancement is processed in real time and discarded immediately. Zero data retention.",
  },
  {
    q: "Can I use Promhance for professional or commercial work?",
    a: "Absolutely. Promhance is designed for everyday professional use — marketing copy, code generation, research summaries, client deliverables. There are no usage restrictions.",
  },
  {
    q: "What makes a ChatGPT prompt 'good'?",
    a: "A good ChatGPT prompt has four elements: a specific role (who ChatGPT should act as), a clear task (exactly what to produce), explicit constraints (tone, length, audience, format), and a defined output structure (how the answer should be organized). Promhance adds all four automatically.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   SUBCOMPONENTS
───────────────────────────────────────────────────────────────────────────── */
function SectionHeader({
  overline,
  heading,
  sub,
}: {
  overline: string;
  heading: string;
  sub: string;
}) {
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

const COLOR_MAP: Record<
  string,
  { bg: string; border: string; text: string; dot: string }
> = {
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/25", text: "text-blue-400", dot: "bg-blue-400" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/25", text: "text-purple-400", dot: "bg-purple-400" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400", dot: "bg-emerald-400" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/25", text: "text-amber-400", dot: "bg-amber-400" },
};

/* ─────────────────────────────────────────────────────────────────────────────
   JSON-LD SCHEMAS
───────────────────────────────────────────────────────────────────────────── */
const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ChatGPT Prompt Enhancer",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  description:
    "Optimize your raw ideas into masterfully engineered ChatGPT prompts. Adds role context, constraints, and output format automatically.",
  url: "https://www.promhance.com/chatgpt-prompt-enhancer",
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

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Get Better Results from ChatGPT",
  description:
    "Five proven techniques to dramatically improve the quality of your ChatGPT responses using prompt engineering principles.",
  step: TIPS.map((tip, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: tip.title,
    text: tip.desc,
  })),
};

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function ChatGPTPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden bg-[#0a0a0a] text-[#f5f5f5] selection:bg-blue-500/20 pt-24">
      {/* Monochrome grid overlay */}
      <div className="fixed inset-0 bg-grid-overlay pointer-events-none z-0" />

      <div className="relative z-10 w-full flex flex-col items-center flex-grow">

        {/* ── Hero ── */}
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="mb-6 sm:mb-10 text-center space-y-4 pt-12 sm:pt-16">
            <h1
              className="animate-fade-in-up text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white"
              style={{ animationDelay: "0ms" }}
            >
              ChatGPT Prompt Enhancer
            </h1>
            <p
              className="animate-fade-in-up max-w-lg mx-auto text-base sm:text-lg text-[#a1a1a1] leading-relaxed"
              style={{ animationDelay: "140ms" }}
            >
              Stop guessing what ChatGPT wants. Paste your rough idea below and
              our AI will automatically structure it into a perfect, role-driven
              prompt designed to get the best responses.
            </p>
          </div>

          {/* Enhancer Tool */}
          <div
            className="animate-fade-in-up pb-4"
            style={{ animationDelay: "280ms" }}
          >
            <PromptEnhancer defaultMode="LLM Prompt" />
          </div>
        </div>

        {/* ── Below-fold content ── */}
        <div className="w-full max-w-5xl mx-auto px-6 sm:px-10">

          {/* ═══ 1 — What Does It Do ═══ */}
          <section className="py-16 sm:py-28 border-t border-[#1a1a1a]">
            <ScrollReveal>
              <SectionHeader
                overline="How It Works"
                heading="What does a ChatGPT prompt enhancer do?"
                sub="Promhance applies three core prompt engineering transformations to every input — automatically, in under a second."
              />
            </ScrollReveal>
            <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
              {WHAT_IT_DOES.map(({ icon: Icon, title, desc }, i) => (
                <ScrollReveal key={title} delay={i * 100}>
                  <div className="h-full p-7 rounded-2xl card-interactive  space-y-5 group">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/15 transition-colors duration-300">
                      <Icon className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
                      <p className="text-base text-[#a1a1a1] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* ═══ 2 — How Promhance Improves Prompts ═══ */}
          <section className="py-16 sm:py-28 border-t border-[#1a1a1a]">
            <ScrollReveal>
              <SectionHeader
                overline="The Process"
                heading="How Promhance improves your prompts"
                sub="Three stages happen behind the scenes every time you hit Enhance — in under one second."
              />
            </ScrollReveal>
            <div className="grid sm:grid-cols-3 gap-5 sm:gap-6 relative">
              {/* Connector line */}
              <div className="hidden sm:block absolute top-9 left-[calc(33.33%+12px)] right-[calc(33.33%+12px)] h-px bg-gradient-to-r from-blue-500/20 via-blue-500/40 to-blue-500/20 -z-10" />
              {[
                {
                  n: "01",
                  title: "Analyze",
                  desc: "The AI reads your input and identifies what is missing: role, constraints, output format, and audience clarity.",
                },
                {
                  n: "02",
                  title: "Restructure",
                  desc: "Your raw idea is rebuilt using the S.P.A.R.K. prompt framework — adding all missing elements in the right order.",
                },
                {
                  n: "03",
                  title: "Optimize",
                  desc: "The final prompt is tightened for clarity and token efficiency, then returned ready to paste into ChatGPT.",
                },
              ].map((step, i) => (
                <ScrollReveal key={step.n} delay={i * 120}>
                  <div className="relative p-7 rounded-2xl card-interactive  overflow-hidden">
                    <span className="absolute -bottom-2 right-4 text-7xl font-black text-white/[0.03] select-none leading-none pointer-events-none">
                      {step.n}
                    </span>
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

          {/* ═══ 3 — Before / After ═══ */}
          <section className="py-16 sm:py-28 border-t border-[#1a1a1a]">
            <ScrollReveal>
              <SectionHeader
                overline="Before / After"
                heading="See the difference a great prompt makes"
                sub="The same request — vague vs. engineered. The gap in output quality is night and day."
              />
            </ScrollReveal>
            <div className="space-y-5">
              {BEFORE_AFTER.map(({ category, before, after }, i) => (
                <ScrollReveal key={category} delay={i * 80}>
                  <div className="rounded-2xl border border-[#2a2a2a] overflow-hidden">
                    {/* Category label */}
                    <div className="px-5 py-3 bg-[#0f0f0f] border-b border-[#2a2a2a] flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-[#525252]" strokeWidth={1.5} />
                      <span className="text-xs font-semibold text-[#525252] tracking-wider uppercase">{category}</span>
                    </div>
                    {/* Two-panel */}
                    <div className="grid sm:grid-cols-[1fr_auto_1fr]">
                      {/* Before */}
                      <div className="p-6 sm:p-7 bg-[#0d0d0d]">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          <span className="text-[11px] font-semibold text-red-400 tracking-wider">BEFORE</span>
                        </div>
                        <p className="text-sm text-[#6b6b6b] leading-relaxed font-mono">{before}</p>
                      </div>
                      {/* Arrow divider — desktop */}
                      <div className="hidden sm:flex items-center justify-center px-4 bg-[#0a0a0a] border-x border-[#1a1a1a]">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                        </div>
                      </div>
                      {/* Arrow divider — mobile */}
                      <div className="sm:hidden flex items-center justify-center py-3 bg-[#0a0a0a] border-y border-[#1a1a1a]">
                        <ArrowRight className="w-4 h-4 text-blue-400 rotate-90" strokeWidth={1.5} />
                      </div>
                      {/* After */}
                      <div className="p-6 sm:p-7 bg-[#111111]">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-[11px] font-semibold text-emerald-400 tracking-wider">AFTER</span>
                        </div>
                        <p className="text-sm text-[#c4c4c4] leading-relaxed font-mono">{after}</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* ═══ 4 — Prompt Engineering Techniques ═══ */}
          <section className="py-16 sm:py-28 border-t border-[#1a1a1a]">
            <ScrollReveal>
              <SectionHeader
                overline="Prompt Engineering"
                heading="Techniques Promhance uses automatically"
                sub="These are the frameworks professional prompt engineers use. Promhance applies all of them to your input without you needing to know any of them."
              />
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
              {TECHNIQUES.map(({ icon: Icon, title, desc, tag }, i) => (
                <ScrollReveal key={title} delay={i * 80}>
                  <div className="h-full p-7 rounded-2xl card-interactive  group">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/15 transition-colors duration-300">
                        <Icon className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
                      </div>
                      <span className="text-[10px] font-semibold text-[#525252] tracking-wider uppercase border border-[#2a2a2a] rounded-full px-2.5 py-1">
                        {tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2.5 tracking-tight">{title}</h3>
                    <p className="text-base text-[#a1a1a1] leading-relaxed">{desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* ═══ 5 — Prompt Templates by Category ═══ */}
          <section className="py-16 sm:py-28 border-t border-[#1a1a1a]">
            <ScrollReveal>
              <SectionHeader
                overline="Prompt Library"
                heading="Ready-to-enhance prompt templates"
                sub="Paste any of these into Promhance and hit Enhance. Or use them as-is — they are already well-structured."
              />
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
              {PROMPT_CATEGORIES.map(({ icon: Icon, label, color, prompts }, i) => {
                const c = COLOR_MAP[color];
                return (
                  <ScrollReveal key={label} delay={i * 80}>
                    <div className="h-full rounded-2xl card-interactive  overflow-hidden group">
                      {/* Card header */}
                      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1e1e1e]">
                        <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${c.text}`} strokeWidth={1.5} />
                        </div>
                        <span className="text-base font-semibold text-white tracking-tight">{label}</span>
                      </div>
                      {/* Prompts list */}
                      <ul className="divide-y divide-[#1a1a1a]">
                        {prompts.map((p, j) => (
                          <li key={j} className="flex items-start gap-3 px-6 py-4 hover:bg-[#141414] transition-colors group/item">
                            <span className={`mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full ${c.dot}`} />
                            <p className="text-sm text-[#a1a1a1] leading-relaxed group-hover/item:text-[#c4c4c4] transition-colors">{p}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </section>

          {/* ═══ 6 — How to Get Better Results ═══ */}
          <section className="py-16 sm:py-28 border-t border-[#1a1a1a]">
            <ScrollReveal>
              <SectionHeader
                overline="Pro Tips"
                heading="How to get better results from ChatGPT"
                sub="Five habits that separate people who get great AI outputs from those who spend 20 minutes re-prompting."
              />
            </ScrollReveal>
            <div className="max-w-3xl mx-auto space-y-4">
              {TIPS.map((tip, i) => (
                <ScrollReveal key={tip.n} delay={i * 80}>
                  <div className="flex gap-5 p-6 sm:p-7 rounded-2xl bg-[#111111] border border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#131313] transition-all duration-200 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/15 transition-colors duration-300">
                      <span className="text-xs font-bold text-blue-400 tracking-wider">{tip.n}</span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        {/* <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" strokeWidth={1.5} /> */}
                        <h3 className="text-base font-semibold text-white tracking-tight">{tip.title}</h3>
                      </div>
                      <p className="text-base text-[#a1a1a1] leading-relaxed">{tip.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* ═══ 7 — FAQ ═══ */}
          <section className="py-16 sm:py-28 border-t border-[#1a1a1a]">
            <ScrollReveal>
              <SectionHeader
                overline="FAQ"
                heading="Frequently asked questions"
                sub="Everything you need to know about the ChatGPT Prompt Enhancer."
              />
            </ScrollReveal>
            <div className="space-y-3 max-w-3xl mx-auto">
              {FAQS.map((faq, i) => (
                <ScrollReveal key={i} delay={i * 60}>
                  <div className="rounded-2xl bg-[#111111] border border-[#2a2a2a] hover:border-[#2f2f2f] hover:bg-[#131313] transition-all duration-200 p-6 sm:p-7">
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
                </ScrollReveal>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* ─── JSON-LD Structured Data ─── */}
      {[softwareSchema, faqSchema, howToSchema].map((schema, i) => (
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

