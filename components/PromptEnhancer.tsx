"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function PromptEnhancer() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState("LLM Prompt");
  const [intensity, setIntensity] = useState("medium");

  const [isCopied, setIsCopied] = useState(false);

  const modes = [
    { id: "LLM Prompt", icon: "🤖" },
    { id: "General", icon: "✨" },
    { id: "Image Generation", icon: "🎨" },
    { id: "Creative Writing", icon: "✍️" },
    { id: "Technical/Code", icon: "💻" }
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCopy = async () => {
    if (!output) return;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(output);
      } else {
        // Fallback for non-HTTPS environments (like local IP testing on mobile)
        const textArea = document.createElement("textarea");
        textArea.value = output;
        
        // Prevent scrolling to bottom
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        document.execCommand('copy');
        textArea.remove();
      }
      
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      // Optional: you could add an error state here if needed
    }
  };

  const enhancePrompt = async () => {
    if (!input.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        body: JSON.stringify({ prompt: input, mode: mode, intensity: intensity }),
      });

      const data = await res.json();
      setOutput(data.enhanced || "Enhanced output could not be generated.");
    } catch (e) {
      setOutput("An error occurred while enhancing the prompt.");
    } finally {
      setLoading(false);
    }
  };

  // Prevent hydration mismatch and 'window is not defined' error
  if (!isMounted) return null;

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 sm:gap-8 items-stretch justify-center">
      {/* Input Side */}
      <div className="w-full lg:w-1/2 relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/30 to-indigo-500/30 rounded-[1.25rem] blur opacity-40 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 transform-gpu"></div>

        {/* Main Input Card - Enhanced Border and shadow */}
        <div className="relative p-5 sm:p-7 bg-zinc-950/95 lg:bg-zinc-950/80 lg:backdrop-blur-xl border border-purple-500/20 hover:border-purple-500/30 transition-colors rounded-2xl shadow-[0_0_40px_-10px_rgba(168,85,247,0.15)] flex flex-col h-full min-h-[550px] lg:min-h-[600px]">
          {/* Mode Selector */}
          <div className="mb-6 shrink-0">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg>
              Prompt Category
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`relative overflow-hidden group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border ${mode === m.id
                    ? "bg-purple-500/10 border-purple-500/50 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/20"
                    : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 hover:border-zinc-700 hover:shadow-lg"
                    }`}
                >
                  {mode === m.id && (
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]" />
                  )}
                  <span className="text-sm opacity-90 filter drop-shadow-sm">{m.icon}</span>
                  <span className="tracking-wide">{m.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Intensity Slider */}
          <div className="mb-5 shrink-0 bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-800/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/></svg>
                Intensity
              </label>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                {intensity === 'low' && "Basic cleanup"}
                {intensity === 'medium' && "Standard detail"}
                {intensity === 'high' && "Full specification"}
              </span>
            </div>
            
            <div className="relative px-1">
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="1"
                value={intensity === 'low' ? 1 : intensity === 'medium' ? 2 : 3}
                onChange={(e) => {
                  const val = e.target.value;
                  setIntensity(val === '1' ? 'low' : val === '2' ? 'medium' : 'high');
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[11px] font-medium mt-2">
                <span className={`cursor-pointer transition-colors ${intensity === 'low' ? 'text-purple-300' : 'text-zinc-500 hover:text-zinc-300'}`} onClick={() => setIntensity('low')}>Low</span>
                <span className={`cursor-pointer transition-colors ${intensity === 'medium' ? 'text-purple-300' : 'text-zinc-500 hover:text-zinc-300'}`} onClick={() => setIntensity('medium')}>Medium</span>
                <span className={`cursor-pointer transition-colors ${intensity === 'high' ? 'text-purple-300' : 'text-zinc-500 hover:text-zinc-300'}`} onClick={() => setIntensity('high')}>High</span>
              </div>
            </div>
          </div>

          <div className="space-y-1 mb-4 shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
              Input Concept
            </h2>
            <p className="text-zinc-400 text-sm">
              Type your raw idea or rough sentences here.
            </p>
          </div>

          {/* Text Area */}
          <div className="relative flex-grow flex flex-col overflow-hidden min-h-[160px]">
            <textarea
              className="w-full h-full bg-zinc-900/50 border border-zinc-800/80 text-zinc-100 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-zinc-600 resize-none font-sans text-base shadow-inner flex-grow overflow-y-auto"
              placeholder="e.g. A futuristic city with flying cars at sunset..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          {/* Action Button - Enhanced vibrancy and icon */}
          <div className="flex justify-end mt-5 pt-5 border-t border-zinc-800/60 shrink-0">
            <button
              onClick={enhancePrompt}
              disabled={loading || !input.trim()}
              className="relative inline-flex h-12 w-full sm:w-auto items-center justify-center overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-shadow duration-300"
            >
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#c084fc_0%,#3b82f6_50%,#c084fc_100%)]" />
              <div className="inline-flex h-full w-full items-center justify-center rounded-xl bg-zinc-950/90 px-6 py-2 text-sm font-semibold text-white backdrop-blur-xl transition-all group-hover:bg-zinc-950/70 border-t border-white/10 gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 h-4 w-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-purple-400 shrink-0">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                      <path d="M5 3v4" />
                      <path d="M19 17v4" />
                      <path d="M3 5h4" />
                      <path d="M17 19h4" />
                    </svg>
                    Enhance Prompt
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Output Side (Only shown on mobile when generated, always takes space on desktop if empty to maintain structure) */}
      {(output || loading || window.innerWidth >= 1024) && (
        <div className={`w-full lg:w-1/2 relative group transition-all duration-500 ease-out ${(!output && !loading) ? 'opacity-50 lg:opacity-100 grayscale-[0.8] blur-[1px] lg:blur-none pointer-events-none' : 'opacity-100 grayscale-0 blur-none'}`}>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-[1.25rem] blur opacity-40 transition duration-1000"></div>

          <div className="relative p-5 sm:p-7 bg-zinc-950/95 lg:bg-zinc-950/80 lg:backdrop-blur-xl border border-indigo-500/20 transition-colors rounded-2xl shadow-[0_0_40px_-10px_rgba(99,102,241,0.1)] flex flex-col h-full min-h-[550px] lg:min-h-[600px]">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="m13.5 8.5-5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                Optimized Output
              </h2>
              {output && !loading && (
                <button
                  onClick={handleCopy}
                  className={`text-xs font-medium transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shadow-sm ${
                    isCopied 
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30" 
                      : "text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700/50"
                  }`}
                  title="Copy to clipboard"
                >
                  {isCopied ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                      Copy Prompt
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/50 text-zinc-200 leading-relaxed text-sm shadow-inner overflow-y-auto flex-grow relative max-h-full markdown-content">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 bg-zinc-950/60 backdrop-blur-sm z-10 rounded-xl">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
                    <div className="w-12 h-12 rounded-full border-r-2 border-l-2 border-purple-500 animate-[spin_1.5s_linear_infinite_reverse] absolute inset-0"></div>
                  </div>
                  <p className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse mt-2">
                    Enhancing your prompt...
                  </p>
                </div>
              ) : output ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-bold text-purple-300">{children}</strong>,
                    em: ({ children }) => <em className="italic text-indigo-300">{children}</em>,
                    h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h3>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="ml-2">{children}</li>,
                    code: ({ children }) => <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono text-purple-300">{children}</code>,
                    pre: ({ children }) => <pre className="bg-zinc-800 p-3 rounded-lg mb-3 overflow-x-auto">{children}</pre>,
                  }}
                >
                  {output}
                </ReactMarkdown>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 text-zinc-500">
                  <div className="w-16 h-16 rounded-full bg-zinc-900/50 flex items-center justify-center border border-zinc-800/50 shadow-inner mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400/60"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
                  </div>
                  <p className="text-center font-medium text-zinc-400 text-sm">Your polished prompt will appear here</p>
                  <p className="text-center text-xs text-zinc-600 max-w-[200px]">Type your rough idea on the left and hit enhance to weave magic.</p>
                </div>
              )}
            </div>
            {output && !loading && (
              <div className="mt-4 pt-4 border-t border-zinc-800/60 hidden lg:block shrink-0">
                <p className="text-xs text-zinc-500 text-center">Ready to be pasted directly into your preferred AI model.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}