import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Trophy } from 'lucide-react';
import type { QuizQuestion } from '../data/types';
import { useProgress } from '../store/progress';
import { Button, cx, Badge } from './ui';

export function Quiz({ lessonId, questions, onPassed }: { lessonId: string; questions: QuizQuestion[]; onPassed?: () => void }) {
  const { state, recordQuiz } = useProgress();
  const [picks, setPicks] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const record = state.quizScores[lessonId];

  const score = picks.reduce<number>((acc, p, i) => acc + (p === questions[i].answer ? 1 : 0), 0);
  const allAnswered = picks.every((p) => p !== null);

  return (
    <div className="space-y-4">
      {record && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Trophy className="h-4 w-4 text-amber-500" /> Best score: <Badge tone={record.best === record.total ? 'green' : 'amber'}>{record.best}/{record.total}</Badge>
          <span className="text-xs">({record.attempts} attempt{record.attempts === 1 ? '' : 's'})</span>
        </div>
      )}
      {questions.map((q, qi) => (
        <div key={qi} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            {qi + 1}. {q.q}
          </div>
          <div className="grid gap-2">
            {q.options.map((o, oi) => {
              const picked = picks[qi] === oi;
              const correct = q.answer === oi;
              return (
                <button
                  type="button"
                  key={oi}
                  disabled={submitted}
                  onClick={() => setPicks(picks.map((p, i) => (i === qi ? oi : p)))}
                  className={cx(
                    'flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition',
                    !submitted && picked && 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40',
                    !submitted && !picked && 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
                    submitted && correct && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
                    submitted && picked && !correct && 'border-rose-500 bg-rose-50 dark:bg-rose-950/40',
                    submitted && !picked && !correct && 'border-slate-200 opacity-60 dark:border-slate-800',
                  )}
                >
                  <span className="mt-0.5 font-mono text-xs text-slate-400">{String.fromCharCode(65 + oi)}</span>
                  <span className="flex-1 text-slate-700 dark:text-slate-200">{o}</span>
                  {submitted && correct && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                  {submitted && picked && !correct && <XCircle className="h-4 w-4 shrink-0 text-rose-500" />}
                </button>
              );
            })}
          </div>
          {submitted && (
            <p className={cx('mt-3 rounded-lg p-2.5 text-xs leading-relaxed', picks[qi] === q.answer ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200' : 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200')}>
              <strong>Why: </strong>
              {q.why}
            </p>
          )}
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        {!submitted ? (
          <Button
            disabled={!allAnswered}
            onClick={() => {
              setSubmitted(true);
              recordQuiz(lessonId, score, questions.length);
              if (score === questions.length) onPassed?.();
            }}
          >
            Check my answers
          </Button>
        ) : (
          <>
            <div className={cx('text-sm font-semibold', score === questions.length ? 'text-emerald-600' : 'text-amber-600')}>
              You scored {score}/{questions.length}
              {score === questions.length ? ' — perfect! 🎉' : ' — review the explanations and try again.'}
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setPicks(questions.map(() => null));
                setSubmitted(false);
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retry
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
