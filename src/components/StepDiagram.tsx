import { Fragment, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, ArrowRight, ArrowDown, Repeat, Check } from 'lucide-react';
import type { Diagram } from '../data/types';
import { Button, cx } from './ui';

/** Data-driven, step-through flow diagram used in every lesson's "How It Actually Works" card. */
export function StepDiagram({ diagram }: { diagram: Diagram }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const total = diagram.steps.length;
  const cur = diagram.steps[step];

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (step < total - 1) setStep(step + 1);
      else setPlaying(false);
    }, 2600);
    return () => clearTimeout(t);
  }, [playing, step, total]);

  // Nodes that were active in an earlier step are shown as "visited".
  const visited = new Set(diagram.steps.slice(0, step).flatMap((s) => s.active));
  const active = new Set(cur.active);

  return (
    <div>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{diagram.caption}</p>

      <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
        <div className="flex flex-col items-stretch gap-2 md:flex-row md:flex-wrap md:items-center md:justify-center">
          {diagram.nodes.map((n, i) => {
            const isActive = active.has(n.id);
            const wasVisited = visited.has(n.id) && !isActive;
            const Icon = n.icon;
            return (
              <Fragment key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    const idx = diagram.steps.findIndex((s) => s.active.includes(n.id));
                    if (idx >= 0) {
                      setPlaying(false);
                      setStep(idx);
                    }
                  }}
                  className={cx(
                    'relative flex min-w-[118px] items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition-all duration-300 md:flex-col md:text-center',
                    isActive
                      ? 'scale-[1.04] border-indigo-500 bg-white shadow-lg shadow-indigo-500/20 dark:bg-slate-900'
                      : wasVisited
                        ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30'
                        : 'border-slate-200 bg-white opacity-70 dark:border-slate-800 dark:bg-slate-900',
                  )}
                >
                  {isActive && <span className="absolute -inset-0.5 -z-0 animate-pulse rounded-xl ring-2 ring-indigo-400/40" />}
                  <span
                    className={cx(
                      'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      isActive ? 'bg-indigo-600 text-white' : wasVisited ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800',
                    )}
                  >
                    {wasVisited ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span className="relative">
                    <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">{n.label}</span>
                    {n.sub && <span className="block text-[10px] leading-tight text-slate-500 dark:text-slate-400">{n.sub}</span>}
                  </span>
                </button>
                {i < diagram.nodes.length - 1 && (
                  <span className={cx('flex justify-center transition-colors', visited.has(n.id) || active.has(n.id) ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-700')}>
                    <ArrowRight className="hidden h-5 w-5 md:block" />
                    <ArrowDown className="h-4 w-4 md:hidden" />
                  </span>
                )}
              </Fragment>
            );
          })}
        </div>
        {diagram.loop && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
            <Repeat className="h-3.5 w-3.5" /> loops back until the goal is met or a stop condition fires
          </div>
        )}
      </div>

      <div key={step} className="mt-4 animate-fade-in rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Step {step + 1} of {total}
        </div>
        <div className="mb-1.5 font-semibold text-slate-900 dark:text-white">{cur.title}</div>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{cur.body}</p>
        {cur.peek && (
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 font-mono text-xs leading-relaxed text-emerald-300 dark:bg-black/60">{cur.peek}</pre>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {diagram.steps.map((_, i) => (
            <button
              type="button"
              key={i}
              aria-label={`Go to step ${i + 1}`}
              onClick={() => {
                setPlaying(false);
                setStep(i);
              }}
              className={cx('h-2.5 rounded-full transition-all', i === step ? 'w-6 bg-indigo-600' : i < step ? 'w-2.5 bg-emerald-400' : 'w-2.5 bg-slate-300 dark:bg-slate-700')}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setPlaying(false); setStep(0); }}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
          <Button variant="secondary" size="sm" disabled={step === 0} onClick={() => { setPlaying(false); setStep(step - 1); }}>
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { if (step === total - 1) setStep(0); setPlaying(!playing); }}>
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {playing ? 'Pause' : 'Auto-play'}
          </Button>
          <Button size="sm" disabled={step === total - 1} onClick={() => { setPlaying(false); setStep(step + 1); }}>
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
