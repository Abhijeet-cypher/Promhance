"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Send, Check } from "lucide-react";
import { getAnonId } from "@/lib/anon-id";

const REACTIONS = [
  { id: "great", emoji: "👍", label: "Great" },
  { id: "meh",   emoji: "😐", label: "Meh" },
  { id: "bad",   emoji: "👎", label: "Not quite" },
] as const;

type ReactionId = (typeof REACTIONS)[number]["id"];
type Status = "idle" | "submitting" | "reacted" | "error";

type Props = {
  promptId: string | null;
  onDismiss: () => void;
};

export default function FeedbackReaction({ promptId, onDismiss }: Props) {
  const [reaction, setReaction] = useState<ReactionId | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [commentStatus, setCommentStatus] = useState<"idle" | "sending" | "done">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "reacted") inputRef.current?.focus();
  }, [status]);

  const react = useCallback(async (id: ReactionId) => {
    if (status === "submitting" || status === "reacted") return;

    setReaction(id);
    setStatus("submitting");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reaction: id,
          promptId,
          anonId: getAnonId(),
          pagePath: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      const data = await res.json().catch(() => null);
      setFeedbackId(data?.id ?? null);
      setStatus("reacted");
      try {
        sessionStorage.setItem("promhance_feedback_given", "1");
      } catch {
        /* sessionStorage unavailable — ignore */
      }
    } catch {
      setStatus("error");
    }
  }, [status, promptId]);

  const sendComment = useCallback(async () => {
    const text = comment.trim();
    if (!text || !feedbackId || commentStatus === "sending") return;

    setCommentStatus("sending");
    try {
      await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: feedbackId, comment: text }),
      });
    } catch {
      /* best effort — the reaction is already saved */
    }
    setCommentStatus("done");
    setTimeout(onDismiss, 1600);
  }, [comment, feedbackId, commentStatus, onDismiss]);

  const showCommentStep = status === "reacted";

  return (
    <div className="border-b border-[#1f1f1f] bg-blue-500/[0.04] px-5 sm:px-6 py-3 animate-fade-in-up">
      {showCommentStep ? (
        commentStatus === "done" ? (
          <div className="flex items-center gap-2 text-xs text-blue-300">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>Got it — thanks for helping improve Promhance.</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <span className="text-xs text-[#a1a1a1] shrink-0">Thanks! Want to tell us more?</span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendComment();
                }}
                maxLength={1000}
                placeholder="Anything that stood out? (optional)"
                className="flex-1 min-w-0 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all placeholder:text-[#3a3a3a]"
              />
              <button
                onClick={sendComment}
                disabled={!comment.trim() || commentStatus === "sending"}
                aria-label="Send comment"
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-blue-500 text-white transition-colors hover:bg-blue-400 disabled:opacity-35 disabled:cursor-not-allowed"
              >
                {commentStatus === "sending" ? (
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={onDismiss}
                className="text-[11px] text-[#525252] hover:text-[#a1a1a1] transition-colors shrink-0"
              >
                Skip
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs text-[#a1a1a1]">How was this enhancement?</span>
          <div className="flex items-center gap-1.5">
            {REACTIONS.map(({ id, emoji, label }) => {
              const active = reaction === id;
              return (
                <button
                  key={id}
                  onClick={() => react(id)}
                  disabled={status === "submitting"}
                  title={label}
                  aria-label={label}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all duration-200 disabled:opacity-50 ${
                    active
                      ? "bg-blue-500/15 border-blue-500/40 text-blue-200"
                      : "bg-[#0a0a0a] border-[#2a2a2a] text-[#a1a1a1] hover:border-[#3a3a3a] hover:text-white"
                  }`}
                >
                  <span className="text-sm leading-none">{emoji}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>

          {status === "error" && (
            <span className="text-[11px] text-red-400">Couldn&apos;t save — tap again</span>
          )}

          <button
            onClick={onDismiss}
            aria-label="Dismiss feedback"
            className="ml-auto w-6 h-6 flex items-center justify-center rounded-md text-[#525252] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
