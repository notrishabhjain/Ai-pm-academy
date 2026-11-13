import { Suspense, useState } from 'react';
import {
  Lightbulb,
  Workflow,
  Hand,
  Briefcase,
  ListChecks,
  Bookmark,
  BookmarkCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  NotebookPen,
  Tag,
} from 'lucide-react';
import { lessonById, levelById, nextItem, prevItem } from '../data/curriculum';
import { COLORS } from '../lib/colors';
import { hrefs } from '../lib/router';
import { useProgress } from '../store/progress';
import { StepDiagram } from '../components/StepDiagram';
import { PMLensView } from '../components/PMLensView';
import { Quiz } from '../components/Quiz';
import { Loading } from '../components/Loading';
import { useGlossary } from '../components/GlossaryModal';
import { SANDBOXES } from '../sandboxes';
import { Button, Card, cx } from '../components/ui';
import { NotFound } from './NotFound';

const STEPS = [
  { key: 'analogy', label: 'Explain Like I’m New', short: 'Analogy', icon: Lightbulb },
  { key: 'how', label: 'How It Actually Works', short: 'Diagram', icon: Workflow },
  { key: 'sandbox', label: 'Interactive Hands-On Sandbox', short: 'Sandbox', icon: Hand },
  { key: 'lens', label: 'The AI PM Lens', short: 'PM Lens', icon: Briefcase },
  { key: 'quiz', label: 'Knowledge Check', short: 'Quiz', icon: ListChecks },
] as const;

export default function LessonPage({ lessonId }: { lessonId: string }) {
  const { state, setLessonStep, completeLesson, uncompleteLesson, toggleBookmark, setNote } = useProgress();
  const glossary = useGlossary();
  const lesson = lessonById(lessonId);
  const [step, setStepLocal] = useState(() => state.lessonStep[lessonId] ?? 0);
  if (!lesson) return <NotFound />;
  const level = levelById(lesson.levelId)!;
  const c = COLORS[level.color];
  const done = !!state.completedLessons[lesson.id];
  const bookmarked = state.bookmarks.includes(lesson.id);
  const Sandbox = SANDBOXES[lesson.id];
  const next = nextItem(lesson.id);
  const prev = prevItem(lesson.id);
  const lessonIndex = level.lessons.findIndex((l) => l.id === lesson.id);

  const setStep = (s: number) => {
    setStepLocal(s);
    setLessonStep(lesson.id, s);
    document.getElementById('lesson-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const markDone = () => completeLesson(lesson.id, lesson.title, hrefs.lesson(lesson.id));

  return (
    <div className="space-y-5">
      <div id="lesson-top" className="scroll-mt-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <a href={hrefs.level(level.id)} className={cx('rounded-full px-2.5 py-1 font-semibold', c.chip)}>
            Level {level.id} · {level.title}
          </a>
          <span className="text-slate-400">
            Lesson {lessonIndex + 1} of {level.lessons.length}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="h-3 w-3" /> {lesson.minutes} min
          </span>
          {done && (
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Completed
            </span>
          )}
        </div>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{lesson.title}</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">{lesson.summary}</p>
          </div>
          <button
            type="button"
            onClick={() => toggleBookmark(lesson.id)}
            className={cx('shrink-0 rounded-lg p-2 transition', bookmarked ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark lesson'}
            title={bookmarked ? 'Bookmarked' : 'Bookmark'}
          >
            {bookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="sticky top-0 z-10 -mx-1 bg-slate-50/90 px-1 py-2 backdrop-blur dark:bg-slate-950/90">
        <div className="grid grid-cols-5 gap-1.5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isCur = i === step;
            const isPast = i < step;
            return (
              <button
                type="button"
                key={s.key}
                onClick={() => setStep(i)}
                className={cx(
                  'flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-2 text-center transition sm:flex-row sm:px-3 sm:text-left',
                  isCur ? 'border-indigo-500 bg-white shadow-sm dark:bg-slate-900' : isPast ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-transparent bg-white/70 hover:border-slate-200 dark:bg-slate-900/60 dark:hover:border-slate-800',
                )}
              >
                <span className={cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', isCur ? 'bg-indigo-600 text-white' : isPast ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800')}>
                  {isPast ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className="min-w-0">
                  <span className="hidden text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:block">Step {i + 1}</span>
                  <span className={cx('block text-[10px] font-semibold leading-tight sm:text-xs', isCur ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400')}>
                    <span className="sm:hidden">{s.short}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div key={step} className="animate-fade-in">
        {step === 0 && (
          <Card className="overflow-hidden" padded={false}>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 dark:from-amber-950/30 dark:to-orange-950/20">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <Lightbulb className="h-4 w-4" /> Explain like I’m new
              </div>
              <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{lesson.analogy.title}</h2>
            </div>
            <div className="space-y-5 p-5">
              <div className="prose-lite text-[15px] text-slate-700 dark:text-slate-300">
                {lesson.analogy.story.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Translating the analogy</div>
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/60">
                      <tr>
                        <th className="px-3 py-2">In everyday life…</th>
                        <th className="px-3 py-2">…in AI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lesson.analogy.mapping.map((r, i) => (
                        <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{r.everyday}</td>
                          <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{r.ai}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="rounded-xl border-l-4 border-indigo-500 bg-indigo-50 p-4 text-sm font-medium text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">In one sentence · </span>
                {lesson.analogy.oneLiner}
              </div>
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Workflow className="h-4 w-4" /> How it actually works
            </div>
            <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">Under the hood, step by step</h2>
            <StepDiagram diagram={lesson.diagram} />
          </Card>
        )}

        {step === 2 && (
          <Card>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Hand className="h-4 w-4" /> Interactive hands-on sandbox
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{lesson.sandboxTitle}</h2>
            <p className="mb-4 mt-1 text-sm text-slate-600 dark:text-slate-400">{lesson.sandboxIntro}</p>
            <Suspense fallback={<Loading label="Loading sandbox…" />}>{Sandbox ? <Sandbox /> : <p className="text-sm text-rose-600">Sandbox missing for {lesson.id}</p>}</Suspense>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              <Briefcase className="h-4 w-4" /> The AI PM lens
            </div>
            <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">What this means for you as a program manager</h2>
            <PMLensView lens={lesson.pmLens} />
          </Card>
        )}

        {step === 4 && (
          <Card>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              <ListChecks className="h-4 w-4" /> Knowledge check
            </div>
            <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Lock it in — {lesson.quiz.length} quick questions</h2>
            <Quiz lessonId={lesson.id} questions={lesson.quiz} onPassed={markDone} />
          </Card>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>
          <ChevronLeft className="h-4 w-4" /> {step > 0 ? STEPS[step - 1].short : 'Back'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)}>
            Continue to {STEPS[step + 1].label} <ChevronRight className="h-4 w-4" />
          </Button>
        ) : done ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => uncompleteLesson(lesson.id)}>
              Mark as not done
            </Button>
            {next && (
              <a href={next.kind === 'lesson' ? hrefs.lesson(next.id) : hrefs.lab(next.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Next: {next.title} <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        ) : (
          <Button variant="success" onClick={markDone}>
            <CheckCircle2 className="h-4 w-4" /> Mark lesson complete
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Tag className="h-3.5 w-3.5" /> Key terms (tap for definition)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {lesson.keyTerms.map((t) => (
              <button type="button" key={t} onClick={() => glossary.open(t)} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300">
                {t}
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <NotebookPen className="h-3.5 w-3.5" /> My notes (saved automatically)
          </div>
          <textarea
            value={state.notes[lesson.id] ?? ''}
            onChange={(e) => setNote(lesson.id, e.target.value)}
            placeholder="Jot down how this applies to your project…"
            rows={3}
            className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950"
          />
        </Card>
      </div>

      <div className="flex justify-between gap-2 border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
        {prev ? (
          <a href={prev.kind === 'lesson' ? hrefs.lesson(prev.id) : hrefs.lab(prev.id)} className="flex items-center gap-1 text-slate-500 hover:text-indigo-600">
            <ChevronLeft className="h-4 w-4" /> <span className="max-w-[16rem] truncate">{prev.title}</span>
          </a>
        ) : (
          <span />
        )}
        {next && (
          <a href={next.kind === 'lesson' ? hrefs.lesson(next.id) : hrefs.lab(next.id)} className="flex items-center gap-1 text-slate-500 hover:text-indigo-600">
            <span className="max-w-[16rem] truncate">{next.title}</span> <ChevronRight className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}
