"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type KeyboardEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Sparkles,
  FlaskConical,
  Send,
  Copy,
  Check,
  Loader2,
  Square,
  MessageSquare,
  Trash2,
  User,
} from "lucide-react";

type PromaiMode = "answer" | "test";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const MAX_CHARS = 2000;

const SUGGESTIONS: Record<PromaiMode, string[]> = {
  answer: [
    "Explain prompt engineering like I'm five",
    "Write a cold email to a SaaS founder",
    "What's the difference between chain-of-thought and few-shot prompting?",
    "Give me 5 YouTube video ideas about AI tools",
  ],
  test: [
    "Act as a senior React engineer and review this component.",
    "Summarize the following text in 3 bullet points.",
    "Write a product description for a noise-cancelling smartwatch.",
    "Explain recursion to a 10-year-old using Lego bricks.",
  ],
};

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-[#a1a1a1]">{children}</em>,
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0 text-white border-b border-[#2a2a2a] pb-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mb-2 mt-4 first:mt-0 text-white">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mb-2 mt-3 first:mt-0 text-[#f5f5f5]">
            {children}
          </h3>
        ),
        ul: ({ children }) => <ul className="mb-3 space-y-1.5 pl-1">{children}</ul>,
        ol: ({ children }) => (
          <ol className="mb-3 space-y-1.5 list-decimal pl-5">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="flex gap-2 items-start">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500/60 shrink-0" />
            <span>{children}</span>
          </li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-blue-500/40 pl-4 my-3 text-[#a1a1a1] italic text-sm">
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <code className="block bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3 text-xs font-mono text-blue-200 overflow-x-auto">
              {children}
            </code>
          ) : (
            <code className="bg-[#1a1a1a] border border-[#2a2a2a] px-1.5 py-0.5 rounded text-xs font-mono text-blue-300">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 mb-3 overflow-x-auto">
            {children}
          </pre>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
          >
            {children}
          </a>
        ),
        hr: () => <hr className="border-[#2a2a2a] my-4" />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

const trackEvent = (eventName: string, eventParams?: Record<string, unknown>) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, eventParams);
  }
};

export default function PromaiChat() {
  const searchParams = useSearchParams();
  const initialTest = searchParams.get("test");
  const initialQuestion = searchParams.get("q");

  const [mode, setMode] = useState<PromaiMode>(initialTest ? "test" : "answer");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(() =>
    (initialTest ?? initialQuestion ?? "").slice(0, MAX_CHARS)
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Auto-grow the composer to fit its content (up to a cap), so long
  // questions are fully visible before sending — like a standard chat box.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const MAX_HEIGHT = 180;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, MAX_HEIGHT);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [input]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleCopy = useCallback(async (id: string, text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement("textarea");
        el.value = text;
        Object.assign(el.style, { position: "fixed", left: "-9999px", top: "-9999px" });
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        el.remove();
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    trackEvent("promai_message", {
      mode,
      message_length: text.length,
      turn: messages.length + 1,
    });

    setError(null);
    setInput("");

    const userMessage: Message = { id: createId(), role: "user", content: text };
    const assistantId = createId();
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/promai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, mode, history }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        let message = "PromAI could not generate a response. Please try again.";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          /* non-JSON error */
        }
        throw new Error(message);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: accumulated } : m
          )
        );
      }

      accumulated += decoder.decode();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: accumulated } : m
        )
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // stopped by the user — keep whatever streamed in.
      } else {
        const msg =
          err instanceof Error
            ? err.message
            : "PromAI could not generate a response. Please try again.";
        setError(msg);
        setMessages((prev) =>
          prev.filter((m) => m.id !== assistantId || m.content.length > 0)
        );
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, messages, mode]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void send();
      }
    },
    [send]
  );

  const clearChat = useCallback(() => {
    if (isStreaming) return;
    setMessages([]);
    setError(null);
    trackEvent("promai_clear", { mode });
  }, [isStreaming, mode]);

  const charsLeft = MAX_CHARS - input.length;
  const isOverLimit = input.length > MAX_CHARS;
  const canSend = input.trim().length > 0 && !isStreaming && !isOverLimit;
  const isTest = mode === "test";

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl flex flex-col h-[calc(100dvh-16rem)] min-h-[560px] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.4)]">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[#1f1f1f] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-blue-400" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white leading-tight">
                PromAI
              </h2>
              <p className="text-[11px] text-[#525252] leading-tight">
                {isTest ? "Run a prompt and see the raw output" : "Ask anything, instantly"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Mode toggle */}
            <div className="flex rounded-xl border border-[#2a2a2a] overflow-hidden bg-[#0a0a0a] p-0.5 gap-0.5">
              {(
                [
                  { id: "answer", label: "Ask", icon: Bot },
                  { id: "test", label: "Test prompt", icon: FlaskConical },
                ] as const
              ).map(({ id, label, icon: Icon }) => {
                const active = mode === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setMode(id);
                      trackEvent("promai_mode_selected", { mode: id });
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                      active
                        ? "bg-blue-500/15 text-blue-300 shadow-[inset_0_1px_0_rgba(59,130,246,0.2)]"
                        : "text-[#525252] hover:text-[#a1a1a1] hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Clear */}
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                disabled={isStreaming}
                title="Clear conversation"
                className="p-2 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] text-[#a1a1a1] hover:text-white hover:border-[#3a3a3a] transition-all disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Messages ── */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5">
          {messages.length === 0 && !error ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-5">
                {isTest ? (
                  <FlaskConical className="w-6 h-6 text-blue-500/40" strokeWidth={1.5} />
                ) : (
                  <MessageSquare className="w-6 h-6 text-blue-500/40" strokeWidth={1.5} />
                )}
              </div>
              <p className="text-sm font-medium text-[#a1a1a1] mb-1.5">
                {isTest ? "Test a prompt without leaving Promhance" : "How can PromAI help?"}
              </p>
              <p className="text-xs text-[#525252] leading-relaxed max-w-sm mb-6">
                {isTest
                  ? "Paste any prompt and PromAI will run it as-is, so you can see the exact output it produces."
                  : "Ask a question, brainstorm an idea, or get help with writing, code, and prompt engineering."}
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {SUGGESTIONS[mode].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-left text-xs px-3 py-2 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] text-[#a1a1a1] hover:text-white hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <span className="mt-0.5 w-7 h-7 shrink-0 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" strokeWidth={2} />
                    </span>
                  )}

                  <div
                    className={`group relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      m.role === "user"
                        ? "bg-blue-500/10 border border-blue-500/25 text-[#f5f5f5]"
                        : "bg-[#0a0a0a] border border-[#2a2a2a] text-[#d4d4d4]"
                    }`}
                  >
                    {m.content ? (
                      <Markdown>{m.content}</Markdown>
                    ) : (
                      <span className="flex items-center gap-2 text-[#525252]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {isTest ? "Running your prompt…" : "PromAI is thinking…"}
                      </span>
                    )}

                    {m.role === "assistant" && m.content && (
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        title="Copy response"
                        className="absolute -bottom-2.5 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-[#111111] border border-[#2a2a2a] text-[10px] text-[#a1a1a1] opacity-0 group-hover:opacity-100 hover:text-white transition-all"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {m.role === "user" && (
                    <span className="mt-0.5 w-7 h-7 shrink-0 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#a1a1a1]" strokeWidth={2} />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="px-5 sm:px-6 pb-2 shrink-0">
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          </div>
        )}

        {/* ── Composer ── */}
        <div className="p-4 sm:p-5 border-t border-[#1f1f1f] shrink-0">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isTest
                  ? "Paste the prompt you want to test…"
                  : "Ask PromAI anything…"
              }
              rows={1}
              maxLength={MAX_CHARS + 100}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#f5f5f5] rounded-xl p-3.5 pr-28 min-h-[48px] focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all placeholder:text-[#3a3a3a] resize-none overflow-hidden text-sm leading-relaxed"
            />
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
              <span
                className={`text-[10px] tabular-nums ${
                  isOverLimit
                    ? "text-red-400"
                    : charsLeft < 200
                      ? "text-amber-400/80"
                      : "text-[#3a3a3a]"
                }`}
              >
                {input.length}/{MAX_CHARS}
              </span>
              {isStreaming ? (
                <button
                  onClick={stop}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#a1a1a1] hover:text-white transition-all text-xs font-semibold"
                >
                  <Square className="w-3 h-3" fill="currentColor" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => void send()}
                  disabled={!canSend}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-500 text-white text-xs font-semibold transition-all hover:bg-blue-400 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed shadow-[0_0_16px_rgba(59,130,246,0.25)]"
                >
                  <Send className="w-3.5 h-3.5" strokeWidth={2} />
                  Send
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-[10px] text-[#3a3a3a]">
            PromAI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
