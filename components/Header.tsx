"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect for glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Promhance", href: "/" },
    { name: "ChatGPT Tools", href: "/chatgpt-prompt-enhancer" },
    { name: "Midjourney", href: "/midjourney-prompt-generator" },
    { name: "YouTube", href: "/youtube-prompt-generator" },
    { name: "Blog", href: "/blog" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-zinc-950 py-4 shadow-md"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-[1400px] w-[92%] mx-auto flex items-center justify-between">
        
        {/* Logo */}
        <Link 
          href="/" 
          className="group flex items-center gap-2 relative z-50 outline-none"
          onClick={() => setMobileMenuOpen(false)}
        >
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="text-xl font-bold tracking-tight text-white">
            Prom<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient-x">hance</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 bg-zinc-900/40 px-2 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors outline-none ${
                  isActive 
                    ? "text-white" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-border"
                    className="absolute inset-0 rounded-full border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30
                    }}
                  />
                )}
                <span className="relative z-10">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
           {/* Placeholder for future auth/CTA */}
           <a 
              href="https://github.com/Abhijeet-cypher/Promhance" 
              target="_blank" 
              rel="noreferrer"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
            >
              <GithubIcon className="w-5 h-5 group-hover:text-purple-400 transition-colors" />
              <span className="hidden lg:inline-block">Star us</span>
           </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          title="Toggle Menu"
          className="md:hidden relative z-50 p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Navigation Menu */}
        <div 
          className={`fixed inset-0 bg-zinc-950/95 backdrop-blur-xl z-40 transition-all duration-500 ease-in-out md:hidden flex flex-col justify-center items-center gap-8 ${
            mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <nav className="flex flex-col items-center gap-6">
            {navLinks.map((link, i) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ transitionDelay: `${mobileMenuOpen ? i * 50 : 0}ms` }}
                  className={`text-2xl font-semibold tracking-tight transition-all duration-500 ${
                    mobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                  } ${
                    isActive 
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

      </div>
    </header>
  );
}

// Simple github icon component to avoid blowing up the lucide import size if not needed
function GithubIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
