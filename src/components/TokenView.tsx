import type { Token } from '../lib/tokenizer';
import { TOKEN_COLORS } from '../lib/tokenizer';
import { cx } from './ui';

/** Renders tokens as colour-coded blocks. Spaces are shown as faint dots so boundaries are visible. */
export function TokenView({ tokens, showIds = false, max = 600 }: { tokens: Token[]; showIds?: boolean; max?: number }) {
  const shown = tokens.slice(0, max);
  return (
    <div className="flex flex-wrap items-end gap-y-1.5 font-mono text-[13px] leading-6">
      {shown.map((t, i) => {
        if (t.text === '\n') return <span key={i} className="basis-full" />;
        const display = t.text === '​' ? '+byte' : t.text.replace(/ /g, '·');
        return (
          <span key={i} className="inline-flex flex-col items-center" title={`Token #${i + 1} · id ${t.id} · ${t.kind}`}>
            <span className={cx('whitespace-pre rounded-[4px] px-[3px]', t.kind === 'space' ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : TOKEN_COLORS[i % TOKEN_COLORS.length])}>{display}</span>
            {showIds && <span className="text-[9px] text-slate-400">{t.id}</span>}
          </span>
        );
      })}
      {tokens.length > max && <span className="ml-2 text-xs text-slate-500">…and {tokens.length - max} more tokens</span>}
    </div>
  );
}
