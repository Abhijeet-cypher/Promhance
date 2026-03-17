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
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden bg-zinc-950 text-zinc-50 selection:bg-purple-500/30 pt-24">
      {/* Background decorations - Increased depth and presence */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-purple-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Enhanced Grid pattern overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col items-center flex-grow mb-12">
        {/* Logo/Header area */}
        <div className="mb-4 sm:mb-8 text-center space-y-3 pt-12 sm:pt-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            <span className="text-zinc-100 dark:text-white">
              ChatGPT Prompt Enhancer
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed">
            Stop guessing what ChatGPT wants. Paste your rough idea below and our AI will automatically structure it into a perfect, role-driven prompt designed to get the best responses.
          </p>
        </div>

        {/* Enhancer Component */}
        <div className="w-full pb-8">
          <PromptEnhancer defaultMode="LLM Prompt" />
        </div>
      </div>

      <Footer />
    </main>
  );
}
