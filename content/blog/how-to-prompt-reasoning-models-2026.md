---
title: "Stop Telling AI to 'Think Step by Step': How to Prompt Reasoning Models in 2026"
date: "2026-10-13"
updated: "2026-10-13"
description: "Does 'think step by step' still work? Wharton data shows it adds little on reasoning models and costs 20-80% more time. Here's what to write instead."
author: "Promhance Team"
tags: ["Prompt Engineering", "Reasoning Models", "Chain of Thought", "Gemini 3", "o-series", "Claude"]
image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=1600&auto=format&fit=crop"
faqSchema:
  "@context": "https://schema.org"
  "@type": "FAQPage"
  mainEntity:
    - "@type": "Question"
      name: "Does \"think step by step\" still work in 2026?"
      acceptedAnswer:
        "@type": "Answer"
        text: "It depends on the model. On reasoning models it adds little accuracy and slows responses by 20-80%, based on Wharton's testing. On smaller or older standard models it can still raise average accuracy, though it may reduce consistency on easy questions."
    - "@type": "Question"
      name: "Which AI models are reasoning models?"
      acceptedAnswer:
        "@type": "Answer"
        text: "Reasoning models think internally before answering. Examples include OpenAI's o-series, Google's Gemini 3 series, and Claude when extended thinking is turned on. In consumer apps, look for a thinking toggle or a reasoning model in the model picker."
    - "@type": "Question"
      name: "What should I write instead of \"think step by step\"?"
      acceptedAnswer:
        "@type": "Answer"
        text: "Define the result instead of the process. State the outcome, give the material, specify the exact format, list constraints, and add a done-when test. Then set the thinking mode or level in your tool rather than in your wording."
    - "@type": "Question"
      name: "Does chain-of-thought prompting still help smaller models?"
      acceptedAnswer:
        "@type": "Answer"
        text: "Often, yes. In the Wharton study, step-by-step prompting raised average accuracy on every non-reasoning model tested, by roughly 4 to 13 points versus answering directly. The trade-off was lower consistency on some models, so test it on your task."
    - "@type": "Question"
      name: "Can I still ask the model to show its reasoning?"
      acceptedAnswer:
        "@type": "Answer"
        text: "Yes. If you need to audit the logic or teach a method, request the reasoning as a named part of the output. That is a different goal from using the phrase to boost accuracy."
    - "@type": "Question"
      name: "If reasoning models need shorter prompts, is prompt engineering still worth learning?"
      acceptedAnswer:
        "@type": "Answer"
        text: "Yes, but the skill has moved. Less effort goes into clever wording and more into defining outcomes, constraints, and success tests, then testing prompts against your real work."
---

# Stop Telling AI to "Think Step by Step": How to Prompt Reasoning Models in 2026

*Last updated: October 13, 2026 · 8 min read*

> **The short answer:** On reasoning models (models that think internally before they answer), adding "think step by step" gains you almost nothing in accuracy and makes responses 20-80% slower. Replace it with three things: a clearly stated outcome, explicit constraints, and a "done when" test. Keep the phrase for smaller or older models, or when you want to *see* the reasoning.

## Key takeaways

- **"Think step by step" was a real unlock in 2022.** Back then, models didn't reason out loud unless you told them to.
- **Today's reasoning models already do it internally.** Telling them to is mostly redundant, and on some models it slightly hurts.
- **What replaces it is control over effort, not wording.** Pick the reasoning mode or thinking level, then write a short prompt that defines the result.
- **The old trick isn't dead everywhere.** It still helps average accuracy on smaller and older models, with trade-offs on consistency.
- **The only durable skill is testing.** Run your own prompt with and without the scaffolding, on the model you actually use.

## Why did "think step by step" stop working?

"Think step by step" worked because early chat models answered immediately. Asking them to write out intermediate steps pushed them toward better answers on multi-step problems.

Then the models changed. Reasoning models now generate an internal chain of thought *before* writing the visible answer. Many non-reasoning models also produce a short reasoning trace by default. When you add the phrase, you're asking for work the model has already planned to do.

Google's own developer guidance reflects this shift. For its Gemini 3 series, Google describes the models as reasoning models, recommends concise and direct prompts, and warns that they may over-analyze verbose prompt techniques written for older models. Its migration advice says that if you used chain-of-thought-style prompting to force older Gemini models to reason, you should try Gemini 3 with a high thinking level and a simplified prompt.

## What does the research actually show?

The clearest controlled test is *Prompting Science Report 2* from Wharton's Generative AI Labs (Meincke, Mollick, Mollick and Shapiro). The team asked 198 PhD-level GPQA Diamond questions, 25 times each, so 4,950 runs per prompt per model, and compared "answer directly" against "think step by step."

**Reasoning models: marginal at best**

| Model (tested) | Accuracy change with "think step by step" |
|---|---|
| o3-mini | +2.9 points |
| o4-mini | +3.1 points |
| Gemini 2.5 Flash | -3.3 points |

The phrase also made responses take 20-80% longer, roughly 10-20 extra seconds per question. The authors concluded that the benefit for dedicated reasoning models is marginal at best and that the extra time and tokens are hard to justify.

**Non-reasoning models: higher average, lower reliability**

| Model (tested) | Average accuracy | Questions answered correctly on all 25 tries |
|---|---|---|
| Gemini 2.0 Flash | +13.5 points | -13.1 points |
| Claude 3.5 Sonnet | +11.7 points | +10.1 points |
| GPT-4o | +7.2 points | no significant change |
| Gemini 1.5 Pro | +7.1 points | -17.2 points |
| GPT-4o-mini | +4.4 points (not significant) | -9.1 points |

Two details matter for everyday users:

1. **Step-by-step prompting raised averages but could make answers less consistent.** In three of five non-reasoning models, it triggered occasional errors on questions the model would otherwise always get right.
2. **Compared with a plain, unprompted question, the gains mostly disappeared.** Many models already reason by default, so only two of the four non-reasoning models in that comparison showed a significant improvement.

The authors also found that forcing a model to reply with *only* the answer likely harms non-reasoning models, because it blocks the reasoning they would do on their own.

**Limits of this evidence.** The test used one benchmark, a simple version of the technique, and models from 2024 to mid-2025. Newer models may behave differently, which is exactly why the testing method later in this post matters more than any single number.

## What do reasoning models want instead?

Think of a reasoning model as a capable colleague who plans their own approach. Your job is to define the destination, not dictate the route. A strong prompt for a reasoning model has five parts:

1. **Outcome.** One sentence naming the single result you want, and who it's for.
2. **Material.** The data, document, or context the model should work from.
3. **Shape.** The exact format: a 5-row table, three 60-word paragraphs, a JSON object with named keys.
4. **Constraints.** What must be included, what must be avoided, and what to do when information is missing.
5. **Done when.** A test you could apply to the result: "a product manager could rank these without opening the raw data."

That fifth part does the most work. A stated success test turns a vague request into something the model can check its own answer against.

One more tip from Google's guidance: when you paste a long document, put your instructions *after* the data and open with something like "Based on the preceding information." Instructions buried before a wall of text get diluted.

## Before and after: a real rewrite

**Before** (the 2023 habit):

```
You are a world-class product analyst. Take a deep breath and think step
by step. Carefully read the customer reviews below, consider every angle,
and write a really good summary.
```

**After** (the reasoning-model version):

```
Outcome: A one-page summary of what customers complain about, for a
product team choosing next sprint's fixes.
Material: The 200 reviews pasted above.
Shape: The top 5 complaint themes. For each: a one-line description, a
rough count of reviews mentioning it, and one representative quote under
20 words.
Constraints: Use only what is in the reviews. Leave out any theme with
fewer than 5 mentions. No recommendations.
Done when: A product manager could rank the five themes by importance
without opening the raw reviews.
```

The "after" prompt is longer in words but shorter in *instructions about thinking*. It contains zero guidance on how to reason and a lot of guidance on what a good result looks like. That's the whole shift.

## Which models need which approach?

| Situation | Use "think step by step"? | What to do instead |
|---|---|---|
| **Reasoning or thinking mode** (e.g., OpenAI o-series, Gemini 3 series, Claude's extended thinking) | Skip it | Select the reasoning mode or thinking level. Write outcome, constraints, and a done-when test. |
| **Smaller, faster, or older standard models** | Often helps on hard multi-step problems | Use it selectively. Test for consistency, and avoid "answer only" on hard questions. |
| **You need to see or audit the reasoning** | Yes, as a deliverable | Ask for "your reasoning" as a named section of the output rather than as a thinking instruction. |
| **Simple lookups, rewrites, formatting** | Not needed | Keep the prompt short and specific. |

In consumer apps, the equivalent of the old phrase is now a mode picker: a "thinking" or "extended thinking" toggle, or a choice between fast and careful models. Choosing the mode is the modern version of typing the phrase, without the extra tokens.

## When is "think step by step" still worth using?

The research supports keeping it in three cases:

- **Smaller or older models.** The Wharton data shows average gains of several points up to about 13 on non-reasoning models, especially ones that don't reason by default.
- **Auditable work.** When a human needs to check the logic, asking for the steps is legitimate. You're prompting for an artifact, not for accuracy.
- **Hard problems on a model with no thinking mode.** Just don't pair it with "answer only," and test for consistency.

## How can you test this on your own prompts in 20 minutes?

Provider guidance and academic benchmarks can't tell you what works for *your* task. A small experiment can.

1. **Pick one prompt you reuse every week.**
2. **Make a stripped copy.** Remove the persona line, the "think step by step" line, and any instruction about how to reason. Add the five-part structure from above.
3. **Run each version three times** in the reasoning mode you normally use.
4. **Score against your own done-when test,** on two axes: is the *best* output better, and is the *worst* output better?

The second axis matters most. A prompt that survives a Friday deadline is one whose worst run is still usable. If the stripped version ties on the best run and wins on the worst, you've found a better prompt and a faster one.

## How does Promhance fit in?

[Promhance](https://www.promhance.com) is a free AI prompt enhancer built on the S.P.A.R.K. Method. The principle in this post is the filter any good prompt enhancer should apply in 2026: turn a vague request into a clear outcome, shape, and set of constraints, and leave the thinking to the model.

Try it yourself: paste the "before" prompt from this article into Promhance, then compare the result with the "after" version above.

**Related reading**

- [Why Your Old Prompts Stopped Working](/blog/why-your-old-prompts-stopped-working)
- [Advanced Prompt Engineering Techniques](/blog/advanced-prompt-engineering-techniques)
- [Prompt Frameworks Compared (2026)](/blog/prompt-frameworks-compared-2026)
- [ChatGPT vs Gemini vs Claude](/blog/chatgpt-vs-gemini-vs-claude)
- [What Is a Prompt Enhancer?](/blog/what-is-a-prompt-enhancer)
- [Context Engineering vs Prompt Engineering](/blog/context-engineering-vs-prompt-engineering)
- [Is Prompt Engineering Dead in 2026?](/blog/is-prompt-engineering-dead-2026)
- [How to Write Better AI Prompts](/blog/how-to-write-better-ai-prompts)

## Frequently asked questions

### Does "think step by step" still work in 2026?

It depends on the model. On reasoning models it adds little accuracy and slows responses by 20-80%, based on Wharton's testing. On smaller or older standard models it can still raise average accuracy, though it may reduce consistency on easy questions.

### Which AI models are reasoning models?

Reasoning models think internally before answering. Examples include OpenAI's o-series, Google's Gemini 3 series, and Claude when extended thinking is turned on. In consumer apps, look for a "thinking" toggle or a reasoning model in the model picker.

### What should I write instead of "think step by step"?

Define the result instead of the process. State the outcome, give the material, specify the exact format, list constraints, and add a "done when" test. Then set the thinking mode or level in your tool rather than in your wording.

### Does chain-of-thought prompting still help smaller models?

Often, yes. In the Wharton study, step-by-step prompting raised average accuracy on every non-reasoning model tested, by roughly 4 to 13 points versus answering directly. The trade-off was lower consistency on some models, so test it on your task.

### Can I still ask the model to show its reasoning?

Yes. If you need to audit the logic or teach a method, request the reasoning as a named part of the output. That's a different goal from using the phrase to boost accuracy.

### If reasoning models need shorter prompts, is prompt engineering still worth learning?

Yes, but the skill has moved. Less effort goes into clever wording and more into defining outcomes, constraints, and success tests, then testing prompts against your real work. See [Is Prompt Engineering Dead in 2026?](/blog/is-prompt-engineering-dead-2026).

## Sources

- Meincke, L., Mollick, E., Mollick, L., & Shapiro, D. (2025). *Prompting Science Report 2: The Decreasing Value of Chain of Thought in Prompting.* Wharton Generative AI Labs. [arxiv.org/abs/2506.07142](https://arxiv.org/abs/2506.07142)
- Google. *Gemini 3 developer guide* (migration and prompting best practices). [ai.google.dev/gemini-api/docs/gemini-3](https://ai.google.dev/gemini-api/docs/gemini-3)
