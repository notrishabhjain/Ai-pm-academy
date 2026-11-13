# AI PM Academy

An interactive, visual learning web app that takes you from **absolute zero in AI** to a **confident AI Project / Program Manager** — someone who understands AI concepts, architecture trade-offs, evaluations (the new UAT), cost modelling (Token FinOps) and governance.

- **100% client-side static SPA** — React + TypeScript + Vite + Tailwind CSS + Lucide icons.
- **No backend, no database, no API keys.** Every simulator, RAG pipeline, agent trace and eval lab runs in your browser on built-in simulation engines and realistic pre-loaded datasets.
- **Your progress stays in your browser** (`localStorage`): completed lessons, quiz scores, lab scores and missions, bookmarks, notes and lab outputs. Use **Export / Import progress JSON** to back up or move devices.

---

## What’s inside

### Every lesson follows the same 4-step card structure (plus a quiz)

1. **Explain Like I’m New** — an everyday analogy with zero jargon, plus a “translate the analogy” table.
2. **How It Actually Works** — an interactive, step-through visual diagram with “under the hood” peeks.
3. **Interactive Hands-On Sandbox** — sliders, toggles and live data flows to see what breaks when parameters change.
4. **The AI PM Lens** — when to use it, cost/latency impact, failure modes, and **3 questions to ask your engineers**.
5. **Knowledge Check** — a short quiz with explanations (scores are saved).

### The 7-level curriculum (29 lessons, 12 labs)

| Level | Lessons | Labs |
|---|---|---|
| **0 · Demystifying the AI Landscape** | Rules vs. Classical ML vs. Deep Learning vs. GenAI · Supervised / Unsupervised / Reinforcement learning · Training vs. Inference · Deterministic vs. Probabilistic | **Lab 0** “Which Technology Do We Actually Need?” decision game — 10 enterprise & government briefs |
| **1 · How LLMs Read, Think & Hallucinate** | Tokenization · Embeddings & vector space · Context windows, attention & “lost in the middle” · Next-token probability & hallucinations | **1A** Tokenizer & cost visualizer · **1B** 2D embedding meaning map with cosine similarity · **1C** Next-token probability simulator |
| **2 · Controlling the AI** | System vs. user prompts vs. few-shot · Temperature & Top-P · Structured outputs (JSON Schema) · Model selection & build-vs-buy | **2A** Temperature & JSON extraction playground · **2B** Model architecture recommender |
| **3 · Connecting AI to Private Data** | Why LLMs don’t know your data · The 5 stages of RAG · BM25 vs. vector vs. hybrid + reranking · Prompting vs. RAG vs. fine-tuning vs. long context | **3** Glass-box RAG simulator — real chunking, BM25, vector search, RRF hybrid + reranker, clickable citations |
| **4 · Agents, Tool Use (MCP) & HITL** | Chatbots vs. agents · Tool calling & MCP · Multi-agent patterns · Human-in-the-loop design | **4** Agent trace & HITL approval simulator — Approve / Edit / Reject |
| **5 · Evaluations & Token FinOps** | Why binary UAT fails · Golden datasets · Code evals vs. LLM-as-a-judge · The RAG triad · Token FinOps | **5A** Automated UAT eval suite runner with regressions · **5B** FinOps & TCO calculator in ₹ and $ |
| **6 · Leading AI Projects** | AI sprints (spikes, eval sprints) · Writing an AI PRD · Security & compliance (prompt injection, PII, audit logs, DPDP Act, EU AI Act) · Spec-driven AI development | **6A** AI PRD & spec builder → Markdown export · **6B** “Chief AI PM” scenario simulator — 6 graded crises |

### App experience

- **Sidebar** with per-level progress bars and expandable lesson/lab lists.
- **Dashboard** with an overall **mastery score** (lessons 35% · quizzes 25% · labs 40%), rank, level cards, lab scoreboard, Chief AI PM simulator score, bookmarks and recent activity.
- **Quick Glossary & AI PM Cheat Sheet** — searchable from anywhere with <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd> or <kbd>/</kbd>; also finds lessons and labs.
- **Lab missions** — every lab has auto-detected goals that turn free play into deliberate practice and produce the lab score.
- Light / dark theme, mobile-friendly layout, per-lesson notes, bookmarks.

> **About the numbers:** model prices, latencies and quality figures are **illustrative teaching values** with realistic shapes (e.g. output tokens cost ~5× input; cached input ~90% cheaper). Always check your vendor’s current price sheet before using numbers in a business case. Policies, people and IDs in the datasets are fictional.

---

## Run it locally

Requires Node.js 20+ (22 recommended).

```bash
npm install
npm run dev        # start the dev server at http://localhost:5173
npm run build      # type-check (tsc -b) + production build into dist/
npm run preview    # serve the production build locally
```

---

## Deploy

The build uses **relative asset paths** (`base: './'`) and **hash-based routing** (`#/lesson/tokenization`), so the same `dist/` works at a domain root (Vercel) and under a sub-path (GitHub Pages) — deep links never 404 and assets never break.

### Option A — Vercel

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project → Import** the repository.
3. Vercel reads `vercel.json` automatically (framework `vite`, build `npm run build`, output `dist`, SPA rewrite). Click **Deploy**.

Or with the CLI: `npx vercel --prod`.

### Option B — GitHub Pages (automatic via GitHub Actions)

1. In the repository on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Merge to the `main` branch (or run the workflow manually from the **Actions** tab → *Deploy to GitHub Pages* → *Run workflow*).
3. The workflow in `.github/workflows/deploy.yml` installs, type-checks, builds and publishes `dist/`. Your site appears at `https://<your-username>.github.io/<repo-name>/`.

---

## Project structure

```
src/
  App.tsx                  # routes (hash router) + lazy-loaded pages
  store/progress.tsx       # localStorage-backed progress store, export/import
  data/
    curriculum.ts          # levels, lessons and labs registry
    lessons/level0-6.ts    # all lesson content: analogy, diagram steps, PM lens, quiz
    glossary.ts            # glossary terms + AI PM cheat sheet
    ragDocs.ts             # 3 realistic documents + preset RAG test queries
    models.ts              # illustrative model tiers, pricing and latency
  sandboxes/level0-6.tsx   # one interactive sandbox per lesson (29)
  labs/                    # the 12 interactive labs
  lib/
    tokenizer.ts           # BPE-style teaching tokenizer
    rag.ts                 # chunking, BM25, concept-vector search, RRF hybrid, reranker, grounded answers
    jsonSchema.ts          # JSON Schema validator used by the structured-output labs
    pii.ts                 # India-focused PII masking & prompt-injection detection
    math.ts                # softmax, top-p, cosine, entropy, seeded RNG
    mastery.ts             # mastery score & ranks
  components/              # UI kit, step diagram, PM lens, quiz, layout, glossary modal, charts
```

## Your data & privacy

Nothing leaves your browser. Progress is stored under the `ai-pm-academy:v1` key in `localStorage`. Clearing site data resets it — export a JSON backup first if you care about your scores.
