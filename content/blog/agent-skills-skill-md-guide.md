---
title: "Agent Skills (SKILL.md) Explained: The Next Step After Prompt Engineering in 2026"
date: "2026-10-20"
updated: "2026-10-20"
description: "Agent Skills turn your best prompts into reusable SKILL.md folders that AI agents load on demand. Learn what they are, how they differ from prompts and MCP, and how to write your first one."
author: "Promhance Team"
tags: ["Agent Skills", "SKILL.md", "Prompt Engineering", "AI Agents", "Claude", "Context Engineering"]
image: "https://images.unsplash.com/photo-1737644467636-6b0053476bb2?q=80&w=1600&h=840&auto=format&fit=crop&crop=entropy"
faqSchema:
  "@context": "https://schema.org"
  "@type": "FAQPage"
  mainEntity:
    - "@type": "Question"
      name: "What are Agent Skills?"
      acceptedAnswer:
        "@type": "Answer"
        text: "Agent Skills are folders of reusable instructions that an AI agent loads only when a task needs them. Each skill has a required SKILL.md file with a short name and description in YAML frontmatter, followed by Markdown instructions, and can bundle scripts and reference files. Anthropic introduced the format and published it as an open standard in December 2025."
    - "@type": "Question"
      name: "What is a SKILL.md file?"
      acceptedAnswer:
        "@type": "Answer"
        text: "SKILL.md is the entry file of an Agent Skill. It starts with YAML frontmatter containing a name and a description, then Markdown instructions the agent follows once it decides the skill is relevant. The description is what the agent reads to decide whether to load the skill, so it must say what the skill does and when to use it."
    - "@type": "Question"
      name: "What is the difference between an Agent Skill and a prompt?"
      acceptedAnswer:
        "@type": "Answer"
        text: "A prompt is text you send once in a conversation. A skill is a saved, named prompt package that the agent discovers and loads automatically when the task matches its description, and that can include scripts and reference files. In practice a skill is closest to a prompt that is loaded on demand."
    - "@type": "Question"
      name: "What is the difference between Agent Skills and MCP?"
      acceptedAnswer:
        "@type": "Answer"
        text: "Skills teach an agent how to do something: a procedure, standards, and judgment. MCP (Model Context Protocol) gives an agent access to external tools and data through a running server. Skills are static files with almost no cost until used. MCP tools have defined input and output schemas and need a running process. Most production setups use both."
    - "@type": "Question"
      name: "What is progressive disclosure in Agent Skills?"
      acceptedAnswer:
        "@type": "Answer"
        text: "Progressive disclosure means the agent loads a skill in three stages. First only the name and description are always visible. The full SKILL.md loads when the skill is triggered. Bundled reference files and scripts load only when the instructions point to them. This keeps the context window small even with many skills installed."
    - "@type": "Question"
      name: "Which AI tools support Agent Skills?"
      acceptedAnswer:
        "@type": "Answer"
        text: "Claude supports the format natively, and secondary sources report adoption by tools such as OpenAI Codex, GitHub Copilot, Cursor, and Gemini CLI. Counts vary by source (roughly 30 or more tools), so check agentskills.io and each tool's documentation for current support."
    - "@type": "Question"
      name: "Do Agent Skills replace prompt engineering?"
      acceptedAnswer:
        "@type": "Answer"
        text: "No. A skill is still a prompt, saved and packaged. Writing a clear description, a precise goal, and tight constraints is prompt engineering. Skills change where good prompts live and how they get loaded, not whether the writing matters."
    - "@type": "Question"
      name: "How do I write a good SKILL.md description?"
      acceptedAnswer:
        "@type": "Answer"
        text: "State what the skill does and the situations that should trigger it, in plain words and the third person. Include the phrases a user would actually say. A vague description such as 'helps with documents' rarely triggers; 'Drafts customer-support replies in our brand voice; use when answering support tickets' does."
---

**Short answer:** **Agent Skills** are reusable folders of instructions that an AI agent loads only when a task calls for them. Each one is built around a `SKILL.md` file: a short name and description the agent always sees, plus detailed instructions it reads on demand. If prompt engineering is writing a good brief, Agent Skills are how you **save that brief, name it, and let the agent find it by itself**.

> **In this guide:** what Agent Skills are, how `SKILL.md` works, skills vs prompts vs MCP, a copy-paste `SKILL.md` template, five mistakes to avoid, and where skills are the wrong tool.

---

## What are Agent Skills?

An **Agent Skill** is a folder that packages expertise for an AI agent. At minimum it contains one file, `SKILL.md`. Optionally it also holds scripts, reference documents, templates, or other assets the instructions point to.

The idea is simple. Instead of pasting the same 400-word prompt into every chat, you write it once as a skill. The agent keeps only a one-line summary of each installed skill in view. When your request matches a summary, the agent opens the full instructions and follows them.

Anthropic introduced the format with Claude and, according to secondary sources, published it as an open standard in December 2025, with the specification hosted at [agentskills.io](https://agentskills.io). Since then, reports describe support spreading across many coding agents and AI tools. Adoption counts differ between sources, so treat any single number with care and check the tools you use.

Why this matters for prompt writers: it is the clearest sign that prompting is moving from **one-off messages** to **maintained, reusable assets**. That is the same shift behind [context engineering](/blog/context-engineering-vs-prompt-engineering) and [PromptOps](/blog/what-is-promptops).

---

## How does a SKILL.md file work?

A `SKILL.md` file has two parts: **YAML frontmatter** and a **Markdown body**.

```markdown
---
name: support-reply-drafter
description: Drafts customer-support replies in our brand voice. Use when
  answering support tickets, refund requests, or complaint emails.
---

# Support Reply Drafter

## Goal
Write a reply the customer can act on without writing back.
...
```

Per the specification as described in secondary sources, the key rules are:

- **`name`**: lowercase letters, numbers, and hyphens only, up to 64 characters.
- **`description`**: up to about 1,024 characters. This is the most important line in the file, because it is the only part the agent reads before deciding whether to load the skill.
- **Body**: normal Markdown. No special syntax is required.

Platforms may add their own optional fields, and support for some of them is uneven across tools, so keep a portable skill to the basics.

### Progressive disclosure: why skills don't clog the context window

Skills load in three stages, a pattern usually called **progressive disclosure**:

| Level | What loads | When |
|---|---|---|
| 1 | Name and description only | Always, for every installed skill |
| 2 | The full `SKILL.md` body | When the agent decides the skill matches the task |
| 3 | Bundled files and scripts | Only when the instructions reference them |

Sources estimate the always-on cost at a few dozen to roughly a hundred tokens per skill, though figures vary. The point is the shape: you can install dozens of skills without paying for their full text on every message. A pasted mega-prompt pays that cost every time.

---

## Agent Skills vs prompts vs MCP: what is the difference?

These three get confused constantly. Here is the clean split.

| | **Prompt** | **Agent Skill** | **MCP server** |
|---|---|---|---|
| **What it is** | Text you send in a chat | A saved folder of instructions | A running service exposing tools and data |
| **Answers the question** | "What do I want now?" | "How should this kind of task be done?" | "What can the agent reach?" |
| **Loaded** | Every time you paste it | Automatically, when the description matches | Tools are available whenever connected |
| **Setup** | None | Write a folder | Run and authenticate a server |
| **Reliability** | Depends on wording | Depends on wording, plus consistency of reuse | Structured inputs and outputs, so more predictable |
| **Best for** | One-off tasks | Repeatable procedures and standards | Live data and actions (calendar, database, tickets) |

The consensus across the sources I reviewed is that **skills and MCP solve different problems and compose well**. A useful rule of thumb: *skills answer "how," MCP answers "access."* A skill might say "draft the weekly report in this format and flag anything over budget," while an MCP connection fetches the budget numbers.

A plain prompt is closest to a skill. In effect, **a skill is a prompt that has been saved, named, and given a trigger.**

---

## When should you turn a prompt into a skill?

Not every prompt deserves promotion. Use this test:

1. **Do you reuse it at least weekly?** One-offs stay prompts.
2. **Does it encode your standards?** Brand voice, code review rules, report formats, and naming conventions are classic skill material.
3. **Is it long enough to be annoying to paste?** Anything over a paragraph of stable instructions qualifies.
4. **Would a teammate benefit?** Skills are files, so they can be shared and version-controlled like code.

If you answered yes to two or more, write the skill.

---

## A copy-paste SKILL.md template

This template applies the same outcome-first structure from our guide on [why old prompts stopped working](/blog/why-your-old-prompts-stopped-working), packaged as a skill.

```markdown
---
name: your-skill-name
description: [What it does, in one sentence.] Use when [the situations
  and phrases that should trigger it].
---

# [Skill title]

## Goal
[One sentence: the concrete deliverable.]

## When to use this
[2-3 bullet points of triggering situations. Also say when NOT to use it.]

## Context
[Who the output is for and any facts the model can't guess.]

## Constraints
[Hard limits only: length, tone, things to avoid. Keep to 3-5.]

## Evidence rule
Use only the facts provided or found in the referenced files. If a needed
fact is missing, write [NEED: ...] instead of guessing.

## Success criteria
[What the reader should be able to do after reading the output.]

## Output format
[Exact structure.]

## References
- See `reference/style-guide.md` for tone examples.
```

Two things to notice. First, the **"when NOT to use it"** line stops a skill from firing on the wrong task. Second, the heavy detail lives in `reference/` files, so Level 2 stays short and Level 3 loads only if needed.

### Worked example: a blog-brief skill

```markdown
---
name: seo-blog-brief
description: Creates a one-page SEO content brief from a target keyword.
  Use when asked to plan, outline, or brief a blog post or article.
---

# SEO Blog Brief

## Goal
Produce a one-page brief a writer can draft from without further questions.

## Constraints
- Max 300 words.
- Include: target reader, search intent, 5-7 H2 headings, 5 FAQ questions.
- No keyword stuffing; use the keyword in the title and first paragraph only.

## Evidence rule
Do not invent statistics. If a claim needs a source, write [NEED: source].

## Success criteria
A writer can start drafting immediately and knows what question each
section must answer.

## Output format
Title, intent (one line), reader (one line), outline, FAQs.
```

---

## 5 mistakes that make skills fail

1. **A vague description.** "Helps with writing" never triggers. Name the task and the trigger phrases: "Use when the user asks for a launch email, announcement, or product update."
2. **Stuffing everything into SKILL.md.** Long reference material belongs in separate files that load only when needed.
3. **Scripting the thinking.** Old habits like "think step by step" and 30-rule lists hurt here too. Describe the finished result and the constraints, then let the model choose the route.
4. **Overlapping skills.** Two skills with near-identical descriptions confuse the agent. Give each one a distinct job.
5. **Never testing it.** Run the skill on three realistic requests, including one it should *not* handle. Fix the description first, because triggering problems are far more common than body problems.

---

## Where Agent Skills are the wrong tool

Honest limits:

- **One-off questions.** Writing a skill for a task you will do once is overhead.
- **Live data or actions.** A skill is text. If the agent must read a database or send something, you need a tool connection such as MCP, possibly guided by a skill.
- **Hard guarantees.** Skills are natural-language guidance, so the model can still misread them. Where a step must happen exactly, put it in code or a validated tool.
- **Unvetted third-party skills.** A skill can bundle scripts. Read anything you install, as you would any code.

---

## How Promhance fits in

A skill is only as good as the prompt inside it. The weakest part of most first-draft skills is the body: unclear goal, no constraints, no success criteria. That is exactly what Promhance fixes.

1. Paste your rough instructions into the [free prompt enhancer](https://www.promhance.com).
2. Let the **S.P.A.R.K. Method** structure them into goal, context, constraints, and success criteria.
3. Drop the result into the body of your `SKILL.md` and write a sharp trigger description above it.

You can also test a drafted skill body in [PromAI](/promai) before you save it. For a deeper look at the writing side, read [How to Write Better AI Prompts](/blog/how-to-write-better-ai-prompts) and [Advanced Prompt Engineering Techniques](/blog/advanced-prompt-engineering-techniques).

**[Try Promhance free →](https://www.promhance.com)**

---

## Frequently asked questions

### What are Agent Skills?
Folders of reusable instructions that an AI agent loads only when a task needs them. Each has a required `SKILL.md` file with a name and description in YAML frontmatter, followed by Markdown instructions, and can bundle scripts and reference files. Anthropic introduced the format and published it as an open standard in December 2025.

### What is a SKILL.md file?
The entry file of an Agent Skill. It holds a name and description in frontmatter, then the instructions the agent follows once it decides the skill is relevant. The description decides whether the skill ever loads, so it must say what the skill does and when to use it.

### What is the difference between an Agent Skill and a prompt?
A prompt is text you send once. A skill is a saved prompt package the agent finds and loads automatically when the task matches its description, and it can include scripts and reference files.

### What is the difference between Agent Skills and MCP?
Skills teach an agent *how* to do something. MCP gives an agent *access* to external tools and data through a running server. Skills are static files with almost no cost until used, while MCP tools have structured inputs and outputs but need a running process. Most production setups use both.

### What is progressive disclosure in Agent Skills?
A three-stage loading pattern. The name and description are always visible, the full `SKILL.md` loads when the skill is triggered, and bundled files load only when the instructions reference them. It keeps the context window small even with many skills installed.

### Which AI tools support Agent Skills?
Claude supports the format natively, and secondary sources report adoption by tools including OpenAI Codex, GitHub Copilot, Cursor, and Gemini CLI. Counts vary by source, so verify on [agentskills.io](https://agentskills.io) and in each tool's documentation.

### Do Agent Skills replace prompt engineering?
No. A skill is still a prompt, saved and packaged. A clear goal, tight constraints, and a good trigger description are prompt engineering. Skills change where good prompts live, not whether the writing matters.

### How do I write a good SKILL.md description?
Say what the skill does and when to use it, in plain words, including the phrases a user would actually say. "Drafts customer-support replies in our brand voice; use when answering support tickets" triggers reliably. "Helps with documents" does not.

---

## Sources and further reading

- Agent Skills specification, [agentskills.io](https://agentskills.io).
- Simon Willison, *Agent Skills* (simonwillison.net, December 19, 2025).
- Strapi, *What are agent skills and how to use them*.
- SwirlAI Newsletter, *Agent Skills: Progressive Disclosure as a System Design Pattern*.
- LlamaIndex, *Skills vs MCP tools for agents: when to use what*.
- Analytics Vidhya, *MCP vs Agent Skills: Different Altogether* (April 2026).
- Anthropic's official documentation for the exact skill fields your platform supports.

*Last updated: October 20, 2026. Adoption figures come largely from secondary sources and change quickly; verify against official documentation.*
