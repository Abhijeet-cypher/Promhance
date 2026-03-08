import PromptEnhancer from "@/components/PromptEnhancer";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Midjourney Prompt Generator - Promhance',
  description: 'Create stunning, highly-detailed Midjourney prompts. Our tool automatically injects artistic styles, lighting, camera settings, and aspect ratios from your basic ideas.',
  openGraph: {
    title: 'Midjourney Prompt Generator - Promhance',
    description: 'Transform basic concepts into breathtaking AI image prompts.',
  }
};

export default function MidjourneyPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center p-4 overflow-hidden bg-zinc-950 text-zinc-50 selection:bg-purple-500/30">
      {/* Background decorations - Modified colors for Midjourney theme */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-rose-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-orange-600/15 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Enhanced Grid pattern overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col items-center flex-grow mb-12">
        {/* Logo/Header area */}
        <div className="mb-4 sm:mb-8 text-center space-y-3 pt-6 sm:pt-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            <span className="text-zinc-100 dark:text-white">
              Midjourney Prompt Generator
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed">
            Generate breathtaking AI art. Describe your vision, and we'll instantly format it with the optimal lighting, camera parameters, and aesthetic tags Midjourney loves.
          </p>
        </div>

        {/* Enhancer Component */}
        <div className="w-full pb-8">
          <PromptEnhancer defaultMode="Image Generation" />
        </div>
      </div>

      {/* Footer */}
      <div className="relative text-center w-full z-10 flex justify-center items-center gap-4 mt-auto pb-6">
        <span className="text-zinc-600 text-xs sm:text-sm font-medium tracking-widest uppercase">
          &copy; {new Date().getFullYear()} Promhance
        </span>
      </div>
    </main>
  );
}
