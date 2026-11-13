import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export const STORAGE_KEY = 'ai-pm-academy:v1';

export interface QuizRecord {
  best: number;
  last: number;
  total: number;
  attempts: number;
}

export interface ActivityItem {
  t: string;
  label: string;
  href: string;
}

export interface ProgressState {
  version: 1;
  createdAt: string;
  completedLessons: Record<string, string>;
  lessonStep: Record<string, number>;
  quizScores: Record<string, QuizRecord>;
  labScores: Record<string, number>;
  labMissions: Record<string, string[]>;
  labData: Record<string, unknown>;
  bookmarks: string[];
  notes: Record<string, string>;
  activity: ActivityItem[];
  settings: { theme: 'light' | 'dark'; fxRate: number };
}

function freshState(): ProgressState {
  const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    completedLessons: {},
    lessonStep: {},
    quizScores: {},
    labScores: {},
    labMissions: {},
    labData: {},
    bookmarks: [],
    notes: {},
    activity: [],
    settings: { theme: prefersDark ? 'dark' : 'light', fxRate: 88 },
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Merge whatever was stored (or imported) onto a fresh state so missing keys never crash the UI. */
export function normalizeState(raw: unknown): ProgressState {
  const base = freshState();
  if (!isRecord(raw)) return base;
  const r = raw as Partial<ProgressState>;
  return {
    ...base,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : base.createdAt,
    completedLessons: isRecord(r.completedLessons) ? (r.completedLessons as Record<string, string>) : {},
    lessonStep: isRecord(r.lessonStep) ? (r.lessonStep as Record<string, number>) : {},
    quizScores: isRecord(r.quizScores) ? (r.quizScores as Record<string, QuizRecord>) : {},
    labScores: isRecord(r.labScores) ? (r.labScores as Record<string, number>) : {},
    labMissions: isRecord(r.labMissions) ? (r.labMissions as Record<string, string[]>) : {},
    labData: isRecord(r.labData) ? r.labData : {},
    bookmarks: Array.isArray(r.bookmarks) ? r.bookmarks.filter((b): b is string => typeof b === 'string') : [],
    notes: isRecord(r.notes) ? (r.notes as Record<string, string>) : {},
    activity: Array.isArray(r.activity) ? r.activity.slice(0, 40) : [],
    settings: {
      theme: r.settings?.theme === 'dark' ? 'dark' : r.settings?.theme === 'light' ? 'light' : base.settings.theme,
      fxRate: typeof r.settings?.fxRate === 'number' && r.settings.fxRate > 0 ? r.settings.fxRate : base.settings.fxRate,
    },
  };
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : freshState();
  } catch {
    return freshState();
  }
}

interface ProgressApi {
  state: ProgressState;
  completeLesson: (lessonId: string, label: string, href: string) => void;
  uncompleteLesson: (lessonId: string) => void;
  setLessonStep: (lessonId: string, step: number) => void;
  recordQuiz: (lessonId: string, score: number, total: number) => void;
  setLabScore: (labId: string, score: number, label?: string, href?: string) => void;
  completeMission: (labId: string, missionId: string) => void;
  setLabData: <T>(key: string, value: T) => void;
  toggleBookmark: (id: string) => void;
  setNote: (id: string, text: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setFxRate: (rate: number) => void;
  importState: (raw: unknown) => void;
  resetAll: () => void;
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable (private mode); the app still works in-memory */
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.settings.theme === 'dark');
  }, [state.settings.theme]);

  const pushActivity = (s: ProgressState, label: string, href: string): ActivityItem[] =>
    [{ t: new Date().toISOString(), label, href }, ...s.activity.filter((a) => a.href !== href)].slice(0, 40);

  const completeLesson = useCallback((lessonId: string, label: string, href: string) => {
    setState((s) =>
      s.completedLessons[lessonId]
        ? s
        : { ...s, completedLessons: { ...s.completedLessons, [lessonId]: new Date().toISOString() }, activity: pushActivity(s, `Completed lesson: ${label}`, href) },
    );
  }, []);

  const uncompleteLesson = useCallback((lessonId: string) => {
    setState((s) => {
      const next = { ...s.completedLessons };
      delete next[lessonId];
      return { ...s, completedLessons: next };
    });
  }, []);

  const setLessonStep = useCallback((lessonId: string, step: number) => {
    setState((s) => (s.lessonStep[lessonId] === step ? s : { ...s, lessonStep: { ...s.lessonStep, [lessonId]: step } }));
  }, []);

  const recordQuiz = useCallback((lessonId: string, score: number, total: number) => {
    setState((s) => {
      const prev = s.quizScores[lessonId];
      const rec: QuizRecord = { best: Math.max(prev?.best ?? 0, score), last: score, total, attempts: (prev?.attempts ?? 0) + 1 };
      return { ...s, quizScores: { ...s.quizScores, [lessonId]: rec } };
    });
  }, []);

  const setLabScore = useCallback((labId: string, score: number, label?: string, href?: string) => {
    setState((s) => {
      const clamped = Math.max(0, Math.min(100, Math.round(score)));
      if ((s.labScores[labId] ?? -1) >= clamped) return s;
      return {
        ...s,
        labScores: { ...s.labScores, [labId]: clamped },
        activity: label && href ? pushActivity(s, `${label}: ${clamped}%`, href) : s.activity,
      };
    });
  }, []);

  const completeMission = useCallback((labId: string, missionId: string) => {
    setState((s) => {
      const cur = s.labMissions[labId] ?? [];
      if (cur.includes(missionId)) return s;
      return { ...s, labMissions: { ...s.labMissions, [labId]: [...cur, missionId] } };
    });
  }, []);

  const setLabData = useCallback(<T,>(key: string, value: T) => {
    setState((s) => ({ ...s, labData: { ...s.labData, [key]: value } }));
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setState((s) => ({ ...s, bookmarks: s.bookmarks.includes(id) ? s.bookmarks.filter((b) => b !== id) : [id, ...s.bookmarks] }));
  }, []);

  const setNote = useCallback((id: string, text: string) => {
    setState((s) => ({ ...s, notes: { ...s.notes, [id]: text } }));
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setState((s) => ({ ...s, settings: { ...s.settings, theme } }));
  }, []);

  const setFxRate = useCallback((fxRate: number) => {
    setState((s) => ({ ...s, settings: { ...s.settings, fxRate } }));
  }, []);

  const importState = useCallback((raw: unknown) => {
    setState(normalizeState(raw));
  }, []);

  const resetAll = useCallback(() => {
    setState((s) => ({ ...freshState(), settings: s.settings }));
  }, []);

  const api = useMemo<ProgressApi>(
    () => ({
      state,
      completeLesson,
      uncompleteLesson,
      setLessonStep,
      recordQuiz,
      setLabScore,
      completeMission,
      setLabData,
      toggleBookmark,
      setNote,
      setTheme,
      setFxRate,
      importState,
      resetAll,
    }),
    [state, completeLesson, uncompleteLesson, setLessonStep, recordQuiz, setLabScore, completeMission, setLabData, toggleBookmark, setNote, setTheme, setFxRate, importState, resetAll],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}

/** Typed accessor for a lab's persisted data blob. */
export function useLabData<T>(key: string, fallback: T): [T, (v: T) => void] {
  const { state, setLabData } = useProgress();
  const value = (state.labData[key] as T | undefined) ?? fallback;
  const set = useCallback((v: T) => setLabData<T>(key, v), [key, setLabData]);
  return [value, set];
}

export function exportProgress(state: ProgressState): void {
  const blob = new Blob([JSON.stringify({ app: 'ai-pm-academy', exportedAt: new Date().toISOString(), ...state }, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-pm-academy-progress-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
