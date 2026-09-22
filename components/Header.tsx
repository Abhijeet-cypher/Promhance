"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, LogIn, LogOut, History } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";

export default function Header() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Promhance", href: "/" },
    { name: "ChatGPT", href: "/chatgpt-prompt-enhancer" },
    { name: "Midjourney", href: "/midjourney-prompt-generator" },
    { name: "YouTube", href: "/youtube-prompt-generator" },
    { name: "PromAI", href: "/promai" },
    { name: "Viral Prompts", href: "/viral-prompts" },
    { name: "History", href: "/history" },
    { name: "Blog", href: "/blog" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? "bg-[#0a0a0a] py-4 shadow-[0_1px_0_rgba(255,255,255,0.06)]"
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
          <Image src="/logo.svg" alt="Promhance Logo" width={48} height={48} className="w-9 h-9 sm:w-12 sm:h-12" />
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Prom<span className="text-blue-400">hance</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 bg-[#111111] px-2 py-1.5 rounded-full border border-[#2a2a2a]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors outline-none ${isActive
                  ? "text-white"
                  : "text-[#a1a1a1] hover:text-white hover:bg-white/5"
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-border"
                    className="absolute inset-0 rounded-full border border-blue-500/60 shadow-[0_0_14px_rgba(59,130,246,0.25)]"
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
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://github.com/Abhijeet-cypher/Promhance"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-[#a1a1a1] hover:text-white transition-colors flex items-center gap-2 group"
          >
            <GithubIcon className="w-5 h-5 group-hover:text-blue-400 transition-colors" />
            <span className="hidden lg:inline-block">Star us</span>
          </a>

          {!loading && !user && (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/15 hover:border-blue-500/45 transition-all"
            >
              <LogIn className="w-4 h-4" strokeWidth={2} />
              <span>Sign in</span>
            </Link>
          )}

          {!loading && user && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-[#111111] border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors"
                aria-label="Account menu"
              >
                <span className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[11px] font-semibold text-blue-300">
                  {user.email?.[0]?.toUpperCase() ?? "U"}
                </span>
                <span className="hidden lg:inline-block max-w-[130px] truncate text-xs text-[#a1a1a1]">
                  {user.email}
                </span>
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-[#111111] border border-[#2a2a2a] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-20 flex flex-col overflow-hidden py-1">
                    <div className="px-3 py-2 border-b border-[#1f1f1f]">
                      <p className="text-[10px] uppercase tracking-widest text-[#525252]">Signed in as</p>
                      <p className="text-xs text-white truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/history"
                      onClick={() => setUserMenuOpen(false)}
                      className="px-3 py-2 text-xs text-[#a1a1a1] hover:text-white hover:bg-[#1a1a1a] transition-colors flex items-center gap-2"
                    >
                      <History className="w-3.5 h-3.5" />
                      My history
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        void signOut();
                      }}
                      className="px-3 py-2 text-xs text-[#a1a1a1] hover:text-white hover:bg-[#1a1a1a] transition-colors flex items-center gap-2 text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          title="Toggle Menu"
          className="md:hidden relative z-50 p-2 -mr-2 text-[#a1a1a1] hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Navigation Menu */}
        <div
          className={`fixed inset-0 bg-[#0a0a0a]/98 backdrop-blur-xl z-40 transition-all duration-500 ease-in-out md:hidden overflow-y-auto ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
        >
          <div className="flex min-h-full flex-col justify-center items-center gap-8 px-6 py-24">
          <nav className="flex flex-col items-center gap-5">
            {navLinks.map((link, i) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ transitionDelay: `${mobileMenuOpen ? i * 50 : 0}ms` }}
                  className={`text-2xl font-semibold tracking-tight transition-all duration-500 ${mobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                    } ${isActive
                      ? "text-blue-400"
                      : "text-[#a1a1a1] hover:text-white"
                    }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {!loading && (
            user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  void signOut();
                }}
                className="text-lg font-semibold tracking-tight text-[#a1a1a1] hover:text-white transition-colors"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-semibold tracking-tight text-blue-400 hover:text-blue-300 transition-colors"
              >
                Sign in
              </Link>
            )
          )}
          </div>
        </div>

      </div>
    </header>
  );
}

// Simple github icon component
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

