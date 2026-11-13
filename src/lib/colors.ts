import type { LevelColor } from '../data/types';

/**
 * Tailwind only ships classes it can see as complete strings in source files,
 * so every color variant used dynamically is spelled out here.
 */
export interface ColorClasses {
  text: string;
  textStrong: string;
  bg: string;
  bgSoft: string;
  border: string;
  ring: string;
  gradient: string;
  bar: string;
  chip: string;
}

export const COLORS: Record<LevelColor, ColorClasses> = {
  sky: {
    text: 'text-sky-600 dark:text-sky-400',
    textStrong: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-600',
    bgSoft: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-900',
    ring: 'ring-sky-500',
    gradient: 'from-sky-500 to-cyan-500',
    bar: 'bg-sky-500',
    chip: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
  },
  violet: {
    text: 'text-violet-600 dark:text-violet-400',
    textStrong: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-600',
    bgSoft: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-violet-200 dark:border-violet-900',
    ring: 'ring-violet-500',
    gradient: 'from-violet-500 to-fuchsia-500',
    bar: 'bg-violet-500',
    chip: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200',
  },
  emerald: {
    text: 'text-emerald-600 dark:text-emerald-400',
    textStrong: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-600',
    bgSoft: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-900',
    ring: 'ring-emerald-500',
    gradient: 'from-emerald-500 to-teal-500',
    bar: 'bg-emerald-500',
    chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  },
  amber: {
    text: 'text-amber-600 dark:text-amber-400',
    textStrong: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-600',
    bgSoft: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-900',
    ring: 'ring-amber-500',
    gradient: 'from-amber-500 to-orange-500',
    bar: 'bg-amber-500',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  },
  rose: {
    text: 'text-rose-600 dark:text-rose-400',
    textStrong: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-600',
    bgSoft: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-900',
    ring: 'ring-rose-500',
    gradient: 'from-rose-500 to-pink-500',
    bar: 'bg-rose-500',
    chip: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
  },
  cyan: {
    text: 'text-cyan-600 dark:text-cyan-400',
    textStrong: 'text-cyan-700 dark:text-cyan-300',
    bg: 'bg-cyan-600',
    bgSoft: 'bg-cyan-50 dark:bg-cyan-950/40',
    border: 'border-cyan-200 dark:border-cyan-900',
    ring: 'ring-cyan-500',
    gradient: 'from-cyan-500 to-blue-500',
    bar: 'bg-cyan-500',
    chip: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200',
  },
  indigo: {
    text: 'text-indigo-600 dark:text-indigo-400',
    textStrong: 'text-indigo-700 dark:text-indigo-300',
    bg: 'bg-indigo-600',
    bgSoft: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-900',
    ring: 'ring-indigo-500',
    gradient: 'from-indigo-500 to-violet-500',
    bar: 'bg-indigo-500',
    chip: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
  },
};

/** Traffic-light helper for scores in the 0–100 range. */
export function scoreTone(score: number): { text: string; bg: string; bar: string } {
  if (score >= 80) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', bar: 'bg-emerald-500' };
  if (score >= 50) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', bar: 'bg-amber-500' };
  return { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40', bar: 'bg-rose-500' };
}
