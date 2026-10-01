import type { Metadata } from "next";
import Footer from "@/components/Footer";
import ProSurvey from "@/components/ProSurvey";

export const metadata: Metadata = {
  title: "Promhance Pro Survey",
  description:
    "Tell us which advanced features matter most and whether you'd pay for Promhance Pro. Takes about 60 seconds.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SurveyPage() {
  return (
    <>
      <main className="relative min-h-screen flex flex-col items-center overflow-hidden bg-[#0a0a0a] text-[#f5f5f5] pt-28 pb-24 selection:bg-white/20">
        <div className="fixed inset-0 bg-grid-overlay pointer-events-none z-0" />

        <div className="relative z-10 w-[92%] max-w-2xl mx-auto">
          <header className="mb-10 text-center">
            <span className="inline-block text-xs font-semibold tracking-[0.18em] uppercase text-blue-400 mb-3">
              Your input
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
              Help shape the future of Promhance
            </h1>
            <p className="text-[#a1a1a1] text-base leading-relaxed max-w-lg mx-auto">
              We&apos;re planning advanced features and a possible Pro plan. Five quick
              questions — your answers decide what we build next.
            </p>
          </header>

          <ProSurvey />
        </div>
      </main>
      <Footer />
    </>
  );
}
