import {
  Compass,
  BrainCircuit,
  SlidersHorizontal,
  Database,
  Bot,
  ClipboardCheck,
  Crown,
  Gamepad2,
  Type,
  Map,
  BarChart3,
  Braces,
  Scale,
  SearchCode,
  Workflow,
  FlaskConical,
  Calculator,
  FileText,
  Swords,
} from 'lucide-react';
import type { LabMeta, Lesson, Level } from './types';
import { level0Lessons } from './lessons/level0';
import { level1Lessons } from './lessons/level1';
import { level2Lessons } from './lessons/level2';
import { level3Lessons } from './lessons/level3';
import { level4Lessons } from './lessons/level4';
import { level5Lessons } from './lessons/level5';
import { level6Lessons } from './lessons/level6';

export const LEVELS: Level[] = [
  {
    id: 0,
    title: 'Demystifying the AI Landscape',
    tagline: 'Zero-jargon start: what AI actually is (and is not).',
    outcome: 'Tell rules, classical ML, deep learning and GenAI apart — and pick the cheapest one that solves the problem.',
    icon: Compass,
    color: 'sky',
    lessons: level0Lessons,
    labs: [
      { id: 'lab-0', levelId: 0, code: 'Lab 0', title: '“Which Technology Do We Actually Need?” Decision Game', summary: '10 realistic enterprise & government briefs. Choose Rules/SQL, Classical ML or GenAI and see the cost, accuracy and over-engineering fallout.', icon: Gamepad2, minutes: 15 },
    ],
  },
  {
    id: 1,
    title: 'How LLMs Read, Think & Hallucinate',
    tagline: 'Tokens, embeddings, context windows and next-token prediction.',
    outcome: 'Explain why LLMs cost what they cost, forget the middle of long documents, and confidently invent facts.',
    icon: BrainCircuit,
    color: 'violet',
    lessons: level1Lessons,
    labs: [
      { id: 'lab-1a', levelId: 1, code: 'Lab 1A', title: 'Tokenizer & Cost Visualizer', summary: 'Type or paste any text and watch it split into colour-coded tokens with live cost comparison across model tiers.', icon: Type, minutes: 10 },
      { id: 'lab-1b', levelId: 1, code: 'Lab 1B', title: '2D Embedding Meaning Map', summary: '20 concepts plotted as coordinates of meaning. Click any two to draw a line and compute their cosine similarity.', icon: Map, minutes: 10 },
      { id: 'lab-1c', levelId: 1, code: 'Lab 1C', title: 'Next-Token Probability Simulator', summary: 'Change the prompt and temperature, watch the probability bars shift, and see a hallucination being born token by token.', icon: BarChart3, minutes: 12 },
    ],
  },
  {
    id: 2,
    title: 'Controlling the AI — Prompting, Parameters & Model Selection',
    tagline: 'System prompts, temperature, structured outputs and build-vs-buy.',
    outcome: 'Specify how an AI feature should behave and pick the right model strategy for your constraints.',
    icon: SlidersHorizontal,
    color: 'emerald',
    lessons: level2Lessons,
    labs: [
      { id: 'lab-2a', levelId: 2, code: 'Lab 2A', title: 'Temperature & JSON Extraction Playground', summary: 'Turn messy citizen grievances into structured JSON. Play with temperature and strict schemas and watch validation and hallucination risk.', icon: Braces, minutes: 15 },
      { id: 'lab-2b', levelId: 2, code: 'Lab 2B', title: 'Model Architecture Recommender', summary: 'Toggle sovereignty, budget, latency SLA and complexity — a live decision matrix scores and recommends a model strategy.', icon: Scale, minutes: 12 },
    ],
  },
  {
    id: 3,
    title: 'Connecting AI to Private Data — RAG vs. Fine-Tuning',
    tagline: 'Chunking, embeddings, vector search, hybrid retrieval and grounding.',
    outcome: 'Design, debug and defend a Retrieval-Augmented Generation pipeline — and know when fine-tuning is the wrong answer.',
    icon: Database,
    color: 'amber',
    lessons: level3Lessons,
    labs: [
      { id: 'lab-3', levelId: 3, code: 'Lab 3', title: 'Visual Glass-Box RAG Simulator', summary: 'Chunk real policy documents, run keyword / vector / hybrid search, inspect similarity scores and click citations — then break it on purpose.', icon: SearchCode, minutes: 20 },
    ],
  },
  {
    id: 4,
    title: 'AI Agents, Tool Use (MCP) & Human-in-the-Loop UX',
    tagline: 'From chatbots to agents that plan, call tools and ask for approval.',
    outcome: 'Read an agent trace, design approval gates, and decide how much autonomy is safe.',
    icon: Bot,
    color: 'rose',
    lessons: level4Lessons,
    labs: [
      { id: 'lab-4', levelId: 4, code: 'Lab 4', title: 'Agent Trace & HITL Approval Simulator', summary: 'Step through an Application Verification Agent: plan → tool calls → confidence score → your Approve / Edit / Reject decision.', icon: Workflow, minutes: 15 },
    ],
  },
  {
    id: 5,
    title: 'AI Evaluations (The New UAT) & Token FinOps',
    tagline: 'Golden datasets, LLM-as-a-judge, the RAG triad and cost modelling.',
    outcome: 'Run AI UAT like a pro and build a defensible monthly cost model in ₹ and $.',
    icon: ClipboardCheck,
    color: 'cyan',
    lessons: level5Lessons,
    labs: [
      { id: 'lab-5a', levelId: 5, code: 'Lab 5A', title: 'Automated UAT Eval Suite Runner', summary: 'Tweak prompt strictness, top-K and guardrails, run a 10-case golden dataset, and catch regressions before release.', icon: FlaskConical, minutes: 15 },
      { id: 'lab-5b', levelId: 5, code: 'Lab 5B', title: 'AI Project FinOps & TCO Calculator', summary: 'Users, queries, tokens, caching and model tier → monthly cost in ₹ and $, with automatic optimisation tips.', icon: Calculator, minutes: 12 },
    ],
  },
  {
    id: 6,
    title: 'Leading AI Projects — PRDs, Agile Sprints & Governance',
    tagline: 'Run AI programs: sprints, PRDs, guardrails, DPDP & EU AI Act.',
    outcome: 'Write an AI PRD, plan eval-driven sprints and navigate real executive crises.',
    icon: Crown,
    color: 'indigo',
    lessons: level6Lessons,
    labs: [
      { id: 'lab-6a', levelId: 6, code: 'Lab 6A', title: 'AI PRD & Spec Builder', summary: 'A guided wizard that builds a complete AI Product Requirements Document and exports it as clean Markdown.', icon: FileText, minutes: 25 },
      { id: 'lab-6b', levelId: 6, code: 'Lab 6B', title: '“Chief AI PM” Scenario Simulator', summary: '6 crisis & architecture roleplays — zero-hallucination demands, fine-tuning fever, a 400% cost spike — graded with executive feedback.', icon: Swords, minutes: 20 },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = LEVELS.flatMap((l) => l.lessons);
export const ALL_LABS: LabMeta[] = LEVELS.flatMap((l) => l.labs);

export const lessonById = (id: string) => ALL_LESSONS.find((l) => l.id === id);
export const labById = (id: string) => ALL_LABS.find((l) => l.id === id);
export const levelById = (id: number) => LEVELS.find((l) => l.id === id);

/** The lesson/lab that comes after the given one, in curriculum order. */
export function nextItem(id: string): { kind: 'lesson' | 'lab'; id: string; title: string } | null {
  const seq = LEVELS.flatMap((lv) => [
    ...lv.lessons.map((l) => ({ kind: 'lesson' as const, id: l.id, title: l.title })),
    ...lv.labs.map((l) => ({ kind: 'lab' as const, id: l.id, title: `${l.code}: ${l.title}` })),
  ]);
  const i = seq.findIndex((s) => s.id === id);
  return i >= 0 && i < seq.length - 1 ? seq[i + 1] : null;
}

export function prevItem(id: string): { kind: 'lesson' | 'lab'; id: string; title: string } | null {
  const seq = LEVELS.flatMap((lv) => [
    ...lv.lessons.map((l) => ({ kind: 'lesson' as const, id: l.id, title: l.title })),
    ...lv.labs.map((l) => ({ kind: 'lab' as const, id: l.id, title: `${l.code}: ${l.title}` })),
  ]);
  const i = seq.findIndex((s) => s.id === id);
  return i > 0 ? seq[i - 1] : null;
}
