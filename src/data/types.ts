import type { LucideIcon } from 'lucide-react';

export interface AnalogyRow {
  everyday: string;
  ai: string;
}

export interface Analogy {
  title: string;
  story: string[];
  mapping: AnalogyRow[];
  oneLiner: string;
}

export interface DiagramNode {
  id: string;
  label: string;
  sub?: string;
  icon: LucideIcon;
}

export interface DiagramStep {
  title: string;
  body: string;
  active: string[];
  /** Optional "under the hood" peek, rendered in monospace. */
  peek?: string;
}

export interface Diagram {
  caption: string;
  nodes: DiagramNode[];
  steps: DiagramStep[];
  /** Draw a loop-back arrow from the last node to the first (agent loops, etc.). */
  loop?: boolean;
}

export interface PMLens {
  whenToUse: string[];
  costLatency: string[];
  failureModes: string[];
  questions: [string, string, string];
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface Lesson {
  id: string;
  levelId: number;
  title: string;
  summary: string;
  minutes: number;
  analogy: Analogy;
  diagram: Diagram;
  sandboxTitle: string;
  sandboxIntro: string;
  pmLens: PMLens;
  quiz: QuizQuestion[];
  keyTerms: string[];
}

export interface LabMeta {
  id: string;
  levelId: number;
  code: string;
  title: string;
  summary: string;
  icon: LucideIcon;
  minutes: number;
}

export interface Level {
  id: number;
  title: string;
  tagline: string;
  outcome: string;
  icon: LucideIcon;
  /** Tailwind color family used for accents. */
  color: LevelColor;
  lessons: Lesson[];
  labs: LabMeta[];
}

export type LevelColor = 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'indigo';
