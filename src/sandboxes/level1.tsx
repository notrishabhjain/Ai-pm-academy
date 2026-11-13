import { useMemo, useState } from 'react';
import { Equal, Minus, Plus, ShieldCheck, ShieldOff, BookOpenCheck } from 'lucide-react';
import { Badge, Callout, Card, HBar, Meter, Segmented, Slider, Stat, Toggle, cx } from '../components/ui';
import { LineChart, ProbBars } from '../components/charts';
import { TokenView } from '../components/TokenView';
import { countWords, tokenize } from '../lib/tokenizer';
import { cosine, entropy, softmax } from '../lib/math';
import { num, usd } from '../lib/format';

/* ------------------------------------------------------------------ */
/* Lesson 1.1 — Token split by category                               */
/* ------------------------------------------------------------------ */

const SAMPLES = {
  english: { label: 'Everyday English', text: 'Please update the status of my passport application. I submitted the form last week and have not received any reply.' },
  names: { label: 'Rare names & places', text: 'Thiruvananthapuram, Visakhapatnam and Tiruchirappalli municipal corporations announced reimbursements.' },
  ids: { label: 'IDs & numbers', text: 'Application ID APL-2026-0049187231, PAN ABCDE1234F, amount ₹1,45,67,890 dated 14/10/2026.' },
  hindi: { label: 'Hindi (same meaning)', text: 'कृपया मेरे पासपोर्ट आवेदन की स्थिति अपडेट करें। मैंने पिछले सप्ताह फॉर्म जमा किया था और कोई जवाब नहीं मिला।' },
  json: { label: 'JSON payload', text: '{"applicant_id": "APL-2026-0049187231", "status": "PENDING_VERIFICATION", "department": "Passport Seva"}' },
} as const;
type SampleKey = keyof typeof SAMPLES;

export function TokenSplitSandbox() {
  const [key, setKey] = useState<SampleKey>('english');
  const text = SAMPLES[key].text;
  const tokens = useMemo(() => tokenize(text), [text]);
  const nonSpace = tokens.filter((t) => t.kind !== 'space').length;
  const words = countWords(text);
  const all = (Object.keys(SAMPLES) as SampleKey[]).map((k) => {
    const t = SAMPLES[k].text;
    const tk = tokenize(t).length;
    return { k, label: SAMPLES[k].label, tpw: tk / Math.max(1, countWords(t)), cpt: t.length / Math.max(1, tk) };
  });
  const englishTokens = tokenize(SAMPLES.english.text).length;
  const hindiTokens = tokenize(SAMPLES.hindi.text).length;

  return (
    <div className="space-y-4">
      <Segmented value={key} onChange={setKey} options={(Object.keys(SAMPLES) as SampleKey[]).map((k) => ({ value: k, label: SAMPLES[k].label }))} size="sm" />
      <Card className="bg-slate-50 dark:bg-slate-950/40">
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">“{text}”</p>
        <TokenView tokens={tokens} />
      </Card>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Tokens" value={tokens.length} sub={`${nonSpace} non-space`} />
        <Stat label="Words" value={words} />
        <Stat label="Tokens per word" value={(tokens.length / Math.max(1, words)).toFixed(2)} tone={tokens.length / words > 2 ? 'text-rose-600' : 'text-emerald-600'} />
        <Stat label="Chars per token" value={(text.length / Math.max(1, tokens.length)).toFixed(1)} sub="English ≈ 4" />
      </div>
      <div className="space-y-1.5">
        <div className="text-xs font-semibold text-slate-500">Tokens per word, by kind of text</div>
        {all.map((a) => (
          <HBar key={a.k} label={a.label} value={a.tpw} max={4} right={a.tpw.toFixed(2)} color={a.k === key ? 'bg-indigo-500' : 'bg-slate-400 dark:bg-slate-600'} />
        ))}
      </div>
      <Callout tone="warn" title="The token tax">
        The Hindi sentence carries the same meaning as the English one but uses <strong>{hindiTokens}</strong> tokens vs <strong>{englishTokens}</strong> — about{' '}
        <strong>{(hindiTokens / englishTokens).toFixed(1)}×</strong> the cost and generation time. Always measure token counts on real samples in every language you support.
      </Callout>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson 1.2 — Vector arithmetic                                      */
/* ------------------------------------------------------------------ */

const DIMS = ['Royalty', 'Male', 'Female', 'Young', 'Capital city', 'Country', 'India', 'Japan', 'France'];
const VOCAB: Record<string, number[]> = {
  King: [0.95, 0.9, 0.05, 0, 0, 0, 0, 0, 0],
  Queen: [0.95, 0.05, 0.9, 0, 0, 0, 0, 0, 0],
  Man: [0.05, 0.9, 0.05, 0, 0, 0, 0, 0, 0],
  Woman: [0.05, 0.05, 0.9, 0, 0, 0, 0, 0, 0],
  Prince: [0.8, 0.85, 0.05, 0.9, 0, 0, 0, 0, 0],
  Princess: [0.8, 0.05, 0.85, 0.9, 0, 0, 0, 0, 0],
  India: [0, 0, 0, 0, 0, 0.95, 0.95, 0, 0],
  Delhi: [0, 0, 0, 0, 0.95, 0.1, 0.9, 0, 0],
  Mumbai: [0, 0, 0, 0, 0.35, 0.05, 0.9, 0, 0],
  Japan: [0, 0, 0, 0, 0, 0.95, 0, 0.95, 0],
  Tokyo: [0, 0, 0, 0, 0.95, 0.1, 0, 0.9, 0],
  Osaka: [0, 0, 0, 0, 0.35, 0.05, 0, 0.9, 0],
  France: [0, 0, 0, 0, 0, 0.95, 0, 0, 0.95],
  Paris: [0, 0, 0, 0, 0.95, 0.1, 0, 0, 0.9],
};
const WORDS = Object.keys(VOCAB);
const PRESETS: [string, string, string][] = [
  ['King', 'Man', 'Woman'],
  ['Delhi', 'India', 'Japan'],
  ['Paris', 'France', 'India'],
  ['Tokyo', 'Japan', 'France'],
  ['Princess', 'Woman', 'Man'],
];

function VecBars({ v, label }: { v: number[]; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-2 dark:border-slate-800">
      <div className="mb-1 text-center text-xs font-bold">{label}</div>
      <div className="flex h-16 items-end gap-0.5">
        {v.map((x, i) => (
          <div key={i} title={`${DIMS[i]}: ${x.toFixed(2)}`} className="flex h-full flex-1 flex-col justify-end">
            <div className={cx('rounded-t', x >= 0 ? 'bg-indigo-500' : 'bg-rose-500')} style={{ height: `${Math.min(100, Math.abs(x) * 100)}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function VectorArithmeticSandbox() {
  const [a, setA] = useState('King');
  const [b, setB] = useState('Man');
  const [c, setC] = useState('Woman');
  const result = VOCAB[a].map((x, i) => x - VOCAB[b][i] + VOCAB[c][i]);
  const ranked = WORDS.filter((w) => ![a, b, c].includes(w))
    .map((w) => ({ w, s: cosine(result, VOCAB[w]) }))
    .sort((x, y) => y.s - x.s);
  const select = (val: string, set: (v: string) => void) => (
    <select value={val} onChange={(e) => set(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900">
      {WORDS.map((w) => (
        <option key={w}>{w}</option>
      ))}
    </select>
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(([x, y, z]) => (
          <button
            type="button"
            key={x + y + z}
            onClick={() => {
              setA(x);
              setB(y);
              setC(z);
            }}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium hover:border-indigo-400 dark:border-slate-700"
          >
            {x} − {y} + {z}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-lg font-bold">
        {select(a, setA)} <Minus className="h-5 w-5 text-slate-400" /> {select(b, setB)} <Plus className="h-5 w-5 text-slate-400" /> {select(c, setC)} <Equal className="h-5 w-5 text-slate-400" />
        <span className="rounded-lg bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">{ranked[0].w}</span>
        <span className="text-sm font-normal text-slate-500">(cosine {ranked[0].s.toFixed(2)})</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <VecBars v={VOCAB[a]} label={a} />
        <VecBars v={VOCAB[b].map((x) => -x)} label={`− ${b}`} />
        <VecBars v={VOCAB[c]} label={`+ ${c}`} />
        <VecBars v={result} label="= result" />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
        Dimensions (left → right):{' '}
        {DIMS.map((d, i) => (
          <span key={d}>
            {i + 1}. {d}
          </span>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="text-xs font-semibold text-slate-500">Nearest words to the result (cosine similarity)</div>
        {ranked.slice(0, 5).map((r, i) => (
          <HBar key={r.w} label={r.w} value={Math.max(0, r.s) * 100} right={r.s.toFixed(2)} color={i === 0 ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'} />
        ))}
      </div>
      <Callout tone="tip">
        Real embeddings have ~1,000+ dimensions that nobody labelled by hand — the model discovered directions like “royalty” or “capital-of” on its own from text. That is why semantic search can match “head of state residence in Japan” to “Tokyo Imperial Palace”.
      </Callout>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson 1.3 — Context budget + lost in the middle                    */
/* ------------------------------------------------------------------ */

const WINDOWS = [8000, 32000, 128000, 1000000];

export function LostInMiddleSandbox() {
  const [windowSize, setWindowSize] = useState(32000);
  const [sys, setSys] = useState(2000);
  const [turns, setTurns] = useState(12);
  const [docs, setDocs] = useState(8);
  const [output, setOutput] = useState(1500);
  const [pos, setPos] = useState(50);
  const [ctxLen, setCtxLen] = useState(64);

  const hist = turns * 450;
  const docTokens = docs * 900;
  const total = sys + hist + docTokens + output;
  const overflow = Math.max(0, total - windowSize);
  const parts = [
    { name: 'System prompt', v: sys, c: 'bg-indigo-500' },
    { name: 'Chat history', v: hist, c: 'bg-sky-500' },
    { name: 'Retrieved docs', v: docTokens, c: 'bg-amber-500' },
    { name: 'Answer (output)', v: output, c: 'bg-emerald-500' },
  ];
  const scale = Math.max(total, windowSize);

  // U-shaped recall curve; deeper dip for longer contexts.
  const recall = (p: number, lenK: number) => {
    const depth = Math.min(0.45, (Math.log2(Math.max(1, lenK)) / 7) * 0.45);
    return (0.98 - depth * Math.sin(Math.PI * (p / 100)) ** 1.5) * 100;
  };
  const curve = Array.from({ length: 21 }, (_, i) => recall(i * 5, ctxLen));
  const r = recall(pos, ctxLen);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 text-sm font-bold">Part 1 · Fill the context window</div>
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <Card className="space-y-3 bg-slate-50 dark:bg-slate-950/40">
            <div>
              <div className="mb-1.5 text-sm font-medium">Model context window</div>
              <Segmented size="sm" value={windowSize} onChange={setWindowSize} options={WINDOWS.map((w) => ({ value: w, label: w >= 1e6 ? '1M' : `${w / 1000}k` }))} />
            </div>
            <Slider label="System prompt" value={sys} min={200} max={8000} step={100} onChange={setSys} format={(v) => `${num(v)} tok`} />
            <Slider label="Chat turns so far" value={turns} min={0} max={60} onChange={setTurns} format={(v) => `${v} (~${num(v * 450)} tok)`} />
            <Slider label="Retrieved document chunks" value={docs} min={0} max={60} onChange={setDocs} format={(v) => `${v} (~${num(v * 900)} tok)`} />
            <Slider label="Reserved for answer" value={output} min={200} max={8000} step={100} onChange={setOutput} format={(v) => `${num(v)} tok`} />
          </Card>
          <div className="space-y-3">
            <div className="relative h-12 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
              <div className="flex h-full">
                {parts.map((p) => (
                  <div key={p.name} className={cx('h-full transition-all duration-500', p.c)} style={{ width: `${(p.v / scale) * 100}%` }} title={`${p.name}: ${num(p.v)}`} />
                ))}
              </div>
              <div className="absolute inset-y-0 border-r-4 border-dashed border-rose-600" style={{ left: `${(windowSize / scale) * 100}%` }} />
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              {parts.map((p) => (
                <span key={p.name} className="flex items-center gap-1.5">
                  <span className={cx('h-2.5 w-2.5 rounded', p.c)} /> {p.name}: {num(p.v)}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="h-2.5 w-1 bg-rose-600" /> window limit
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Stat label="Total needed" value={`${num(total)} tok`} />
              <Stat label="Window used" value={`${Math.min(100, (total / windowSize) * 100).toFixed(0)}%`} tone={overflow ? 'text-rose-600' : 'text-emerald-600'} />
              <Stat label="Input cost / call" value={usd(((total - output) / 1e6) * 3)} sub="@ $3 / 1M input" />
            </div>
            {overflow > 0 ? (
              <Callout tone="danger" title={`Overflow: ${num(overflow)} tokens don’t fit`}>
                The app must drop something. Typical default: the oldest chat turns are silently removed — the assistant “forgets” what the user said earlier. Better: summarise history, retrieve fewer but better chunks, or trim the system prompt.
              </Callout>
            ) : (
              <Callout tone="info">Everything fits. But remember: every token here is billed on every call, and more context also increases time-to-first-token.</Callout>
            )}
          </div>
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-bold">Part 2 · Bury a critical fact</div>
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <Card className="space-y-3 bg-slate-50 dark:bg-slate-950/40">
            <Slider label="Where the key fact sits" value={pos} min={0} max={100} onChange={setPos} format={(v) => (v < 15 ? `Start (${v}%)` : v > 85 ? `End (${v}%)` : `Middle (${v}%)`)} />
            <Slider label="Total context length" value={ctxLen} min={2} max={128} onChange={setCtxLen} format={(v) => `${v}k tokens`} />
            <Meter label="Chance the model uses the fact" value={r} suffix="%" />
          </Card>
          <div>
            <LineChart
              series={[{ name: `Recall vs. fact position (${ctxLen}k-token context, illustrative)`, color: '#8b5cf6', points: curve }]}
              xLabels={curve.map((_, i) => (i % 5 === 0 ? `${i * 5}%` : ''))}
              yMax={100}
              yFormat={(v) => `${Math.round(v)}%`}
              markerX={Math.round(pos / 5)}
            />
            <Callout tone={r < 75 ? 'warn' : 'success'}>
              {r < 75
                ? 'Lost in the middle: the fact is in the window, but buried among thousands of tokens it is easily ignored. Retrieve fewer, more relevant chunks, and put key instructions at the start and end.'
                : 'Short contexts or facts near the edges are recalled reliably. Keep contexts lean on purpose.'}
            </Callout>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson 1.4 — Confidence is not correctness                          */
/* ------------------------------------------------------------------ */

export function ConfidenceSandbox() {
  const [freq, setFreq] = useState(10);
  const [grounded, setGrounded] = useState(false);
  const [abstain, setAbstain] = useState(false);

  const candidates = ['₹2,500', '₹5,000', '₹10,000', '₹25,000', 'Not in my sources'];
  const correctIdx = 0;
  const logits = useMemo(() => {
    const knowledge = grounded ? 6 : (freq / 100) * 5; // how strongly the true fact is encoded
    const l = [0.4 + knowledge, 1.3, 1.25, 0.9, -2];
    if (abstain) l[4] = grounded ? -1 : 1.6 - (freq / 100) * 3;
    return l;
  }, [freq, grounded, abstain]);
  const probs = softmax(logits, 1);
  const top = probs.indexOf(Math.max(...probs));
  const ent = entropy(probs);
  const outcome = top === correctIdx ? 'correct' : top === 4 ? 'abstain' : 'hallucination';

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <Card className="space-y-4 bg-slate-50 dark:bg-slate-950/40">
        <p className="rounded-lg bg-white p-2 text-xs italic text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          Prompt: “What is the late-filing penalty under Section 14(b) of the Rajasthan Solar Rooftop Policy?” <span className="not-italic text-slate-400">(fictional policy; true answer: ₹2,500)</span>
        </p>
        <Slider label="How often this fact appeared in training data" value={freq} min={0} max={100} onChange={setFreq} format={(v) => (v === 0 ? 'Never' : v < 30 ? 'Rarely' : v < 70 ? 'Sometimes' : 'Very often')} />
        <Toggle label="Ground with the policy document (RAG)" checked={grounded} onChange={setGrounded} hint="The actual clause is pasted into the prompt" />
        <Toggle label="Allow “not in my sources” answers" checked={abstain} onChange={setAbstain} hint="System prompt explicitly permits abstaining" />
      </Card>
      <div className="space-y-3">
        <ProbBars items={candidates.map((c, i) => ({ label: c, p: probs[i], tone: i === correctIdx ? 'good' : i === 4 ? 'neutral' : 'bad' }))} highlight={top} />
        <div className="grid gap-2 sm:grid-cols-3">
          <Stat label="Model says" value={candidates[top]} tone={outcome === 'correct' ? 'text-emerald-600' : outcome === 'abstain' ? 'text-sky-600' : 'text-rose-600'} />
          <Stat label="Tone of the answer" value="100% confident" sub="(fluency never changes)" />
          <Stat label="Real uncertainty" value={`${ent.toFixed(2)} bits`} sub={ent > 1.6 ? 'very unsure' : ent > 0.8 ? 'somewhat unsure' : 'sure'} />
        </div>
        {outcome === 'hallucination' && (
          <Callout tone="danger" title="Hallucination">
            The model has never reliably seen this fact, so several amounts look equally plausible. It still picks one — <strong>{candidates[top]}</strong> — and states it in the same confident tone it uses for “Paris is the capital of France”.
          </Callout>
        )}
        {outcome === 'correct' && (
          <Callout tone="success" title={grounded ? 'Grounded and correct' : 'Correct — this time'}>
            {grounded
              ? 'With the actual clause in the prompt, the correct amount dominates. This is why RAG is the #1 hallucination control for factual Q&A.'
              : 'The fact was common enough in training that the model recalls it. But you cannot see this slider in real life — you never know how well a fact was learned. Ground it anyway.'}
          </Callout>
        )}
        {outcome === 'abstain' && (
          <Callout tone="info" title="Safe abstention">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" />
            </span>{' '}
            Allowed to abstain, the model routes the user to a human or a source instead of inventing a penalty. A “not found” is a feature, not a failure.
          </Callout>
        )}
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge tone={grounded ? 'green' : 'slate'}>
            <BookOpenCheck className="h-3 w-3" /> grounding {grounded ? 'on' : 'off'}
          </Badge>
          <Badge tone={abstain ? 'green' : 'slate'}>{abstain ? <ShieldCheck className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />} abstention {abstain ? 'allowed' : 'not allowed'}</Badge>
        </div>
      </div>
    </div>
  );
}
