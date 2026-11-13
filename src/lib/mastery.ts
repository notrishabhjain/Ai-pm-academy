import { ALL_LABS, ALL_LESSONS, LEVELS } from '../data/curriculum';
import type { Level } from '../data/types';
import type { ProgressState } from '../store/progress';

export const WEIGHTS = { lessons: 0.35, quizzes: 0.25, labs: 0.4 };

export function levelProgress(level: Level, s: ProgressState): number {
  const lessonPts = level.lessons.filter((l) => s.completedLessons[l.id]).length;
  const labPts = level.labs.reduce((acc, lab) => acc + (s.labScores[lab.id] ?? 0) / 100, 0);
  const total = level.lessons.length + level.labs.length;
  return total === 0 ? 0 : ((lessonPts + labPts) / total) * 100;
}

export function masteryBreakdown(s: ProgressState) {
  const lessonPct = (ALL_LESSONS.filter((l) => s.completedLessons[l.id]).length / ALL_LESSONS.length) * 100;
  const quizPct =
    (ALL_LESSONS.reduce((acc, l) => {
      const q = s.quizScores[l.id];
      return acc + (q ? q.best / q.total : 0);
    }, 0) /
      ALL_LESSONS.length) *
    100;
  const labPct = ALL_LABS.reduce((acc, l) => acc + (s.labScores[l.id] ?? 0), 0) / ALL_LABS.length;
  const overall = lessonPct * WEIGHTS.lessons + quizPct * WEIGHTS.quizzes + labPct * WEIGHTS.labs;
  return { lessonPct, quizPct, labPct, overall };
}

export const RANKS = [
  { min: 0, title: 'AI Curious', blurb: 'You have started the journey — every expert began here.' },
  { min: 15, title: 'AI Literate', blurb: 'You can follow AI conversations without nodding along blindly.' },
  { min: 35, title: 'AI Practitioner', blurb: 'You understand the moving parts and can spot obvious design smells.' },
  { min: 55, title: 'AI Project Manager', blurb: 'You can scope, cost, evaluate and govern a real AI project.' },
  { min: 80, title: 'Chief AI PM', blurb: 'You lead AI programs with architectural judgement and executive calm.' },
];

export function rankFor(score: number) {
  return [...RANKS].reverse().find((r) => score >= r.min) ?? RANKS[0];
}

export function levelStats(s: ProgressState) {
  return LEVELS.map((lv) => ({
    level: lv,
    progress: levelProgress(lv, s),
    lessonsDone: lv.lessons.filter((l) => s.completedLessons[l.id]).length,
  }));
}
