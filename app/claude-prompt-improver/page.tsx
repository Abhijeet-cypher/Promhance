import type { Metadata } from "next";
import ModelLandingPage, { type ModelLandingConfig } from "@/components/ModelLandingPage";

const PATH = "/claude-prompt-improver";
const TITLE = "Free Claude Prompt Improver — Better Prompts for Claude";
const DESCRIPTION =
  "Turn a rough idea into a clear, structured prompt for Claude. Adds role, context, XML-style structure and output format. Free, no account needed.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "claude prompt improver",
    "claude prompt generator",
    "claude prompt engineering",
    "how to prompt claude",
    "claude prompt optimizer",
    "anthropic claude prompts",
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
  name: "Claude",
  path: PATH,
  h1: "Claude Prompt Improver",
  intro:
    "Describe what you want in plain words. Promhance rewrites it into a structured prompt that Claude follows more reliably.",
  quickAnswer:
    "A Claude prompt improver rewrites a rough request into a structured prompt with a clear role, background context, explicit constraints and a defined output format. Claude follows detailed, well-organized instructions closely, so adding that structure usually means fewer rewrites and more predictable answers.",
  tips: [
    {
      title: "Be explicit and direct",
      body: "Claude responds well to clear, specific instructions. State the task, the audience and what a good result looks like instead of hoping it infers them.",
    },
    {
      title: "Separate instructions from data with XML-style tags",
      body: "Wrapping documents, examples and rules in tags such as <document> or <instructions> helps Claude tell your instructions apart from the material it should work on.",
    },
    {
      title: "Give context and the reason behind the task",
      body: "Explaining the purpose (who will read this and why) lets Claude make better judgement calls than a bare command.",
    },
    {
      title: "Show one or two examples",
      body: "A short example of the format or tone you want is often more effective than a paragraph describing it.",
    },
    {
      title: "Specify the output format",
      body: "Ask for the exact structure you need, such as a table, a numbered list or JSON, and state length limits up front.",
    },
  ],
  example: {
    before: "write an email to my team about the new deadline",
    after:
      "You are an experienced project manager writing to a cross-functional team.\n\nTask: announce that the launch deadline has moved from June 10 to June 24.\n\nInclude: the reason for the change, what it means for each team, and one clear next step.\nTone: calm, direct, no blame.\nFormat: subject line plus a body under 150 words.",
  },
  faqs: [
    {
      q: "What is the best way to prompt Claude?",
      a: "Be specific about the task, give the context and audience, separate instructions from source material with clear delimiters such as XML-style tags, include an example if the format matters, and state the output format you want.",
    },
    {
      q: "Does Promhance work with Claude?",
      a: "Yes. Promhance produces plain-text prompts that you paste into Claude, and they also work in ChatGPT, Gemini and other instruction-following models. Promhance itself is not affiliated with Anthropic.",
    },
    {
      q: "Is the Claude prompt improver free?",
      a: "Yes. It is free with no account or credit card required. Fair-use limits apply so the service stays fast for everyone.",
    },
    {
      q: "Does Promhance save my prompts?",
      a: "Your prompt is sent to Google's Gemini API to generate the improved version. The prompt and result are saved to your history, on your device via an anonymous ID or to your account if you sign in, and you can delete any entry at any time.",
    },
  ],
  related: [
    { href: "/", label: "Prompt Enhancer" },
    { href: "/chatgpt-prompt-enhancer", label: "ChatGPT Prompt Enhancer" },
    { href: "/gemini-prompt-enhancer", label: "Gemini Prompt Enhancer" },
    { href: "/blog/chatgpt-vs-gemini-vs-claude", label: "ChatGPT vs Claude vs Gemini guide" },
  ],
};

export default function Page() {
  return <ModelLandingPage config={config} />;
}
