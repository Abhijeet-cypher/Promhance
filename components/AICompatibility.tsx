import Link from "next/link";
import ScrollReveal from "./ScrollReveal";

/* ══════════════════════════════════════════════════════════════
   Official brand SVG paths sourced from simple-icons (MIT)
   All paths use viewBox="0 0 24 24" and are rendered via
   currentColor so they stay monochrome and transition cleanly.
   ══════════════════════════════════════════════════════════════ */

// OpenAI — ChatGPT  (official path, viewBox 0 0 24 24)
const OPENAI_PATH =
  "M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0L4.649 14.072A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855-5.833-3.387L15.12 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z";

// Anthropic — Claude  (from simple-icons)
const ANTHROPIC_PATH =
  "M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z";

// Claude (Anthropic's own Claude mark — more brand-recognisable)
const CLAUDE_PATH =
  "m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z";

// Google Gemini  (from simple-icons)
const GEMINI_PATH =
  "M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81";

// X — Grok  (from simple-icons, the X / xAI brand mark)
const GROK_PATH =
  "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z";

// Cursor  (from simple-icons)
const CURSOR_PATH =
  "M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23";

// Perplexity  (from simple-icons)
const PERPLEXITY_PATH =
  "M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z";

// Midjourney — not in simple-icons and the boat silhouette needs a background
// to read correctly. A clean lettermark is used instead (standard practice
// on logo-cloud sections when a mark doesn't work at small monochrome sizes).

/* ══════════════════════════════════════════════════════════════
   Platform registry
   path     → renders an SVG icon
   monogram → renders a styled text lettermark (used when the
              icon silhouette doesn't read without a bg fill)
   ══════════════════════════════════════════════════════════════ */
const AI_PLATFORMS = [
  { name: "ChatGPT", path: OPENAI_PATH, monogram: null, href: "/chatgpt-prompt-enhancer", internal: true },
  { name: "Claude", path: CLAUDE_PATH, monogram: null, href: null, internal: false },
  { name: "Gemini", path: GEMINI_PATH, monogram: null, href: null, internal: false },
  { name: "Grok", path: GROK_PATH, monogram: null, href: null, internal: false },
  { name: "Cursor", path: CURSOR_PATH, monogram: null, href: null, internal: false },
  { name: "Perplexity", path: PERPLEXITY_PATH, monogram: null, href: null, internal: false },
  { name: "Midjourney", path: null, monogram: "MJ", href: "/midjourney-prompt-generator", internal: true },
] as const;

/* ══════════════════════════════════════════════════════════════
   Single logo card — large icon above name, no colored dots
   ══════════════════════════════════════════════════════════════ */
function LogoCard({
  name,
  path,
  monogram,
  href,
  internal,
}: (typeof AI_PLATFORMS)[number]) {
  const cardClass =
    "group flex flex-col items-center gap-3 px-6 py-5 rounded-2xl " +
    "border border-[#2a2a2a] bg-[#111111] " +
    "hover:border-blue-500/30 hover:bg-[#111d2e] " +
    "hover:shadow-[0_0_28px_rgba(59,130,246,0.07)] " +
    "hover:scale-[1.025] " +
    "transition-all duration-[220ms] ease-out " +
    "cursor-pointer select-none w-[112px]";

  const iconSlot = path ? (
    /* SVG mark — for brands whose icon reads cleanly at small monochrome sizes */
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-8 h-8 text-[#4a4a4a] group-hover:text-white transition-colors duration-[220ms]"
      aria-hidden
    >
      <path d={path} />
    </svg>
  ) : (
    /* Lettermark — for brands whose silhouette needs a bg fill to read correctly */
    <span
      className="w-8 h-8 flex items-center justify-center text-[15px] font-bold tracking-tight text-[#4a4a4a] group-hover:text-white transition-colors duration-[220ms] font-mono"
      aria-hidden
    >
      {monogram}
    </span>
  );

  const inner = (
    <>
      {iconSlot}
      {/* Name label */}
      <span className="text-[12px] font-medium text-[#555555] group-hover:text-[#d4d4d4] transition-colors duration-[220ms] tracking-wide">
        {name}
      </span>
    </>
  );

  if (href && internal) {
    return (
      <Link href={href} className={cardClass}>
        {inner}
      </Link>
    );
  }

  return <span className={cardClass}>{inner}</span>;
}

/* ══════════════════════════════════════════════════════════════
   Section
   ══════════════════════════════════════════════════════════════ */
export default function AICompatibility() {
  return (
    <section className="w-full border-y border-[#1a1a1a]">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-16 sm:py-20">
        <ScrollReveal>
          <div className="flex flex-col items-center text-center">

            {/* Overline — matches SectionHeader exactly */}
            <span className="inline-block text-xs font-semibold tracking-[0.18em] uppercase text-blue-400 mb-3">
              UNIVERSAL AI COMPATIBILITY
            </span>

            {/* Heading — matches SectionHeader exactly */}
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              One optimized prompt.{" "}
              <span className="text-blue-400">Every leading AI.</span>
            </h2>

            {/* Sub-copy — matches SectionHeader exactly */}
            <p className="text-[#a1a1a1] max-w-xl mx-auto text-base leading-relaxed">
              Promhance enhances your prompt into a structured, production-ready format that works seamlessly across today's most powerful AI models.
            </p>

            {/* Logo cloud — centered flex row */}
            <div className="flex flex-wrap justify-center gap-4 mt-10 sm:mt-12">
              {AI_PLATFORMS.map((p) => (
                <LogoCard key={p.name} {...p} />
              ))}
            </div>

          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
