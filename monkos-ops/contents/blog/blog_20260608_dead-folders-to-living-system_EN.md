---
type: blog
date: 2026-06-08
slug: dead-folders-to-living-system
lang: EN
author: Shin-jakka
channel: Reddit / Medium (영문 채널 맞춤 작성)
status: draft
topic: Three-layer doc system working with AI agents — and the nameless fourth
tone: Reddit/Medium 1인칭 빌더 에세이
---

# Working with AI agents, I split my docs into three types. One of them had no name in the industry.

> **TL;DR** — I run a small business solo with several AI agents. As I delegated work, my documents naturally split into three kinds: **① how to do things (procedures) ② what's been done and where we are (project records) ③ what must never be broken (principles).** But ② was strange — not a procedure, not a principle, and the industry had no clean name for it. Chasing its identity led me to "a living system," and to a single rule that survived everything: **allow duplication, forbid omission.**

---

I spent 20 years as a photographer. Somehow I now run a company alone with several AI agents — they split the coding, the deploys, the content. But whether it's humans or AIs, working together means **writing things down**. Speech doesn't persist. So I became a documentation obsessive.

As I delegated more, the docs I kept naturally split into three kinds:

- **Procedures** — "this is how we do X." How to deploy, how to write a report. The *how*.
- **Project records** — "this project started here and is now at this point." The *what we've done*.
- **Principles** — "no matter what, never break this." The *why*.

That was clean enough. Then one day a question hit me: **how exactly do these three differ, and how do they turn as one body?** Especially the middle one — project records. It's not a procedure and not a principle, so what *is* it?

I chased that one question further than I expected.

## 1. Procedures and records are different parts of speech

Put side by side, procedures and project records turned out to be **different parts of speech**.

**A procedure is a verb.** "How do you do this?" Stateless. You call it, it runs, it's gone. Same every time. Like a function.

**A project record is a noun.** "Where are we now?" It holds state — yesterday's decision, today's progress, the accumulated history. It keeps growing. Like data.

Once I saw that, the relationship clicked. They don't compete — they're **orthogonal**. One is a horizontal axis, the other vertical. And crucially: **the procedure reads and updates the project record.** Exactly like an object and its methods. The record is the data; the procedure is the function that operates on it.

So where does the third one — principles — fit? It sits above, looking down on both. Neither procedures nor records may violate a principle. Three layers forming a coordinate system.

Here's what became clear: procedures and principles are common concepts (runbooks and design rules, respectively). But **that middle "project record" — what is it actually called?** I got curious.

## 2. So I went looking. There was no name.

"A living document that holds a project's full state and history, per project." What does the industry call this? I searched. **There was no single clean term.** Instead it was a *fusion* of several established patterns:

- **DDD's "bounded context" / aggregate** — a cohesive domain wrapped as one. Each of my project records was exactly this.
- **Event sourcing's append-only log** — you only add events, never edit/delete, and the current state is the sum of them. My record's "history" was literally this pattern.
- **An AI agent's long-term memory** — a persistent store so the agent doesn't lose context. That was my record's actual purpose.
- And documents that usually live apart — **ADRs, post-mortems, OKRs, risk registers** — I'd been cramming all of them into *one document per project*.

In the industry these are *separate*: decision records here, retros there, metrics in a spreadsheet. Without knowing it, I'd **condensed them per project**.

There was one decisive difference too. All those existing docs assume **a human is the primary reader.** Mine assume **an AI agent is** — it's the first thing an agent reads when it starts work.

So here's my conclusion: what I'd built was an **emerging pattern the industry hasn't named yet.** In one line — **I'd promoted "a project" from something scattered in heads and files into a single data structure (a first-class object).** Normally a "project" is smeared across people's memory and stray docs. I'd crystallized it into an *object*.

And once I saw that, I finally understood — in reverse — **why I'd struggled so badly at the start.**

## 3. I made 100 folders and felt great. A week later, all dead.

At first I did what everyone does. Topic folders. `strategy/` `infra/` `tech/` `philosophy/`. I felt so accomplished slotting everything into neat bins.

Want to know what happened a week later? **Nobody opened those folders.** Not the agents, not me.

Now I know why. Topic folders are a **library**. A structure for shelving books. But a library's fate is neglect. The moment you drop a strategy doc into `strategy/`, it dies — never pulled out again, never updated, out of sync with reality a month later. Static classification can't survive time.

The answer I'd found earlier paid off here. The problem was the *axis* of classification. Not "topic" but **"lifecycle."** Not "what field is this?" but **"whose living flow does this belong to?"** Then the same doc, instead of becoming a fossil, keeps getting referenced and updated. Because **an asset is, in the end, something that keeps working.** A doc in a tomb does no work; a doc in a flow does.

## 4. In the end, one rule survived

I tried every rule for running these project records. Exactly one survived:

> **Allow duplication. Forbid omission.**

At first I did the opposite. "Duplication is waste, so clean it up early." That was the trap. Pruning before I knew what mattered meant the thing I'd need later was already gone.

Why this is right is, honestly, **math.** The two errors have completely different costs:

- **Omission is irreversible.** What you didn't write is gone forever — that moment's context just evaporates.
- **Duplication is reversible.** Overlaps can be merged and trimmed anytime. It's just temporary surplus.

The costs are asymmetric, so the answer is fixed: **when in doubt, keep it.** Nature and engineering already proved this. **DNA** duplicates a gene first, then differentiates later — the spare copy becomes raw material for new function. **Git** commits everything first, tidies later. Preserve first, condense later. Don't optimize prematurely.

## 5. This is what "alive" means

Won't it get messy if you just pile up? Here's the core.

**Efficiency comes from condensing as you accumulate — not from caging before you've accumulated.**

Once enough piles up, the duplication reveals itself naturally. *Then* you merge. The system finds its own contradictions, cleans itself, rewrites its own rules. What looked like duplication and waste early on condenses and evolves over time. **That's the difference between a dead library and a living system.**

And here the three layers meet again. Each day's work log moves into the project record (state), recurring lessons harden into procedures (action), and what must never be broken rises into principles (norms). **A day's conversation → a project asset → a procedure → a principle.** A fleeting moment, climbing the rungs, crystallizing into ever-harder assets.

This was the question that mattered most to me: **"How do I take what I did today and establish it as an asset instead of letting it rot?"** The three-layer doc system was, in the end, my answer.

## 6. An honest confession — the unsolved part

Sounds neat so far, right? Let me be honest.

The real reason this system is alive is that **I look at it every day.** Whether it's time to condense, what's missing, what's drifted — right now **I'm the heart.** The trigger for condensing and amending is my own conscious patrol.

So the next problem is clear: **can I automate this aliveness?** Can the system, on a day I'm not looking, detect what's missing on its own and start condensing? Can "forbid omission" be guaranteed by the *system* rather than a person? The ultimate form of a living thing is, after all, **to beat on its own.** Get there, and it stops being my filing method and becomes a real operating system.

---

That was long. To recap — I started with three layers (procedures, records, principles), and chasing the identity of the middle one (project records) carried me to a *nameless pattern* and a *living system*.

I want to ask you: has anyone here treated a project as **a single data structure (a first-class object)** like this? If so, what do you call it? And if anyone has automated the *judgment of when to condense* — I'd love to hear it. That's exactly where I'm stuck.

Thanks for reading. 🙏

> *The writer went from photography to building a small business with AI tools.*
