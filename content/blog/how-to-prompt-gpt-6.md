---
title: "How to Prompt GPT-6: OpenAI's Tips + Slop-Word Blocklist"
seoTitle: "How to Prompt GPT-6: OpenAI Tips + Slop Blocklist"
date: "2026-11-03"
updated: "2026-11-03"
description: "How to prompt GPT-6 Astra: OpenAI's official tips on initiative, plain prose and skill files, plus its slop-word blocklist and 5 copy-paste prompts."
author: "Promhance Team"
tags: ["GPT-6", "ChatGPT", "Prompt Engineering", "OpenAI", "AI Writing", "AI Slop"]
image: "https://images.unsplash.com/photo-1684369175833-4b445ad6bfb5?q=80&w=1600&auto=format&fit=crop"
faqSchema:
  "@context": "https://schema.org"
  "@type": "FAQPage"
  mainEntity:
    - "@type": "Question"
      name: "How do you prompt GPT-6 Astra?"
      acceptedAnswer:
        "@type": "Answer"
        text: "Tell GPT-6 Astra what finished result you want, give it permission to act on reasonable assumptions, and say what format the answer should take. OpenAI's own guidance adds three fixes: ask for plain prose when you do not want lists and tables, list the AI-sounding phrases it should avoid, and state that your instructions override any skill or context files it can read."
    - "@type": "Question"
      name: "Why does GPT-6 keep asking clarifying questions?"
      acceptedAnswer:
        "@type": "Answer"
        text: "OpenAI says GPT-6 Astra is more likely to ask for clarification than earlier models, and that it sometimes stops where users expect it to continue. The fix is to tell it to infer your intent, treat requests like 'can you...' as instructions to act, and finish a reviewable draft before asking for approval."
    - "@type": "Question"
      name: "What is the GPT-6 slop-word blocklist?"
      acceptedAnswer:
        "@type": "Answer"
        text: "It is an example prompt in OpenAI's GPT-6 Astra guide that lists filler words and stock patterns for the model to avoid. Examples include 'delve into', 'it's worth noting', 'foster', 'Bottom line:', summary closers like 'In short:', and the 'This isn't about X. It's about Y' construction. OpenAI's page is the authoritative version; third-party copies of the list differ slightly."
    - "@type": "Question"
      name: "How do I stop GPT-6 from using so many bullet points and tables?"
      acceptedAnswer:
        "@type": "Answer"
        text: "Ask for prose explicitly. OpenAI notes that GPT-6 Astra tends toward detailed, formatted responses, so a line such as 'Write in short paragraphs. Use a list only for steps in order or truly parallel items' changes the output more than hoping it guesses your preference."
    - "@type": "Question"
      name: "Does GPT-6 need 'think step by step' or a persona?"
      acceptedAnswer:
        "@type": "Answer"
        text: "No. OpenAI's GPT-6 Astra guidance does not recommend either. GPT-6 models reason internally, and you control how hard they think with the reasoning effort setting (or the thinking option in ChatGPT), not with wording. Spend the words on the outcome, constraints and format instead."
    - "@type": "Question"
      name: "Do old GPT-4 and GPT-5 prompts still work on GPT-6?"
      acceptedAnswer:
        "@type": "Answer"
        text: "Mostly, but they often produce longer, more formatted answers than you want, and long rule lists can make the model pause or over-check. Trim repeated rules, state the outcome first, and add explicit style and initiative instructions. OpenAI's earlier GPT-5.6 guidance reported that leaner system prompts scored better and used fewer tokens in its internal coding evals."
    - "@type": "Question"
      name: "Which GPT-6 model should I use?"
      acceptedAnswer:
        "@type": "Answer"
        text: "OpenAI's developer guide lists GPT-6 Astra as its most capable model, alongside GPT-6.1 Sol, GPT-6.1 Terra and GPT-6 Luna. Use Astra for hard, multi-step work and a lighter model for high-volume everyday tasks. The prompting advice in this guide applies to all of them, with Astra the most sensitive to it."
---

**Short answer:** To prompt **GPT-6** well, describe the finished result, let the model act on sensible assumptions, and be explicit about style. OpenAI's own guide for **GPT-6 Astra** says the model asks clarifying questions more often, leans toward heavily formatted answers, and reacts strongly to skill and context files. So the best GPT-6 prompts do three things older prompts didn't: **grant initiative, request plain prose, and ban AI-sounding filler** with a short blocklist.

> **In this guide:** what changed in GPT-6, OpenAI's official prompting tips summarized, the slop-word blocklist, a before/after rewrite, five copy-paste GPT-6 prompts, and a checklist for migrating old prompts.

*Last updated: November 3, 2026 · 9 min read*

---

## Key takeaways

- **GPT-6 Astra launched in September 2026** and OpenAI published a dedicated prompting guide for it on its developer site.
- **It asks before it acts.** OpenAI recommends telling it to infer intent and show a "bias towards action."
- **It over-formats.** Lists, tables and Markdown are its default. Ask for prose if you want prose.
- **It reuses stock phrases.** OpenAI ships an example prompt that blocks filler such as "delve into" and "it's worth noting."
- **It obeys context files closely.** Audit your `AGENTS.md`, custom instructions and skills, and say which instructions win.
- **Effort is a setting, not a phrase.** Choose a reasoning level instead of writing "think step by step."

---

## What changed in GPT-6?

GPT-6 is OpenAI's model generation after GPT-5.6. According to Wikipedia's GPT-6 article, **GPT-6 Astra** was unveiled as a limited preview on **September 3, 2026** and released to paid users the next day, with a lighter **GPT-6 Instant** reaching ChatGPT's paid users on October 7 and free users on October 8. OpenAI's developer guide currently lists the family as **GPT-6 Astra, GPT-6.1 Sol, GPT-6.1 Terra and GPT-6 Luna**, and model trackers dated GPT-6.1 Terra's release to October 26, 2026.

OpenAI describes Astra as its most capable model so far and reports that it used substantially fewer output tokens than earlier models in several evaluations. For people who write prompts, though, the important part is the behavior notes in the guide. As The Decoder summarized on September 5, 2026, OpenAI calls Astra a "more effective collaborator," and that cuts both ways: it checks in more, formats more, and follows whatever instructions it finds very literally.

| Behavior | GPT-5.x habit | GPT-6 Astra tendency (per OpenAI) | What to add to your prompt |
|---|---|---|---|
| **Initiative** | Usually just did the task | More likely to stop and ask for clarification | "Infer my intent and act; ask only if blocked." |
| **Formatting** | GPT-5.6 was described as more concise by default | Detailed, formatted responses with lists and tables | "Write in short paragraphs; lists only for steps." |
| **Phrasing** | Some stock phrases | May reuse recurring phrases | A short blocklist of filler words and patterns |
| **Context files** | Followed loosely | More sensitive to skills and files like `AGENTS.md` | "My instructions override any skill or file." |
| **Testing (coding)** | Ran tests when asked | Tends to over-test | "Skip tests for small, reversible changes." |

---

## OpenAI's official GPT-6 prompting tips, summarized

OpenAI's "Using GPT-6" developer page groups its advice into a few themes. Here they are in plain terms, with what each means for a ChatGPT user and for a developer using the API.

### 1. Grant initiative explicitly

Astra is more cautious than earlier models about acting without confirmation. OpenAI's suggested fix is to tell it to infer what you mean, keep going on reversible work, and treat phrasing like "can you...", "I want to..." or "help me..." as a request to **do** the thing, not to describe how it would be done. It also recommends that the model finish a concrete, reviewable result before asking for approval.

**In practice:** if you ask "Can you tighten this intro?" you want a tighter intro back, not a list of suggestions. Say so once, in your custom instructions or system prompt, and the question-asking drops.

### 2. Drop unprompted disclaimers

OpenAI's guidance says the model should not add unsolicited warnings, disclaimers, approval steps or compliance checklists based on hypothetical risk. If your old prompts asked for "a note on limitations" by default, remove that line unless you actually want it.

### 3. Ask for prose when you want prose

Per OpenAI, Astra leans toward long, heavily formatted answers. The guide includes a writing-style prompt that asks for concise paragraphs, active voice, and lists only for genuinely parallel or sequential content. This is the single change most ChatGPT users will notice: one sentence about format turns a slide-deck answer into readable text.

### 4. Tell it which instructions win

Astra is more sensitive to context it finds in skills and files such as `AGENTS.md`. OpenAI strongly recommends auditing every skill and file the model can access, and suggests stating that the user's instructions take priority over skill guidance. If an old skill says "always confirm before editing," GPT-6 will take that seriously and pause. If you use Agent Skills, see our [SKILL.md guide](/blog/agent-skills-skill-md-guide) for how to keep descriptions tight.

### 5. Control effort with settings, not words

GPT-6 models reason internally. In the API you set a reasoning effort level; OpenAI notes that Astra and GPT-6.1 Sol do not support the `none` level (use `low` instead), and that `temperature` and `top_p` should be removed when reasoning is on. In ChatGPT, the equivalent is choosing a thinking option in the model picker. This is the same shift we covered in [How to Prompt Reasoning Models](/blog/how-to-prompt-reasoning-models-2026): the phrase "think step by step" is not needed.

### 6. Coding agents: fewer tests, more delegation

For agentic coding, OpenAI notes that Astra tends to over-test and may delegate to subagents less than you want. Its guide suggests skipping tests for reversible, low-impact changes and explicitly allowing parallel delegation when it saves time. If you write prompts for Codex, Cursor or Claude Code-style agents, pair this with our [vibe coding prompt templates](/blog/vibe-coding-prompts-2026).

---

## The GPT-6 slop-word blocklist

**"AI slop"** is the popular term for generic, filler-heavy AI output. OpenAI's GPT-6 Astra guide includes an example prompt that names words and patterns for the model to avoid. Among the items on OpenAI's page:

| Type | Examples from OpenAI's list |
|---|---|
| **Filler words and phrases** | "delve into," "it's worth noting," "foster," "importantly," "genuinely" |
| **Labels and closers** | "Bottom line:", summary closers such as "In short:" |
| **Stock constructions** | "This isn't about X. It's about Y," contrastive "X, not Y," rhetorical "Question? Answer." patterns |
| **Word-building habits** | Hyphenated compound adjectives and made-up compound nouns |
| **General** | Vague qualifiers and stock transitions |

A note on sources: secondary write-ups, including The Decoder's, quote a slightly different version of the list (for example adding "leverage" and "really/truly"). **Treat OpenAI's page as the authoritative version**, and treat any list as a starting point to tune for your own voice.

Two honest limits. First, banning words fixes the surface; as several editors have pointed out, the structure of a piece can still read as machine-made. Second, a blocklist works best combined with a positive instruction (what good writing looks like) and, ideally, a sample of your own writing.

---

## Before and after: rewriting a prompt for GPT-6

**Before** (a typical 2024 prompt):

```
You are a world-class marketing expert. Think step by step and write a
comprehensive, engaging blog intro about our new budgeting app. Make it
SEO-friendly. Include a disclaimer that results may vary.
```

On GPT-6, this tends to return a heavily formatted answer with headings, bullet points, a disclaimer, and several of the phrases on OpenAI's blocklist.

**After** (outcome-first, GPT-6 style):

```
Write the opening 120 words of a blog post announcing Pocketwise, a
budgeting app for freelancers with irregular income.

Reader: a freelancer who has tried two budgeting apps and quit both.
Goal: they keep reading because the intro names their exact problem.
Must include: the phrase "budgeting app for freelancers" once, in the
first two sentences.

Style: two short paragraphs, no headings, no lists, active voice. Avoid
"delve," "it's worth noting," "game-changer," "In short," and the
"This isn't about X, it's about Y" construction. No disclaimers.

If a detail is missing, make a reasonable assumption and continue.
Done when: it reads like a person wrote it and could run unedited.
```

The "after" prompt has no persona and no thinking instruction. It spends every line on the result: reader, goal, format, banned patterns, and a done-when test. You can generate this structure automatically by pasting the "before" version into the [Promhance prompt enhancer](https://www.promhance.com/chatgpt-prompt-enhancer).

---

## 5 copy-paste GPT-6 prompts

Each of these is written in our own words, based on the principles in OpenAI's guide. Paste the first one into ChatGPT's custom instructions; use the rest per task.

### 1. Custom instructions for GPT-6 (set once)

```
When I ask "can you...", "help me..." or "I want to...", do the task
instead of describing how you would do it. Make reasonable assumptions
and state them in one line at the end. Ask a question only if you
cannot continue without the answer.

Write in short paragraphs. Use lists only for sequential steps or truly
parallel items, and tables only when comparing three or more things.
No unprompted disclaimers or safety notes.

Avoid filler: "delve," "it's worth noting," "importantly," "genuinely,"
"foster," "Bottom line," "In short," and "This isn't X, it's Y."
```

### 2. The anti-slop rewrite

```
Rewrite the text below so it sounds like a specific person wrote it.
Keep every fact and the original meaning. Cut filler words, stock
transitions and summary closers. Vary sentence length. Replace vague
claims with the concrete detail already in the text; if there is none,
cut the claim. Return only the rewritten text.

Text:
"""
[paste]
"""
```

### 3. Act-first editing

```
Edit the draft below for clarity and length (target: 30% shorter).
Make the edits directly; don't list suggestions. After the edited
draft, add at most three lines noting any change that alters meaning.

Draft:
"""
[paste]
"""
```

### 4. Context-file audit (for agents)

```
Before starting, list every skill, AGENTS.md or rules file you have
loaded. For each, quote any instruction that would make you pause,
ask for approval, or run extra checks. Then tell me which of those
conflict with this rule: my messages override any file or skill.
Don't change anything yet.
```

### 5. Plain-language technical explainer

```
Explain [topic] to a smart reader with no background in it, in under
200 words. Use everyday words; define any term you can't avoid in the
same sentence. One concrete example. No headings or bullet points.
Done when: the reader could explain it to a colleague afterward.
```

---

## Migrating old prompts to GPT-6: a 6-step checklist

1. **Lead with the outcome.** Move "what I want delivered" to the first line.
2. **Delete persona and thinking lines.** "You are a world-class..." and "think step by step" add length, not quality, on reasoning models. Our [prompt myths research roundup](/blog/prompt-engineering-myths-tested-2026) covers the evidence.
3. **Add one initiative line.** "Make reasonable assumptions and continue."
4. **Add one format line.** Prose or list, length, headings or none.
5. **Add a short blocklist.** Five to ten phrases you never want, not fifty.
6. **Audit context files.** Remove stale "always ask" or "always double-check" rules from custom instructions, `AGENTS.md` and skills, and state that your messages win.

Then test: run the old and new versions three times each and compare the **worst** output, not the best. OpenAI's earlier GPT-5.6 guidance reported that leaner system prompts improved internal coding-eval scores by roughly 10-15% while cutting tokens by 41-66%, and it called those ranges directional. Your own results on your own tasks are the number that matters. For the bigger picture, read [Why Your Old Prompts Stopped Working](/blog/why-your-old-prompts-stopped-working).

---

## How Promhance helps with GPT-6 prompts

[Promhance](https://www.promhance.com) is a free prompt enhancer built on the S.P.A.R.K. Method. It turns a rough request into the outcome-first structure GPT-6 responds to best: a clear goal, context, constraints, output format and success criteria.

1. Paste your rough prompt into the [ChatGPT Prompt Enhancer](/chatgpt-prompt-enhancer).
2. Add your style rules and blocklist as constraints, or use a quick action to refine the result.
3. Click **Try it** to run the enhanced prompt in [PromAI](/promai) and check the output before you take it to ChatGPT.

Comparing models? See [ChatGPT vs Gemini vs Claude](/blog/chatgpt-vs-gemini-vs-claude) for how each one reads prompts differently.

**[Enhance your next GPT-6 prompt free →](https://www.promhance.com)**

---

## Frequently asked questions

### How do you prompt GPT-6 Astra?
Tell GPT-6 Astra what finished result you want, give it permission to act on reasonable assumptions, and say what format the answer should take. OpenAI's own guidance adds three fixes: ask for plain prose when you don't want lists and tables, list the AI-sounding phrases it should avoid, and state that your instructions override any skill or context files it can read.

### Why does GPT-6 keep asking clarifying questions?
OpenAI says GPT-6 Astra is more likely to ask for clarification than earlier models, and that it sometimes stops where users expect it to continue. Tell it to infer your intent, treat "can you..." as an instruction to act, and finish a reviewable draft before asking for approval.

### What is the GPT-6 slop-word blocklist?
An example prompt in OpenAI's GPT-6 Astra guide that lists filler words and stock patterns to avoid, such as "delve into," "it's worth noting," "foster," "Bottom line:", "In short:" and "This isn't about X. It's about Y." OpenAI's page is the authoritative version; third-party copies differ slightly.

### How do I stop GPT-6 from using so many bullet points and tables?
Ask for prose explicitly. OpenAI notes that Astra tends toward detailed, formatted responses, so a line like "Write in short paragraphs. Use a list only for steps in order or truly parallel items" changes the output more than hoping it guesses.

### Does GPT-6 need "think step by step" or a persona?
No. OpenAI's GPT-6 Astra guidance doesn't recommend either. GPT-6 models reason internally, and you control how hard they think with the reasoning effort setting (or the thinking option in ChatGPT), not with wording.

### Do old GPT-4 and GPT-5 prompts still work on GPT-6?
Mostly, but they often produce longer, more formatted answers than you want, and long rule lists can make the model pause or over-check. Trim repeated rules, state the outcome first, and add explicit style and initiative instructions.

### Which GPT-6 model should I use?
OpenAI's developer guide lists GPT-6 Astra as its most capable model, alongside GPT-6.1 Sol, GPT-6.1 Terra and GPT-6 Luna. Use Astra for hard, multi-step work and a lighter model for high-volume everyday tasks. The prompting advice here applies to all of them.

---

## Sources and further reading

- OpenAI, *Using GPT-6* (latest-model guide, GPT-6 Astra prompting section). [developers.openai.com/api/docs/guides/latest-model](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra)
- OpenAI, *Prompting guidance for GPT-5.6 Sol*. [developers.openai.com/api/docs/guides/prompt-guidance-gpt-5p6](https://developers.openai.com/api/docs/guides/prompt-guidance-gpt-5p6)
- Matthias Bastian, *OpenAI shares prompting tips for GPT-6 Astra including a blocklist of slop words*, The Decoder (September 5, 2026). [the-decoder.com](https://the-decoder.com/openai-shares-prompting-tips-for-gpt-6-astra-including-a-blocklist-of-slop-words/)
- *GPT-6*, Wikipedia (release timeline). [en.wikipedia.org/wiki/GPT-6](https://en.wikipedia.org/wiki/GPT-6)
- Zapier, *How to remove AI slop from your writing*. [zapier.com/blog/remove-ai-slop-from-writing](https://zapier.com/blog/remove-ai-slop-from-writing/)

*Last updated: November 3, 2026. Model names, release dates and supported settings change quickly; check OpenAI's documentation for the current lineup.*
