import PromptEnhancer from "@/components/PromptEnhancer";
import { Brain, Palette, Code, PenTool, Megaphone, Clapperboard } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center p-4  overflow-hidden bg-zinc-950 text-zinc-50 selection:bg-purple-500/30">
      {/* Background decorations - Increased depth and presence */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-purple-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed top-[20%] right-[20%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Enhanced Grid pattern overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col items-center flex-grow mb-12">
        {/* Logo/Header area */}
        <div className="mb-4 sm:mb-8 text-center space-y-3 pt-6 sm:pt-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            <span className="text-zinc-100 dark:text-white">
              Prom
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 animate-gradient-x">
              hance
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed">
            Elevate your raw ideas into masterfully engineered prompts. Harness the power of AI to unlock maximum potential from your language models.
          </p>
        </div>

        {/* Enhancer Component */}
        <div className="w-full pb-8">
          <PromptEnhancer />
        </div>

        {/* SEO Sections */}
        <div className="w-[90%] max-w-[1400px] mx-auto mt-16 space-y-24">
          
          {/* How It Works Section */}
          <section className="space-y-8 relative">
            <div className="absolute -inset-x-4 -inset-y-4 rounded-3xl bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-sm -z-10" />
            <div className="text-center space-y-4 pt-4">
              <h2 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                How Promhance Works
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base">
                Transform your raw ideas into masterfully engineered prompts in three simple steps.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 pb-4">
              <div className="relative p-6 rounded-2xl bg-zinc-950/80 border border-purple-500/20 shadow-lg shadow-purple-500/5 group hover:border-purple-500/40 transition-colors">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold backdrop-blur-md">1</div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">Enter Your Idea</h3>
                <p className="text-sm text-zinc-400">Write a simple sentence or rough prompt describing what you want to generate.</p>
              </div>
              <div className="relative p-6 rounded-2xl bg-zinc-950/80 border border-purple-500/20 shadow-lg shadow-purple-500/5 group hover:border-purple-500/40 transition-colors">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold backdrop-blur-md">2</div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">Enhance the Prompt</h3>
                <p className="text-sm text-zinc-400">Promhance acts as an AI prompt generator, restructuring and expanding it into a detailed prompt.</p>
              </div>
              <div className="relative p-6 rounded-2xl bg-zinc-950/80 border border-purple-500/20 shadow-lg shadow-purple-500/5 group hover:border-purple-500/40 transition-colors">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold backdrop-blur-md">3</div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">Use With AI Tools</h3>
                <p className="text-sm text-zinc-400">Copy the optimized prompt and use it in ChatGPT, Claude, image generators, or coding assistants.</p>
              </div>
            </div>
          </section>

          {/* Use Cases Grid */}
          <section className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                Use Promhance For
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base">
                Our prompt optimizer is perfect for a wide variety of AI tasks, helping you achieve better results faster.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[
                { icon: <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-pink-400" strokeWidth={1.5} />, text: "ChatGPT prompts" },
                { icon: <Palette className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400" strokeWidth={1.5} />, text: "Image generation prompts" },
                { icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" strokeWidth={1.5} />, text: "Coding prompts" },
                { icon: <PenTool className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" strokeWidth={1.5} />, text: "Blog writing prompts" },
                { icon: <Megaphone className="w-8 h-8 sm:w-10 sm:h-10 text-rose-400" strokeWidth={1.5} />, text: "Marketing prompts" },
                { icon: <Clapperboard className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" strokeWidth={1.5} />, text: "Content creation prompts" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 hover:bg-zinc-800/60 transition-colors gap-3 text-center group">
                  <div className="mb-1 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">{item.icon}</div>
                  <span className="text-sm sm:text-base font-medium text-zinc-300">{item.text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* SEO Paragraph */}
          <section className="pt-12 pb-8 border-t border-zinc-800/50 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-6 text-center">What is Prompt Engineering?</h2>
            <div className="space-y-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
              <p>
                Prompt engineering is the process of designing effective inputs for AI models so they produce better results. Instead of writing vague instructions, well-structured prompts help AI understand exactly what you want.
              </p>
              <p>
                Promhance simplifies prompt engineering by transforming simple ideas into structured, detailed prompts optimized for modern AI systems like ChatGPT, Claude, and Gemini.
              </p>
              <p>
                With Promhance, you can quickly improve AI prompts, making responses more accurate, creative, and aligned with your original idea.
              </p>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="space-y-8 pt-8 pb-12">
            <div className="text-center space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                Frequently Asked Questions
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="group rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-5 sm:p-6 hover:border-zinc-700 transition-colors">
                <h3 className="text-base sm:text-lg font-semibold text-zinc-200 mb-2 flex items-center gap-2">
                  <span className="text-purple-400 font-bold">Q:</span> Is Promhance free to use?
                </h3>
                <p className="text-zinc-400 text-sm sm:text-base pl-6">
                  <span className="text-indigo-400 font-bold hidden sm:inline-block mr-2">A:</span> Yes, Promhance is currently free to use to improve AI prompts.
                </p>
              </div>
              <div className="group rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-5 sm:p-6 hover:border-zinc-700 transition-colors">
                <h3 className="text-base sm:text-lg font-semibold text-zinc-200 mb-2 flex items-center gap-2">
                  <span className="text-purple-400 font-bold">Q:</span> Which AI models work with Promhance prompts?
                </h3>
                <p className="text-zinc-400 text-sm sm:text-base pl-6">
                  <span className="text-indigo-400 font-bold hidden sm:inline-block mr-2">A:</span> Promhance prompts work with ChatGPT, Claude, Gemini, Midjourney, and most modern AI tools. It is the ultimate prompt generator for ChatGPT and beyond.
                </p>
              </div>
              <div className="group rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-5 sm:p-6 hover:border-zinc-700 transition-colors">
                <h3 className="text-base sm:text-lg font-semibold text-zinc-200 mb-2 flex items-center gap-2">
                  <span className="text-purple-400 font-bold">Q:</span> Do I need prompt engineering knowledge?
                </h3>
                <p className="text-zinc-400 text-sm sm:text-base pl-6">
                  <span className="text-indigo-400 font-bold hidden sm:inline-block mr-2">A:</span> No. As a comprehensive prompt engineering tool, Promhance automatically structures your ideas into highly effective prompts without requiring any prior knowledge.
                </p>
              </div>
            </div>
          </section>
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