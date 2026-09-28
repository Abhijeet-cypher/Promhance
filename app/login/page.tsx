import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Promhance to sync your enhanced prompt history across devices.",
  alternates: {
    canonical: "https://www.promhance.com/login",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] text-[#f5f5f5] px-6 pt-24 pb-16">
      <div className="fixed inset-0 bg-grid-overlay pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Sign in to Promhance",
            url: "https://www.promhance.com/login",
            description:
              "Sign in to Promhance to sync your enhanced prompt history across devices.",
          }),
        }}
      />
    </main>
  );
}
