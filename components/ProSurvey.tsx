"use client";

import { useCallback, useRef, useState } from "react";
import { Check, Loader2, Zap } from "lucide-react";
import { getAnonId } from "@/lib/anon-id";

const FREQUENCIES = [
  { id: "first_time", label: "This is my first time" },
  { id: "monthly", label: "A few times a month" },
  { id: "weekly", label: "A few times a week" },
  { id: "daily", label: "Almost every day" },
] as const;

const FEATURES = [
  { id: "advanced_enhancement", label: "Advanced prompt enhancement" },
  { id: "custom_instructions", label: "Custom instructions" },
  { id: "templates", label: "Prompt templates/library" },
  { id: "history_organization", label: "Better prompt history & organization" },
  { id: "multiple_models", label: "Multiple AI models" },
  { id: "bulk_enhancement", label: "Bulk prompt enhancement" },
  { id: "api", label: "API" },
  { id: "other", label: "Other" },
] as const;

const LIKELIHOODS = [
  { id: "definitely", label: "Definitely would" },
  { id: "probably", label: "Probably would" },
  { id: "not_sure", label: "Not sure" },
  { id: "probably_not", label: "Probably wouldn't" },
  { id: "definitely_not", label: "Definitely wouldn't" },
] as const;

type FrequencyId = (typeof FREQUENCIES)[number]["id"];
type FeatureId = (typeof FEATURES)[number]["id"];
type LikelihoodId = (typeof LIKELIHOODS)[number]["id"];
type Status = "idle" | "submitting" | "done" | "error";

function OptionButton({
  selected,
  label,
  onClick,
  type,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
  type: "radio" | "checkbox";
}) {
  return (
    <button
      type="button"
      role={type}
      aria-checked={selected}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200 ${
        selected
          ? "border-blue-500/50 bg-blue-500/10 text-white"
          : "border-[#2a2a2a] bg-[#111111] text-[#a1a1a1] hover:border-[#3a3a3a] hover:text-white"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center border transition-colors ${
          type === "radio" ? "rounded-full" : "rounded"
        } ${
          selected
            ? "border-blue-400 bg-blue-500 text-white"
            : "border-[#3a3a3a] bg-transparent"
        }`}
      >
        {selected &&
          (type === "radio" ? (
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          ) : (
            <Check className="h-3 w-3" strokeWidth={3} />
          ))}
      </span>
      <span>{label}</span>
    </button>
  );
}

function QuestionShell({
  number,
  title,
  hint,
  children,
}: {
  number: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const headingId = `survey-q${number}`;
  return (
    <section className="border-t border-[#2a2a2a] pt-8" aria-labelledby={headingId}>
      <div className="mb-4">
        <h2 id={headingId} className="text-base sm:text-lg font-semibold text-white">
          <span className="mr-2 text-[#525252]">Q{number}.</span>
          {title}
        </h2>
        {hint && <p className="mt-1 text-sm text-[#525252]">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export default function ProSurvey() {
  const [usageFrequency, setUsageFrequency] = useState<FrequencyId | null>(null);
  const [features, setFeatures] = useState<FeatureId[]>([]);
  const [featuresOther, setFeaturesOther] = useState("");
  const [regularUseReason, setRegularUseReason] = useState("");
  const [priceLikelihood, setPriceLikelihood] = useState<LikelihoodId | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const toggleFeature = useCallback((id: FeatureId) => {
    setFeatures((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);

      if (!usageFrequency) {
        setError("Please answer question 1.");
        return;
      }
      if (features.length === 0) {
        setError("Please choose at least one option for question 2.");
        return;
      }
      if (!priceLikelihood) {
        setError("Please answer question 4.");
        return;
      }

      setStatus("submitting");

      try {
        const res = await fetch("/api/survey", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            anonId: getAnonId(),
            usageFrequency,
            desiredFeatures: features,
            desiredFeaturesOther: featuresOther,
            regularUseReason,
            priceLikelihood,
            additionalNotes,
            website: honeypotRef.current?.value ?? "",
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.error ?? "Something went wrong. Please try again.");
          setStatus("error");
          return;
        }

        setStatus("done");
      } catch {
        setError("Something went wrong. Please try again.");
        setStatus("error");
      }
    },
    [usageFrequency, features, featuresOther, regularUseReason, priceLikelihood, additionalNotes]
  );

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-8 sm:p-12 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/30">
          <Check className="h-7 w-7 text-blue-400" strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Thanks — response recorded.</h2>
        <p className="mx-auto mb-8 max-w-md text-[#a1a1a1]">
          Your answers directly shape what we build next. We read every response.
        </p>
        <a
          href="https://www.promhance.com"
          className="btn-cta inline-flex items-center gap-2 bg-white text-[#0a0a0a] font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#f5f5f5] transition-colors shadow-lg no-underline"
          style={{ textDecoration: "none" }}
        >
          <Zap className="w-4 h-4" />
          Back to Promhance
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-6 sm:p-10 shadow-xl"
    >
      {/* Honeypot */}
      <input
        ref={honeypotRef}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="space-y-8">
        <QuestionShell number={1} title="How often do you use Promhance?">
          <div className="grid gap-2 sm:grid-cols-2">
            {FREQUENCIES.map((option) => (
              <OptionButton
                key={option.id}
                type="radio"
                label={option.label}
                selected={usageFrequency === option.id}
                onClick={() => setUsageFrequency(option.id)}
              />
            ))}
          </div>
        </QuestionShell>

        <QuestionShell
          number={2}
          title="What would you most like us to add?"
          hint="Select all that apply."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {FEATURES.map((option) => (
              <OptionButton
                key={option.id}
                type="checkbox"
                label={option.label}
                selected={features.includes(option.id)}
                onClick={() => toggleFeature(option.id)}
              />
            ))}
          </div>
          {features.includes("other") && (
            <input
              type="text"
              value={featuresOther}
              onChange={(e) => setFeaturesOther(e.target.value)}
              maxLength={200}
              placeholder="Tell us what else you'd like"
              className="mt-3 w-full rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-sm text-[#f5f5f5] placeholder:text-[#3a3a3a] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all"
            />
          )}
        </QuestionShell>

        <QuestionShell
          number={3}
          title="What would make you most likely to use Promhance regularly?"
          hint="Optional."
        >
          <textarea
            value={regularUseReason}
            onChange={(e) => setRegularUseReason(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Tell us what would make Promhance a regular part of your workflow."
            className="w-full resize-y rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-sm text-[#f5f5f5] placeholder:text-[#3a3a3a] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all"
          />
        </QuestionShell>

        <QuestionShell
          number={4}
          title="If Promhance Pro was $1.99/month, how likely would you be to subscribe?"
        >
          <div className="grid gap-2">
            {LIKELIHOODS.map((option) => (
              <OptionButton
                key={option.id}
                type="radio"
                label={option.label}
                selected={priceLikelihood === option.id}
                onClick={() => setPriceLikelihood(option.id)}
              />
            ))}
          </div>
        </QuestionShell>

        <QuestionShell
          number={5}
          title="Anything else you'd like us to know?"
          hint="Optional."
        >
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Feature ideas, bugs, or anything on your mind."
            className="w-full resize-y rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-sm text-[#f5f5f5] placeholder:text-[#3a3a3a] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all"
          />
        </QuestionShell>
      </div>

      {error && (
        <p className="mt-6 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-4 border-t border-[#2a2a2a] pt-8 sm:flex-row sm:justify-between">
        <p className="text-xs text-[#525252]">
          Takes about 60 seconds. We never share your answers.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn-cta inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-3 text-sm font-bold text-[#0a0a0a] shadow-lg transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            "Submit survey"
          )}
        </button>
      </div>
    </form>
  );
}
