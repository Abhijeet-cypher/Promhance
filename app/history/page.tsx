import type { Metadata } from "next";
import HistoryClient from "@/components/HistoryClient";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Prompt History",
  description:
    "Reuse every prompt you have enhanced with Promhance. Your history is saved automatically on this device and syncs across devices when you sign in.",
  alternates: {
    canonical: "https://www.promhance.com/history",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function HistoryPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden bg-[#0a0a0a] text-[#f5f5f5] pt-28">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 sm:px-10 flex-grow pb-24">
        <HistoryClient />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Promhance Prompt History",
            url: "https://www.promhance.com/history",
            description:
              "Reuse every prompt you have enhanced with Promhance, synced across devices when signed in.",
          }),
        }}
      />

      <Footer />
    </main>
  );
}
