import PromptEnhancer from "@/components/PromptEnhancer";
import Footer from "@/components/Footer";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ChatGPT Prompt Enhancer - Promhance',
  description: 'Optimize your raw ideas into masterfully engineered ChatGPT prompts. Get better formatting, explicit constraints, and richer outputs from AI.',
  openGraph: {
    title: 'ChatGPT Prompt Enhancer - Promhance',
    description: 'Transform rough ideas into powerful ChatGPT prompts instantly.',
  }
};

export default function ChatGPTPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden bg-[#0a0a0a] text-[#f5f5f5] selection:bg-white/20 pt-24">
      {/* Monochrome grid overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <div className="relative z-10 w-full flex flex-col items-center flex-grow mb-12">
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10">
          {/* Header area */}
          <div className="mb-6 sm:mb-10 text-center space-y-4 pt-12 sm:pt-16">
            <h1
              className="animate-fade-in-up text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white"
              style={{ animationDelay: "0ms" }}
            >
              ChatGPT Prompt Enhancer
            </h1>

            <p
              className="animate-fade-in-up max-w-lg mx-auto text-base sm:text-lg text-[#a1a1a1] leading-relaxed"
              style={{ animationDelay: "140ms" }}
            >
              Stop guessing what ChatGPT wants. Paste your rough idea below and our AI will automatically structure it into a perfect, role-driven prompt designed to get the best responses.
            </p>
          </div>

          {/* Enhancer Component */}
          <div
            className="animate-fade-in-up pb-4"
            style={{ animationDelay: "280ms" }}
          >
            <PromptEnhancer defaultMode="LLM Prompt" />
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "ChatGPT Prompt Enhancer",
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "Any",
            "description": "Optimize your raw ideas into masterfully engineered ChatGPT prompts.",
            "url": "https://www.promhance.com/chatgpt-prompt-enhancer",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })
        }}
      />

      <Footer />
    </main>
  );
}

