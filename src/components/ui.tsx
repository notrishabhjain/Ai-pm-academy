import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { CheckCircle2, Circle, Info, Lightbulb, Target, TriangleAlert, OctagonX } from 'lucide-react';
import { useProgress } from '../store/progress';
import { scoreTone } from '../lib/colors';
import { labById } from '../data/curriculum';
import { hrefs } from '../lib/router';

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function Card({ children, className, padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={cx('rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900', padded && 'p-5', className)}>
      {children}
    </div>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' }) {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:bg-indigo-300 dark:disabled:bg-indigo-900',
    secondary:
      'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  };
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm',
        v[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-indigo-700 dark:bg-slate-800 dark:text-indigo-300">
          {format ? format(value) : value}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </label>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-lg p-1 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
    >
      <span className={cx('relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition', checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600')}>
        <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition', checked ? 'left-4' : 'left-0.5')} />
      </span>
      <span>
        <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        {hint && <span className="block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      </span>
    </button>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      {options.map((o) => (
        <button
          type="button"
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-lg font-medium transition',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
            o.value === value
              ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-300'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Badge({ children, tone = 'slate', className }: { children: ReactNode; tone?: 'slate' | 'green' | 'red' | 'amber' | 'indigo' | 'blue'; className?: string }) {
  const t = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    red: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    blue: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
  }[tone];
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', t, className)}>{children}</span>;
}

export function ProgressBar({ value, className, barClass }: { value: number; className?: string; barClass?: string }) {
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', className)}>
      <div className={cx('h-full rounded-full transition-all duration-500', barClass ?? 'bg-indigo-500')} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/** Horizontal labelled meter, 0–100. `invert` makes high values red (e.g. risk). */
export function Meter({ label, value, invert = false, suffix = '', detail }: { label: string; value: number; invert?: boolean; suffix?: string; detail?: string }) {
  const tone = scoreTone(invert ? 100 - value : value);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-400">{label}</span>
        <span className={cx('font-mono font-semibold', tone.text)}>
          {Math.round(value)}
          {suffix}
        </span>
      </div>
      <ProgressBar value={value} barClass={tone.bar} />
      {detail && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{detail}</p>}
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className={cx('mt-0.5 text-xl font-bold text-slate-900 dark:text-white', tone)}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</div>}
    </div>
  );
}

export function Callout({ tone = 'info', title, children }: { tone?: 'info' | 'tip' | 'warn' | 'danger' | 'success'; title?: string; children: ReactNode }) {
  const cfg = {
    info: { cls: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100', Icon: Info },
    tip: { cls: 'border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100', Icon: Lightbulb },
    warn: { cls: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100', Icon: TriangleAlert },
    danger: { cls: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100', Icon: OctagonX },
    success: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100', Icon: CheckCircle2 },
  }[tone];
  const { Icon } = cfg;
  return (
    <div className={cx('flex gap-3 rounded-xl border p-3 text-sm', cfg.cls)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title && <div className="mb-0.5 font-semibold">{title}</div>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cx('mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400', className)}>{children}</h3>;
}

export interface Mission {
  id: string;
  label: string;
  done: boolean;
}

/**
 * Lab "missions": auto-detected goals that turn free play into deliberate practice.
 * Whenever a mission's `done` flips true it is persisted; the lab score is the share completed
 * (unless the lab passes its own `score`).
 */
export function Missions({ labId, missions, score, title = 'Lab missions' }: { labId: string; missions: Mission[]; score?: number; title?: string }) {
  const { state, completeMission, setLabScore } = useProgress();
  const doneIds = state.labMissions[labId] ?? [];
  const doneKey = missions.map((m) => (m.done ? '1' : '0')).join('');

  useEffect(() => {
    missions.forEach((m) => {
      if (m.done && !doneIds.includes(m.id)) completeMission(labId, m.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneKey]);

  const completed = missions.filter((m) => m.done || doneIds.includes(m.id)).length;
  const computed = score ?? (completed / missions.length) * 100;

  useEffect(() => {
    const meta = labById(labId);
    if (computed > 0) setLabScore(labId, computed, meta ? `${meta.code} · ${meta.title}` : labId, hrefs.lab(labId));
  }, [computed, labId, setLabScore]);

  const best = state.labScores[labId] ?? 0;
  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white dark:border-indigo-900 dark:from-indigo-950/40 dark:to-slate-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-200">
          <Target className="h-4 w-4" /> {title}
        </div>
        <Badge tone={best >= 80 ? 'green' : best >= 40 ? 'amber' : 'slate'}>Best lab score {best}%</Badge>
      </div>
      <ul className="space-y-1.5">
        {missions.map((m) => {
          const done = m.done || doneIds.includes(m.id);
          return (
            <li key={m.id} className="flex items-start gap-2 text-sm">
              {done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
              <span className={cx(done ? 'text-slate-500 line-through decoration-emerald-500/60 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200')}>{m.label}</span>
            </li>
          );
        })}
      </ul>
      <ProgressBar value={(completed / missions.length) * 100} className="mt-3" barClass="bg-indigo-500" />
    </Card>
  );
}

/** Simple vertical bar used in many sandboxes. */
export function HBar({ label, value, max = 100, color = 'bg-indigo-500', right }: { label: ReactNode; value: number; max?: number; color?: string; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="w-28 shrink-0 truncate text-slate-600 dark:text-slate-400">{label}</div>
      <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
        <div className={cx('h-full rounded transition-all duration-500', color)} style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
      </div>
      <div className="w-16 shrink-0 text-right font-mono text-slate-700 dark:text-slate-300">{right ?? Math.round(value)}</div>
    </div>
  );
}
