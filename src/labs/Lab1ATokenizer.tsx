import { useEffect, useMemo, useState } from 'react';
import { Hash, Eraser, Info } from 'lucide-react';
import { Badge, Callout, Card, Missions, SectionLabel, Slider, Stat, Toggle, cx } from '../components/ui';
import { TokenView } from '../components/TokenView';
import { countWords, tokenize, type TokenKind } from '../lib/tokenizer';
import { MODEL_TIERS } from '../data/models';
import { inr, inrShort, num, usd } from '../lib/format';
import { useLabData, useProgress } from '../store/progress';

const SAMPLES: { label: string; text: string }[] = [
  {
    label: 'Citizen email',
    text: 'Dear Sir/Madam,\nI applied for renewal of my driving licence on 14 August 2026 (application no. DL-2026-0083341). It has been more than 60 days and the status still shows "Under Process". Kindly expedite, as I need it for my new job in Bengaluru.\nRegards,\nPriya Raghunathan',
  },
  { label: 'Hindi', text: 'नमस्ते, मैंने 14 अगस्त को अपने ड्राइविंग लाइसेंस के नवीनीकरण के लिए आवेदन किया था। 60 दिन से अधिक हो गए हैं और स्थिति अभी भी "प्रक्रिया में" दिखा रही है। कृपया जल्दी करें।' },
  { label: 'Hinglish', text: 'Sir mera DL renewal 14 Aug ko apply kiya tha, 60 din ho gaye, abhi bhi "Under Process" dikha raha hai. Please jaldi karo, nayi job join karni hai.' },
  { label: 'JSON payload', text: '{"application_id": "DL-2026-0083341", "applicant": {"name": "Priya Raghunathan", "dob": "1994-03-18"}, "status": "UNDER_PROCESS", "days_pending": 63, "office": "RTO Bengaluru Central"}' },
  { label: 'Legal clause', text: 'Notwithstanding anything contained in sub-section (2), the appropriate Government may, by notification, exempt any class of establishments from the provisions of this Chapter, subject to such conditions and restrictions as may be specified therein.' },
  { label: 'Emoji & URL', text: 'Loved the new portal 😍🎉! Track here: https://portal.example.gov.in/track?id=DL-2026-0083341&lang=en' },
];

const KIND_LABEL: Record<TokenKind, string> = { word: 'Whole words', subword: 'Word fragments', number: 'Number chunks', punct: 'Punctuation', space: 'Whitespace', script: 'Indic/other script', emoji: 'Emoji bytes' };
const KIND_COLOR: Record<TokenKind, string> = { word: 'bg-indigo-500', subword: 'bg-amber-500', number: 'bg-sky-500', punct: 'bg-slate-400', space: 'bg-slate-300', script: 'bg-violet-500', emoji: 'bg-pink-500' };

export default function Lab1ATokenizer() {
  const { state } = useProgress();
  const fx = state.settings.fxRate;
  const [text, setText] = useLabData('lab-1a:text', SAMPLES[0].text);
  const [showIds, setShowIds] = useState(false);
  const [monthly, setMonthly] = useState(100000);
  const [triedHindi, setTriedHindi] = useState(false);

  const tokens = useMemo(() => tokenize(text), [text]);
  const words = countWords(text);
  const chars = text.length;
  const byKind = tokens.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.kind]: (acc[t.kind] ?? 0) + 1 }), {});
  const groupSizes = tokens.reduce<Record<number, { n: number; text: string }>>((acc, t) => {
    if (t.kind === 'space' || t.kind === 'punct') return acc;
    acc[t.group] = { n: (acc[t.group]?.n ?? 0) + 1, text: (acc[t.group]?.text ?? '') + t.text };
    return acc;
  }, {});
  const longest = Object.values(groupSizes).sort((a, b) => b.n - a.n)[0];
  const hasScript = (byKind.script ?? 0) > 0;
  useEffect(() => {
    if (hasScript) setTriedHindi(true);
  }, [hasScript]);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <SectionLabel className="mb-0">Type or paste any text</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLES.map((s) => (
                  <button type="button" key={s.label} onClick={() => setText(s.text)} className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs hover:border-indigo-400 dark:border-slate-700">
                    {s.label}
                  </button>
                ))}
                <button type="button" onClick={() => setText('')} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Eraser className="h-3 w-3" /> Clear
                </button>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Paste an email, a policy clause, a JSON payload, Hindi text…"
              className="w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </Card>
          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <SectionLabel className="mb-0">How the model sees it — {num(tokens.length)} tokens</SectionLabel>
              <div className="w-56">
                <Toggle label="Show token IDs" checked={showIds} onChange={setShowIds} hint="The numbers the model actually reads" />
              </div>
            </div>
            {tokens.length === 0 ? <p className="text-sm text-slate-500">Start typing to see tokens appear in real time.</p> : <TokenView tokens={tokens} showIds={showIds} />}
            <div className="mt-4">
              <div className="mb-1 text-xs font-semibold text-slate-500">Token mix</div>
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                {(Object.keys(KIND_LABEL) as TokenKind[]).map((k) => (byKind[k] ? <div key={k} className={KIND_COLOR[k]} style={{ width: `${(byKind[k] / tokens.length) * 100}%` }} title={`${KIND_LABEL[k]}: ${byKind[k]}`} /> : null))}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                {(Object.keys(KIND_LABEL) as TokenKind[]).map((k) =>
                  byKind[k] ? (
                    <span key={k} className="flex items-center gap-1">
                      <span className={cx('h-2 w-2 rounded', KIND_COLOR[k])} /> {KIND_LABEL[k]}: {byKind[k]}
                    </span>
                  ) : null,
                )}
              </div>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Tokens" value={num(tokens.length)} />
            <Stat label="Words" value={num(words)} />
            <Stat label="Characters" value={num(chars)} />
            <Stat label="Chars / token" value={tokens.length ? (chars / tokens.length).toFixed(2) : '—'} sub="English ≈ 4" tone={tokens.length && chars / tokens.length < 3 ? 'text-rose-600' : undefined} />
            <Stat label="Tokens / word" value={words ? (tokens.length / words).toFixed(2) : '—'} sub="English ≈ 1.3" />
            <Stat label="Most-split word" value={longest ? `${longest.n} tokens` : '—'} sub={longest ? `“${longest.text.trim().slice(0, 18)}”` : undefined} />
          </div>
          {hasScript && (
            <Callout tone="warn" title="Token tax detected">
              Non-Latin script uses ~{tokens.length && chars ? (chars / tokens.length).toFixed(1) : '?'} characters per token vs ~4 for English — so the same message costs more and generates slower.
            </Callout>
          )}
          <Card className="bg-slate-50 dark:bg-slate-950/40">
            <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              This is a teaching tokenizer that mimics production BPE tokenizers. Real counts vary by model (often ±10–20% for English, more for Indic languages) — always measure with your vendor’s tokenizer.
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel className="mb-0">Cost comparison across model tiers</SectionLabel>
            <p className="text-xs text-slate-500">If this text is the prompt (input) — or if the model writes it (output) — what does it cost?</p>
          </div>
          <div className="w-72">
            <Slider label="Requests per month" value={monthly} min={1000} max={5000000} step={1000} onChange={setMonthly} format={(v) => num(v)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-2 pr-3">Model tier</th>
                <th className="py-2 pr-3">Price / 1M (in · out)</th>
                <th className="py-2 pr-3">As input, per call</th>
                <th className="py-2 pr-3">As output, per call</th>
                <th className="py-2 pr-3">Monthly as input</th>
                <th className="py-2">Monthly as output</th>
              </tr>
            </thead>
            <tbody>
              {MODEL_TIERS.map((t) => {
                const inUsd = (tokens.length / 1e6) * t.inputPerM;
                const outUsd = ((tokens.length * (1 + t.thinkingMultiplier)) / 1e6) * t.outputPerM;
                return (
                  <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800/60">
                    <td className="py-2 pr-3">
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-[11px] text-slate-500">{t.examples}</div>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      ${t.inputPerM} · ${t.outputPerM}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {usd(inUsd)} <span className="text-slate-400">({inr(inUsd * fx)})</span>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {usd(outUsd)} <span className="text-slate-400">({inr(outUsd * fx)})</span>
                      {t.thinkingMultiplier > 0 && <Badge tone="amber" className="ml-1">+thinking</Badge>}
                    </td>
                    <td className="py-2 pr-3 font-semibold">{inrShort(inUsd * fx * monthly)}</td>
                    <td className="py-2 font-semibold">{inrShort(outUsd * fx * monthly)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
          <Hash className="h-3 w-3" /> Illustrative list prices; ₹{fx}/$. The same text costs ~{(MODEL_TIERS[2].outputPerM / MODEL_TIERS[0].inputPerM).toFixed(0)}× more as frontier output than as small-model input.
        </p>
      </Card>

      <Missions
        labId="lab-1a"
        missions={[
          { id: 'long', label: 'Analyse a text longer than 200 characters', done: chars > 200 },
          { id: 'indic', label: 'Tokenize Hindi or another Indic script and spot the token tax', done: triedHindi },
          { id: 'split', label: 'Find a single word that splits into 3 or more tokens', done: (longest?.n ?? 0) >= 3 },
          { id: 'ids', label: 'Switch on token IDs to see what the model actually reads', done: showIds },
        ]}
      />
    </div>
  );
}
