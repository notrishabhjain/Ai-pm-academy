import { cx } from './ui';

export interface Series {
  name: string;
  color: string; // hex
  points: number[];
  dashed?: boolean;
}

/** Minimal responsive SVG line chart. All series share the x index. */
export function LineChart({
  series,
  height = 200,
  xLabels,
  yFormat = (v) => String(Math.round(v)),
  markerX,
  yMax,
  className,
}: {
  series: Series[];
  height?: number;
  xLabels?: string[];
  yFormat?: (v: number) => string;
  markerX?: number;
  yMax?: number;
  className?: string;
}) {
  const W = 600;
  const H = height;
  const pad = { l: 56, r: 12, t: 12, b: 26 };
  const n = Math.max(...series.map((s) => s.points.length));
  const max = yMax ?? Math.max(1e-9, ...series.flatMap((s) => s.points)) * 1.08;
  const x = (i: number) => pad.l + (i / Math.max(1, n - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  return (
    <div className={cx('w-full', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth={1} />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
              {yFormat(t)}
            </text>
          </g>
        ))}
        {xLabels &&
          xLabels.map((lab, i) =>
            lab ? (
              <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-slate-400 text-[10px]">
                {lab}
              </text>
            ) : null,
          )}
        {markerX !== undefined && markerX >= 0 && markerX < n && (
          <line x1={x(markerX)} x2={x(markerX)} y1={pad.t} y2={H - pad.b} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
        )}
        {series.map((s) => (
          <polyline
            key={s.name}
            fill="none"
            stroke={s.color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeDasharray={s.dashed ? '6 5' : undefined}
            points={s.points.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
          />
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap gap-3 text-xs">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="h-2 w-4 rounded" style={{ background: s.color }} /> {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Vertical probability bars (used for next-token distributions). */
export function ProbBars({
  items,
  highlight,
  dimmed,
}: {
  items: { label: string; p: number; tone?: 'good' | 'bad' | 'neutral' }[];
  highlight?: number;
  dimmed?: Set<number>;
}) {
  const max = Math.max(0.0001, ...items.map((i) => i.p));
  return (
    <div className="flex h-48 items-end gap-2 overflow-x-auto pb-1">
      {items.map((it, i) => {
        const tone = it.tone === 'good' ? 'bg-emerald-500' : it.tone === 'bad' ? 'bg-rose-500' : 'bg-indigo-500';
        return (
          <div key={i} className={cx('flex min-w-[56px] flex-1 flex-col items-center gap-1 transition-opacity', dimmed?.has(i) && 'opacity-30')}>
            <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">{(it.p * 100).toFixed(it.p < 0.1 ? 1 : 0)}%</span>
            <div className="flex h-36 w-full items-end">
              <div
                className={cx('w-full rounded-t-md transition-all duration-500', tone, highlight === i && 'ring-4 ring-amber-400')}
                style={{ height: `${Math.max(2, (it.p / max) * 100)}%` }}
              />
            </div>
            <span className="max-w-[80px] truncate text-center text-[11px] font-medium text-slate-700 dark:text-slate-300" title={it.label}>
              {it.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
