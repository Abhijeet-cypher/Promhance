import Link from "next/link";
import { Twitter, Github, Linkedin, Mail, Sparkles, Wand2, Image as ImageIcon, Video, MessageSquare } from "lucide-react";

const toolLinks = [
  { href: "/", label: "Prompt Enhancer", desc: "Optimize any prompt using AI", icon: Wand2, color: "text-purple-400", bg: "bg-purple-500/10", border: "group-hover:border-purple-500/30" },
  { href: "/chatgpt-prompt-enhancer", label: "ChatGPT Prompts", desc: "For LLM conversations", icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10", border: "group-hover:border-blue-500/30" },
  { href: "/midjourney-prompt-generator", label: "Midjourney Prompts", desc: "For AI image generation", icon: ImageIcon, color: "text-rose-400", bg: "bg-rose-500/10", border: "group-hover:border-rose-500/30" },
  { href: "/youtube-prompt-generator", label: "YouTube Prompts", desc: "Scripts & viral titles", icon: Video, color: "text-red-400", bg: "bg-red-500/10", border: "group-hover:border-red-500/30" },
];

export default function Footer() {
  return (
    <footer className="relative w-full border-t border-zinc-800/50 bg-zinc-950 overflow-hidden">

      <div className="relative z-10 w-[92%] max-w-[1400px] mx-auto pt-12 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-10">
          <div className="lg:col-span-4 flex flex-col items-start">
            <Link href="/" className="group flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-xl font-bold tracking-tight text-white">
                Prom<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient-x">hance</span>
              </span>
            </Link>

            <p className="text-zinc-400 leading-relaxed text-sm pr-4 mb-8 max-w-sm">
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
                  className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 rounded-full bg-purple-500/20 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />
                  <social.icon className="w-4 h-4 relative z-10" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 lg:pl-12">
            <h3 className="text-white text-base font-semibold tracking-wide mb-6 flex items-center gap-3">
              <span className="w-6 h-px bg-purple-500/50" />
              Products
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {toolLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-start gap-4 p-3 rounded-2xl bg-zinc-900/30 border border-zinc-800/60 hover:bg-zinc-900/80 transition-all duration-300 ${link.border}`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg ${link.bg} flex items-center justify-center border border-white/5`}>
                    <link.icon className={`w-4 h-4 ${link.color}`} />
                  </div>
                  <div>
                    <div className="text-zinc-100 text-sm font-medium mb-0.5 group-hover:text-white transition-colors">
                      {link.label}
                    </div>
                    <div className="text-zinc-500 text-xs leading-snug">
                      {link.desc}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

        <div className="relative pt-6 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-zinc-800/60">
          <p className="text-xs text-zinc-500 font-medium">
            &copy; {new Date().getFullYear()} Promhance Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
