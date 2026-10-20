"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Users,
  MessageSquare,
  ClipboardList,
  Mail,
  Home,
} from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/prompts", label: "Prompts", icon: Sparkles },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/survey", label: "Survey", icon: ClipboardList },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
];

export default function AdminNav({ email }: { email?: string }) {
  const pathname = usePathname();

  return (
    <aside className="lg:w-56 lg:shrink-0">
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-2 lg:sticky lg:top-28">
        <div className="hidden px-3 py-2 lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#525252]">
            Admin
          </p>
          {email && <p className="mt-0.5 truncate text-xs text-[#a1a1a1]">{email}</p>}
        </div>

        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {LINKS.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-500/10 text-white"
                    : "text-[#a1a1a1] hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${active ? "text-blue-400" : "text-[#525252]"}`}
                  strokeWidth={1.75}
                />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-1 hidden border-t border-[#1f1f1f] pt-1 lg:block">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#a1a1a1] transition-colors hover:bg-white/5 hover:text-white"
          >
            <Home className="h-4 w-4 text-[#525252]" strokeWidth={1.75} />
            Back to site
          </Link>
        </div>
      </div>
    </aside>
  );
}
