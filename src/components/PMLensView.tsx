import { useState } from 'react';
import { Briefcase, Coins, MessageSquareMore, ShieldAlert, CheckSquare, Square, Copy, Check } from 'lucide-react';
import type { PMLens } from '../data/types';
import { cx } from './ui';

function Checklist({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  return (
    <ul className="space-y-2">
      {items.map((it, i) => {
        const on = checked.has(i);
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => {
                const n = new Set(checked);
                if (on) n.delete(i);
                else n.add(i);
                setChecked(n);
              }}
              className="flex w-full items-start gap-2 text-left text-sm"
            >
              {on ? <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <Square className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
              <span className={cx('leading-relaxed', on ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200')}>{it}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function PMLensView({ lens }: { lens: PMLens }) {
  const [copied, setCopied] = useState(false);
  const blocks = [
    { title: 'When to use it', icon: Briefcase, items: lens.whenToUse, cls: 'border-sky-200 dark:border-sky-900', head: 'text-sky-700 dark:text-sky-300' },
    { title: 'Cost & latency impact', icon: Coins, items: lens.costLatency, cls: 'border-amber-200 dark:border-amber-900', head: 'text-amber-700 dark:text-amber-300' },
    { title: 'Failure modes to watch', icon: ShieldAlert, items: lens.failureModes, cls: 'border-rose-200 dark:border-rose-900', head: 'text-rose-700 dark:text-rose-300' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {blocks.map((b) => (
          <div key={b.title} className={cx('rounded-xl border-2 bg-white p-4 dark:bg-slate-900', b.cls)}>
            <div className={cx('mb-3 flex items-center gap-2 text-sm font-bold', b.head)}>
              <b.icon className="h-4 w-4" /> {b.title}
            </div>
            <Checklist items={b.items} />
          </div>
        ))}
      </div>
      <div className="rounded-xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 dark:border-indigo-800 dark:from-indigo-950/50 dark:to-violet-950/30">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-indigo-800 dark:text-indigo-200">
            <MessageSquareMore className="h-4 w-4" /> 3 questions to ask your engineers in standup / design review
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(lens.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')).catch(() => undefined);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-white/60 dark:text-indigo-300 dark:hover:bg-slate-900/60"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <ol className="space-y-2">
          {lens.questions.map((q, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">{i + 1}</span>
              <span className="pt-0.5 font-medium leading-relaxed text-slate-800 dark:text-slate-100">“{q}”</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
