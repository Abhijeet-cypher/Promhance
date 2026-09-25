import type { Metadata } from "next";
import ModelLandingPage, { type ModelLandingConfig } from "@/components/ModelLandingPage";

const PATH = "/gemini-prompt-enhancer";
const TITLE = "Free Gemini Prompt Enhancer — Better Prompts for Google Gemini";
const DESCRIPTION =
  "Turn a rough idea into a structured prompt for Google Gemini with a clear persona, task, context and format. Free, no account needed.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "gemini prompt enhancer",
    "gemini prompt generator",
    "google gemini prompts",
    "how to prompt gemini",
    "gemini prompt optimizer",
    "gemini prompt engineering",
  ],
  alternates: { canonical: `https://www.promhance.com${PATH}` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `https://www.promhance.com${PATH}`,
    type: "website",
    images: [{ url: "/og", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og"] },
};

const config: ModelLandingConfig = {
  name: "Gemini",
  path: PATH,
  h1: "Gemini Prompt Enhancer",
  intro:
    "Type a rough idea and get a structured prompt with persona, task, context and format, ready to paste into Google Gemini.",
  quickAnswer:
    "A Gemini prompt enhancer rewrites a short request into a complete prompt that names a persona, the task, the relevant context and the desired format. Gemini gives more relevant answers when those four elements are stated clearly instead of left for the model to guess.",
  tips: [
    {
      title: "Name a persona and a task",
      body: "Start with who Gemini should act as and exactly what it should produce, for example an experienced data analyst summarizing a report.",
    },
    {
      title: "Add the context it cannot guess",
      body: "Include the audience, the source material, constraints and anything already tried. Missing context is the most common reason for generic answers.",
    },
    {
      title: "Define the format",
      body: "Say whether you want bullets, a table, headings or JSON, and set a length. Clear formats make answers easier to reuse.",
    },
    {
      title: "Use examples for tone and structure",
      body: "One or two short examples of the output you want (few-shot prompting) help Gemini match style and structure.",
    },
    {
      title: "Iterate on the prompt, not just the answer",
      body: "If the result is off, adjust the instructions and run again. Refining the prompt is faster than correcting the output line by line.",
    },
  ],
  example: {
    before: "explain kubernetes",
    after:
      "You are a senior DevOps engineer teaching a developer who has only used Docker.\n\nTask: explain what Kubernetes is and when it is worth using.\n\nInclude: pods, deployments and services, each with a one-sentence analogy.\nConstraints: no jargon without a definition; under 300 words.\nFormat: short intro, then three headed sections, then a two-line summary.",
  },
  faqs: [
    {
      q: "How do I write a good prompt for Gemini?",
      a: "State the persona, the task, the context and the output format. Add an example if tone or structure matters, and iterate on the instructions if the first answer is off.",
    },
    {
      q: "Does Promhance work with Google Gemini?",
      a: "Yes. Promhance produces plain-text prompts you can paste into Gemini, and they also work in ChatGPT, Claude and other instruction-following models. Promhance is not affiliated with Google.",
    },
    {
      q: "Is the Gemini prompt enhancer free?",
      a: "Yes. It is free with no account or credit card required. Fair-use limits apply so the service stays fast for everyone.",
    },
    {
      q: "Does Promhance save my prompts?",
      a: "Your prompt is sent to Google's Gemini API to generate the enhanced version. The prompt and result are saved to your history, on your device via an anonymous ID or to your account if you sign in, and you can delete any entry at any time.",
    },
  ],
  related: [
    { href: "/", label: "Prompt Enhancer" },
    { href: "/chatgpt-prompt-enhancer", label: "ChatGPT Prompt Enhancer" },
    { href: "/claude-prompt-improver", label: "Claude Prompt Improver" },
    { href: "/blog/chatgpt-vs-gemini-vs-claude", label: "ChatGPT vs Claude vs Gemini guide" },
  ],
};

export default function Page() {
  return <ModelLandingPage config={config} />;
}
