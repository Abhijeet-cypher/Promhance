import Link from "next/link";
import { Twitter, Github, Linkedin, Wand2, Image as ImageIcon, Video, MessageSquare } from "lucide-react";

const toolLinks = [
  { href: "/", label: "Prompt Enhancer", desc: "Optimize any prompt using AI", icon: Wand2 },
  { href: "/chatgpt-prompt-enhancer", label: "ChatGPT Prompts", desc: "For LLM conversations", icon: MessageSquare },
  { href: "/midjourney-prompt-generator", label: "Midjourney Prompts", desc: "For AI image generation", icon: ImageIcon },
  { href: "/youtube-prompt-generator", label: "YouTube Prompts", desc: "Scripts & viral titles", icon: Video },
];

export default function Footer() {
  return (
    <footer className="relative w-full border-t border-[#2a2a2a] bg-[#0a0a0a] overflow-hidden">

      <div className="relative z-10 w-[92%] max-w-[1400px] mx-auto pt-12 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-10">
          <div className="lg:col-span-4 flex flex-col items-start">
            <Link href="/" className="group flex items-center gap-3 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
              <span className="text-xl font-bold tracking-tight text-white">
                Prom<span className="text-blue-400">hance</span>
              </span>
            </Link>

            <p className="text-[#a1a1a1] leading-relaxed text-sm pr-4 mb-8 max-w-sm">
              The AI prompt engineering studio. Stop guessing what the AI wants, and start generating masterfully crafted prompts that unlock true model potential.
            </p>
            <div className="flex items-center gap-4">
              {[
                { icon: Twitter, href: "#", name: "Twitter" },
                { icon: Github, href: "#", name: "GitHub" },
                { icon: Linkedin, href: "#", name: "LinkedIn" },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  aria-label={social.name}
                  className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-[#111111] border border-[#2a2a2a] text-[#a1a1a1] hover:text-white hover:border-[#3a3a3a] transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                >
                  <social.icon className="w-4 h-4 relative z-10" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 lg:pl-12">
            <h3 className="text-white text-base font-semibold tracking-wide mb-6 flex items-center gap-3">
              <span className="w-6 h-px bg-blue-500/50" />
              Products
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {toolLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-start gap-4 p-3 rounded-2xl bg-[#111111] border border-[#2a2a2a] hover:bg-[#1a1a1a] hover:border-[#3a3a3a] transition-all duration-300"
                >
                  <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                    <link.icon className="w-4 h-4 text-[#a1a1a1] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <div className="text-[#f5f5f5] text-sm font-medium mb-0.5 group-hover:text-white transition-colors">
                      {link.label}
                    </div>
                    <div className="text-[#525252] text-xs leading-snug">
                      {link.desc}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

        <div className="relative pt-6 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-[#2a2a2a]">
          <p className="text-xs text-[#525252] font-medium">
            &copy; {new Date().getFullYear()} Promhance Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
