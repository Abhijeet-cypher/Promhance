import Link from "next/link";
import Image from "next/image";
import { Github, Wand2, Image as ImageIcon, Video, MessageSquare, Sparkles } from "lucide-react";
import NewsletterSignup from "@/components/NewsletterSignup";

const toolLinks = [
  { href: "/", label: "Prompt Enhancer", desc: "Optimize any prompt using AI", icon: Wand2 },
  { href: "/chatgpt-prompt-enhancer", label: "ChatGPT Prompts", desc: "For LLM conversations", icon: MessageSquare },
  { href: "/claude-prompt-improver", label: "Claude Prompts", desc: "Structured prompts for Claude", icon: MessageSquare },
  { href: "/gemini-prompt-enhancer", label: "Gemini Prompts", desc: "Structured prompts for Gemini", icon: MessageSquare },
  { href: "/midjourney-prompt-generator", label: "Midjourney Prompts", desc: "For AI image generation", icon: ImageIcon },
  { href: "/youtube-prompt-generator", label: "YouTube Prompts", desc: "Scripts & viral titles", icon: Video },
  { href: "/promai", label: "PromAI", desc: "Ask questions & test prompts", icon: Sparkles },
];

export default function Footer() {
  return (
    <footer className="relative w-full border-t border-[#2a2a2a] bg-[#0a0a0a] overflow-hidden">

      <div className="relative z-10 w-[92%] max-w-[1400px] mx-auto pt-12 pb-6">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-14">
          <div className="flex flex-col items-start">
            <Link href="/" className="group mb-5 flex items-center gap-3">
              <Image src="/logo.svg" alt="Promhance Logo" width={40} height={40} className="w-10 h-10" />
              <span className="text-xl font-bold tracking-tight text-white">
                Prom<span className="text-blue-400">hance</span>
              </span>
            </Link>

            <p className="mb-6 max-w-sm text-sm leading-relaxed text-[#a1a1a1]">
              The AI prompt engineering studio. Stop guessing what the AI wants, and start generating masterfully crafted prompts that unlock true model potential.
            </p>
            <div className="flex items-center gap-4">
              {[
                { icon: Github, href: "https://github.com/Abhijeet-cypher/Promhance", name: "GitHub" },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.name}
                  className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#111111] text-[#a1a1a1] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:border-[#3a3a3a] hover:text-white"
                >
                  <social.icon className="relative z-10 h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-5 flex items-center gap-3 text-base font-semibold tracking-wide text-white">
              <span className="h-px w-6 bg-blue-500/50" />
              Products
            </h3>
            <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2">
              {toolLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-start gap-4 rounded-2xl border border-[#2a2a2a] bg-[#111111] p-3 transition-all duration-300 hover:border-[#3a3a3a] hover:bg-[#1a1a1a]"
                >
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <link.icon className="h-4 w-4 text-[#a1a1a1] transition-colors group-hover:text-white" />
                  </div>
                  <div>
                    <div className="mb-0.5 text-sm font-medium text-[#f5f5f5] transition-colors group-hover:text-white">
                      {link.label}
                    </div>
                    <div className="text-xs leading-snug text-[#525252]">
                      {link.desc}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <NewsletterSignup />
          </div>

        </div>

        <div className="relative pt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-[#2a2a2a]">
          <p className="text-xs text-[#525252] font-medium">
            &copy; {new Date().getFullYear()} Promhance. All rights reserved.
          </p>
          <nav className="flex items-center gap-5">
            <Link
              href="/privacy"
              className="text-xs text-[#525252] hover:text-[#a1a1a1] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-[#525252] hover:text-[#a1a1a1] transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/unsubscribe"
              className="text-xs text-[#525252] hover:text-[#a1a1a1] transition-colors"
            >
              Unsubscribe
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
