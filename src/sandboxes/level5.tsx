import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Minus, Play, RotateCcw, AlertTriangle } from 'lucide-react';
import { Badge, Button, Callout, Card, HBar, Segmented, Slider, Stat, Toggle, cx } from '../components/ui';
import { MODEL_TIERS, requestLatency, type ModelTier } from '../data/models';
import { inr, inrShort, ms, num, usd } from '../lib/format';
import { useProgress } from '../store/progress';

/* ------------------------------------------------------------------ */
/* Lesson 5.1 — Exact match vs rubric                                  */
/* ------------------------------------------------------------------ */

const EXPECTED = 'Ward 12 has had no water supply for 3 days and children are falling ill. The citizen requests an urgent water tanker.';
interface Run {
  text: string;
  ward: boolean;
  duration: boolean;
  action: boolean;
  short: boolean;
  faithful: boolean;
}
const RUNS_V1: Run[] = [
  { text: EXPECTED, ward: true, duration: true, action: true, short: true, faithful: true },
  { text: 'Citizen reports no water in Ward 12 for three days, with children falling sick. Requests an urgent tanker.', ward: true, duration: true, action: true, short: true, faithful: true },
  { text: 'Water supply has been cut in Ward 12 for 3 days; children are unwell. An urgent water tanker is requested.', ward: true, duration: true, action: true, short: true, faithful: true },
  { text: 'No water in Ward 12 since last month and children are ill. Requests a tanker.', ward: true, duration: false, action: true, short: true, faithful: false },
  { text: 'Ward 12 residents lack water for 3 days. They request a tanker and compensation of ₹5,000.', ward: true, duration: true, action: true, short: true, faithful: false },
  { text: 'Urgent: 3-day water outage in Ward 12 affecting children’s health; tanker requested.', ward: true, duration: true, action: true, short: true, faithful: true },
  { text: 'Ward 12 has had no water for 3 days. Children are falling ill. The citizen urgently requests a tanker. She is also unhappy with the councillor.', ward: true, duration: true, action: true, short: false, faithful: false },
  { text: 'Citizen requests a water tanker; Ward 12 has been without supply for 3 days and children are sick.', ward: true, duration: true, action: true, short: true, faithful: true },
  { text: 'Sunita Devi of Ward 12 reports 3 days without water and children falling ill, and asks for an urgent tanker.', ward: true, duration: true, action: true, short: true, faithful: true },
  { text: 'There is a water problem in the area and the citizen is unhappy.', ward: false, duration: false, action: false, short: true, faithful: true },
];
const RUNS_V2: Run[] = RUNS_V1.map((r, i) => (i === 0 ? { ...r, text: 'Ward 12 has been without water for 3 days and children are falling ill. The citizen asks for an urgent water tanker.' } : r));
const rubricPass = (r: Run) => r.ward && r.duration && r.action && r.short && r.faithful;

export function BinaryVsRubricSandbox() {
  const [method, setMethod] = useState<'exact' | 'rubric'>('exact');
  const [upgraded, setUpgraded] = useState(false);
  const runs = upgraded ? RUNS_V2 : RUNS_V1;
  const exactPass = runs.filter((r) => r.text === EXPECTED).length;
  const rubricPassCount = runs.filter(rubricPass).length;
  const trulyWrong = runs.filter((r) => !rubricPass(r)).length;
  const falseAlarms = runs.filter((r) => r.text !== EXPECTED && rubricPass(r)).length;
  const Check = ({ ok }: { ok: boolean }) => (ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-rose-500" />);

  return (
    <div className="space-y-4">
      <Card className="bg-slate-50 text-sm dark:bg-slate-950/40">
        <div className="text-xs font-semibold uppercase text-slate-500">Test case</div>
        Summarise in ≤ 2 sentences: “No water supply in Ward 12 for the last 3 days. Children are falling ill. Please send a water tanker urgently. — Sunita Devi”
        <div className="mt-2 text-xs text-slate-500">Expected (for exact match): “{EXPECTED}”</div>
      </Card>
      <div className="flex flex-wrap items-center gap-4">
        <Segmented value={method} onChange={setMethod} options={[{ value: 'exact', label: 'Traditional exact-match UAT' }, { value: 'rubric', label: 'Rubric-based eval' }]} />
        <Toggle label="Vendor silently upgraded the model" checked={upgraded} onChange={setUpgraded} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800/60">
            <tr>
              <th className="px-2 py-2">Run</th>
              <th className="px-2 py-2">Output</th>
              {method === 'rubric' && ['Ward', 'Duration', 'Action', '≤2 sent.', 'Faithful'].map((h) => <th key={h} className="px-1 py-2 text-center">{h}</th>)}
              <th className="px-2 py-2 text-center">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r, i) => {
              const pass = method === 'exact' ? r.text === EXPECTED : rubricPass(r);
              return (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-2 py-1.5 font-bold text-slate-400">{i + 1}</td>
                  <td className="px-2 py-1.5">{r.text}</td>
                  {method === 'rubric' &&
                    [r.ward, r.duration, r.action, r.short, r.faithful].map((v, k) => (
                      <td key={k} className="px-1 py-1.5">
                        <div className="flex justify-center">
                          <Check ok={v} />
                        </div>
                      </td>
                    ))}
                  <td className="px-2 py-1.5 text-center">{pass ? <Badge tone="green">PASS</Badge> : <Badge tone="red">FAIL</Badge>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <Stat label="Exact-match pass rate" value={`${exactPass * 10}%`} tone="text-rose-600" />
        <Stat label="Rubric pass rate" value={`${rubricPassCount * 10}%`} tone="text-emerald-600" />
        <Stat label="Truly wrong outputs" value={trulyWrong} />
        <Stat label="Exact-match false alarms" value={falseAlarms} sub="correct answers marked FAIL" tone="text-amber-600" />
      </div>
      <Callout tone={method === 'exact' ? 'warn' : 'success'}>
        {method === 'exact'
          ? upgraded
            ? 'After a silent model upgrade even run 1 rewords its answer — exact match now fails 100% of runs, although most are perfectly fine. Teams in this situation start ignoring test failures entirely.'
            : `Exact match flags ${10 - exactPass} failures, but ${falseAlarms} of them are harmless rewordings — and it gives no clue which ones are actually wrong.`
          : `The rubric separates harmless variation from real defects: it fails exactly the ${trulyWrong} runs with wrong duration, invented compensation, extra claims or missing facts. That is what AI UAT should measure.`}
      </Callout>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson 5.2 — Golden dataset composition                              */
/* ------------------------------------------------------------------ */

const CATS = [
  { id: 'happy', label: 'Happy path', min: 0.3, traffic: 0.55, color: 'bg-emerald-500' },
  { id: 'edge', label: 'Edge / ambiguous', min: 0.15, traffic: 0.18, color: 'bg-sky-500' },
  { id: 'adv', label: 'Adversarial / injection', min: 0.08, traffic: 0.03, color: 'bg-rose-500' },
  { id: 'oos', label: 'Out-of-scope', min: 0.08, traffic: 0.09, color: 'bg-amber-500' },
  { id: 'multi', label: 'Hindi / code-mixed', min: 0.1, traffic: 0.12, color: 'bg-violet-500' },
  { id: 'pii', label: 'PII-sensitive', min: 0.03, traffic: 0.03, color: 'bg-cyan-500' },
] as const;
type CatId = (typeof CATS)[number]['id'];

export function DatasetCompositionSandbox() {
  const [counts, setCounts] = useState<Record<CatId, number>>({ happy: 80, edge: 10, adv: 0, oos: 0, multi: 5, pii: 0 });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const shares = Object.fromEntries(CATS.map((c) => [c.id, total ? counts[c.id] / total : 0])) as Record<CatId, number>;
  const blind = CATS.filter((c) => shares[c.id] < c.min);
  const coverage = (CATS.reduce((a, c) => a + Math.min(1, shares[c.id] / c.min), 0) / CATS.length) * 100;
  const moe = total ? 1.96 * Math.sqrt((0.9 * 0.1) / total) * 100 : 100;
  const smeHours = (total * 10) / 60;

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <Card className="space-y-3 bg-slate-50 dark:bg-slate-950/40">
        {CATS.map((c) => (
          <Slider key={c.id} label={c.label} value={counts[c.id]} min={0} max={150} step={5} onChange={(v) => setCounts({ ...counts, [c.id]: v })} format={(v) => `${v} cases`} />
        ))}
      </Card>
      <div className="space-y-3">
        <div>
          <div className="mb-1 text-xs font-semibold text-slate-500">Your dataset mix vs. real production traffic</div>
          {[
            { name: 'Golden set', vals: CATS.map((c) => shares[c.id]) },
            { name: 'Production', vals: CATS.map((c) => c.traffic) },
          ].map((row) => (
            <div key={row.name} className="mb-1.5 flex items-center gap-2 text-xs">
              <span className="w-20 text-slate-500">{row.name}</span>
              <div className="flex h-5 flex-1 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                {row.vals.map((v, i) => (
                  <div key={i} className={cx('h-full transition-all', CATS[i].color)} style={{ width: `${v * 100}%` }} title={`${CATS[i].label}: ${(v * 100).toFixed(0)}%`} />
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 text-[11px]">
            {CATS.map((c) => (
              <span key={c.id} className="flex items-center gap-1">
                <span className={cx('h-2 w-2 rounded', c.color)} /> {c.label}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <Stat label="Total cases" value={total} />
          <Stat label="Coverage score" value={`${coverage.toFixed(0)}%`} tone={coverage >= 90 ? 'text-emerald-600' : coverage >= 60 ? 'text-amber-600' : 'text-rose-600'} />
          <Stat label="Pass-rate precision" value={`±${moe.toFixed(1)} pts`} sub="at a 90% pass rate (95% CI)" />
          <Stat label="SME effort" value={`${num(smeHours, 1)} h`} sub={`≈ ${inrShort(smeHours * 1500)} @ ₹1,500/h`} />
        </div>
        {blind.length > 0 ? (
          <Callout tone="danger" title={`${blind.length} blind spot${blind.length > 1 ? 's' : ''}`}>
            Under-represented: {blind.map((b) => b.label).join(', ')}. Your score will look great while these failure types go untested. Adversarial cases deserve <em>more</em> weight than their share of traffic — one successful injection can make headlines.
          </Callout>
        ) : (
          <Callout tone="success" title="Balanced dataset">
            Every category meets its minimum share. {total < 150 ? 'Now grow it: with fewer than ~150 cases your pass rate is still noisy.' : 'Good size for launch decisions — keep a hidden hold-out set and grow it from production failures.'}
          </Callout>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson 5.3 — Eval methods matrix                                     */
/* ------------------------------------------------------------------ */

const OUTPUTS = [
  { id: 'A', label: 'Clean answer', defect: null as string | null, words: 62 },
  { id: 'B', label: '“Sure! Here’s the JSON:” + JSON', defect: 'schema', words: 64 },
  { id: 'C', label: 'Phone as “98450-12345”', defect: 'regex', words: 60 },
  { id: 'D', label: '310-word essay', defect: 'length', words: 310 },
  { id: 'E', label: 'Polished, longer, invents ₹500/day compensation', defect: 'faith', words: 110 },
  { id: 'F', label: '“Please don’t waste our time with such issues.”', defect: 'tone', words: 40 },
];
const METHODS = [
  { id: 'schema', label: 'JSON schema check', kind: 'code' },
  { id: 'regex', label: 'Phone regex', kind: 'code' },
  { id: 'length', label: 'Length ≤ 120 words', kind: 'code' },
  { id: 'faith', label: 'LLM judge: faithfulness', kind: 'judge' },
  { id: 'tone', label: 'LLM judge: tone & respect', kind: 'judge' },
] as const;
type MethodId = (typeof METHODS)[number]['id'];

export function EvalMethodSandbox() {
  const [on, setOn] = useState<Record<MethodId, boolean>>({ schema: true, regex: false, length: false, faith: false, tone: false });
  const [bias, setBias] = useState(false);
  const caught = (o: (typeof OUTPUTS)[number], m: MethodId) => {
    if (!o.defect) return null;
    if (o.defect !== m) return null;
    if (m === 'faith' && bias && o.words > 100) return false;
    return true;
  };
  const defects = OUTPUTS.filter((o) => o.defect);
  const caughtCount = defects.filter((o) => METHODS.some((m) => on[m.id] && caught(o, m.id))).length;
  const judges = METHODS.filter((m) => m.kind === 'judge' && on[m.id]).length;
  const costPer1k = judges * 530;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {METHODS.map((m) => (
          <div key={m.id} className="w-56">
            <Toggle label={m.label} hint={m.kind === 'code' ? 'Code-based · free · deterministic' : 'LLM-as-a-judge · ~₹0.53 per eval'} checked={on[m.id]} onChange={(v) => setOn({ ...on, [m.id]: v })} />
          </div>
        ))}
        <div className="w-56">
          <Toggle label="Judge has verbosity bias" hint="Rewards longer, polished answers" checked={bias} onChange={setBias} />
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/60">
            <tr>
              <th className="px-2 py-2 text-left">Output</th>
              {METHODS.map((m) => (
                <th key={m.id} className={cx('px-2 py-2', !on[m.id] && 'opacity-40')}>
                  {m.label}
                </th>
              ))}
              <th className="px-2 py-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {OUTPUTS.map((o) => {
              const isCaught = !o.defect || METHODS.some((m) => on[m.id] && caught(o, m.id));
              return (
                <tr key={o.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-2 py-2">
                    <strong>{o.id}.</strong> {o.label}
                  </td>
                  {METHODS.map((m) => {
                    const c = caught(o, m.id);
                    return (
                      <td key={m.id} className={cx('px-2 py-2 text-center', !on[m.id] && 'opacity-30')}>
                        {c === null ? <Minus className="mx-auto h-3.5 w-3.5 text-slate-300" /> : c ? <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" /> : <XCircle className="mx-auto h-4 w-4 text-rose-500" />}
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-center">{!o.defect ? <Badge tone="green">clean</Badge> : isCaught ? <Badge tone="green">caught</Badge> : <Badge tone="red">slips through</Badge>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label="Defects caught" value={`${caughtCount}/${defects.length}`} tone={caughtCount === defects.length ? 'text-emerald-600' : 'text-rose-600'} />
        <Stat label="Judge cost / 1,000 evals" value={inr(costPer1k)} />
        <Stat label="Code checks cost" value="₹0" sub="instant & deterministic" />
      </div>
      <Callout tone={caughtCount === defects.length ? 'success' : bias && on.faith ? 'danger' : 'tip'}>
        {bias && on.faith
          ? 'The biased judge rewards output E for being long and polished — and misses the invented ₹500/day compensation. Calibrate judges against human labels and write rubrics that explicitly ignore length.'
          : caughtCount === defects.length
            ? 'Layered evals catch everything: code checks for structure, format and length; judges for faithfulness and tone. Notice code checks did most of the work for free.'
            : 'Turn on more checks. Start with free code checks for anything structural, then add judges only for qualities code cannot verify.'}
      </Callout>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson 5.4 — Be the RAG triad grader                                */
/* ------------------------------------------------------------------ */

type Grade = 'good' | 'poor';
const TRIAD_CASES: { q: string; ctx: string[]; a: string; truth: [Grade, Grade, Grade]; fix: string }[] = [
  {
    q: 'How do I escalate a pension delay?',
    ctx: ['[Pension SOP §4] If pension is not credited within 15 days of the due date, the pensioner may escalate to the District Pension Officer using Form PEN-9.'],
    a: 'If your pension is more than 15 days late, submit Form PEN-9 to the District Pension Officer.',
    truth: ['good', 'good', 'good'],
    fix: 'Healthy on all three edges — this is a passing case.',
  },
  {
    q: 'How do I escalate a pension delay?',
    ctx: ['[Irrigation FAQ] Drip irrigation subsidy applications open every April.', '[Office notice] Public dealing hours are 10 am to 5 pm on working days.'],
    a: 'You can visit the office between 10 am and 5 pm on working days.',
    truth: ['poor', 'good', 'poor'],
    fix: 'Retrieval problem: the right SOP was never retrieved. Fix chunking/search (hybrid + reranker), metadata filters, or index coverage. The answer is “faithful” to irrelevant context — high faithfulness alone means nothing.',
  },
  {
    q: 'What documents are needed for a new ration card?',
    ctx: ['[Ration Card SOP §2] Applicants must provide Aadhaar of all family members, proof of address and an income certificate.'],
    a: 'You need Aadhaar for all family members, proof of address, an income certificate, and a ₹100 processing fee paid online.',
    truth: ['good', 'poor', 'good'],
    fix: 'Generation problem: the ₹100 fee is invented. Tighten the grounding instruction, require citations per claim, lower temperature, and add a faithfulness check to the eval suite.',
  },
  {
    q: 'Can I apply for a ration card online?',
    ctx: ['[Ration Card SOP §1] Ration cards are issued to eligible households by the Food & Civil Supplies Department. Applications can be submitted online on the state food portal or at any Fair Price Shop.'],
    a: 'Ration cards are issued to eligible households by the Food & Civil Supplies Department.',
    truth: ['good', 'good', 'poor'],
    fix: 'Answer-relevance problem: correct and grounded, but it doesn’t answer “can I apply online?” (yes — via the state food portal). Improve instructions to answer the question directly first; add answer-relevance scoring.',
  },
  {
    q: 'What is the GST rate on rooftop solar panels?',
    ctx: ['[Inverter manual] The standard warranty period is 7 years from installation.', '[Inverter manual] Net metering requires approval from your DISCOM.'],
    a: 'I couldn’t find GST rates in the provided documents. Please check the official GST rate notification.',
    truth: ['poor', 'good', 'good'],
    fix: 'Correct behaviour! Nothing relevant exists, and the model abstained honestly. Low context relevance here reveals a knowledge gap (add the document if this question matters) — not a model failure.',
  },
];

export function TriadGraderSandbox() {
  const [idx, setIdx] = useState(0);
  const [grades, setGrades] = useState<Record<number, (Grade | null)[]>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const c = TRIAD_CASES[idx];
  const g = grades[idx] ?? [null, null, null];
  const dims = ['Context relevance', 'Faithfulness', 'Answer relevance'];
  const setG = (d: number, v: Grade) => setGrades({ ...grades, [idx]: g.map((x, i) => (i === d ? v : x)) });
  const totalAgree = Object.entries(grades).reduce((acc, [k, arr]) => (revealed[Number(k)] ? acc + arr.filter((x, i) => x === TRIAD_CASES[Number(k)].truth[i]).length : acc), 0);
  const totalRevealed = Object.values(revealed).filter(Boolean).length * 3;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {TRIAD_CASES.map((_, i) => (
          <button type="button" key={i} onClick={() => setIdx(i)} className={cx('h-8 w-8 rounded-full text-xs font-bold', i === idx ? 'bg-indigo-600 text-white' : revealed[i] ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200' : 'bg-slate-100 dark:bg-slate-800')}>
            {i + 1}
          </button>
        ))}
        {totalRevealed > 0 && <Badge tone="indigo">Agreement with expert: {totalAgree}/{totalRevealed}</Badge>}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="bg-sky-50 dark:bg-sky-950/30">
          <div className="text-xs font-bold uppercase text-sky-700 dark:text-sky-300">Question</div>
          <p className="mt-1 text-sm font-medium">{c.q}</p>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-950/30">
          <div className="text-xs font-bold uppercase text-amber-700 dark:text-amber-300">Retrieved context</div>
          {c.ctx.map((x, i) => (
            <p key={i} className="mt-1 text-xs">{x}</p>
          ))}
        </Card>
        <Card className="bg-emerald-50 dark:bg-emerald-950/30">
          <div className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">Answer</div>
          <p className="mt-1 text-sm">{c.a}</p>
        </Card>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {dims.map((d, i) => (
          <div key={d} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <div className="mb-2 text-sm font-semibold">{d}</div>
            <div className="flex gap-2">
              {(['good', 'poor'] as Grade[]).map((v) => (
                <button
                  type="button"
                  key={v}
                  disabled={revealed[idx]}
                  onClick={() => setG(i, v)}
                  className={cx(
                    'flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold capitalize',
                    g[i] === v ? (v === 'good' ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' : 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200') : 'border-slate-200 dark:border-slate-700',
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            {revealed[idx] && (
              <div className={cx('mt-2 text-xs font-semibold', g[i] === c.truth[i] ? 'text-emerald-600' : 'text-rose-600')}>
                Expert: {c.truth[i]} {g[i] === c.truth[i] ? '✓ you agree' : '✗ different'}
              </div>
            )}
          </div>
        ))}
      </div>
      {!revealed[idx] ? (
        <Button disabled={g.some((x) => x === null)} onClick={() => setRevealed({ ...revealed, [idx]: true })}>
          Compare with expert grading
        </Button>
      ) : (
        <Callout tone={c.truth.every((t) => t === 'good') ? 'success' : 'tip'} title="Diagnosis & fix">
          {c.fix}
          {idx < TRIAD_CASES.length - 1 && (
            <button type="button" onClick={() => setIdx(idx + 1)} className="mt-2 block text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
              Next case →
            </button>
          )}
        </Callout>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson 5.5 — Request anatomy                                        */
/* ------------------------------------------------------------------ */

export function RequestAnatomySandbox() {
  const { state } = useProgress();
  const fx = state.settings.fxRate;
  const [tierId, setTierId] = useState<ModelTier['id']>('frontier');
  const [sys, setSys] = useState(3000);
  const [rag, setRag] = useState(2400);
  const [hist, setHist] = useState(600);
  const [outTok, setOutTok] = useState(400);
  const [caching, setCaching] = useState(false);
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);

  const tier = MODEL_TIERS.find((t) => t.id === tierId)!;
  const user = 60;
  const inputTotal = sys + rag + hist + user;
  const cached = caching ? sys : 0;
  const uncachedUsd = ((inputTotal - cached) / 1e6) * tier.inputPerM;
  const cachedUsd = (cached / 1e6) * tier.inputPerM * tier.cachedInputFactor;
  const outUsd = (outTok / 1e6) * tier.outputPerM;
  const thinkUsd = ((outTok * tier.thinkingMultiplier) / 1e6) * tier.outputPerM;
  const total = uncachedUsd + cachedUsd + outUsd + thinkUsd;
  const lat = requestLatency(tier, outTok, inputTotal);
  const parts = [
    { name: 'Uncached input', v: uncachedUsd, c: 'bg-sky-500' },
    { name: 'Cached input', v: cachedUsd, c: 'bg-emerald-500' },
    { name: 'Output', v: outUsd, c: 'bg-rose-500' },
    { name: 'Hidden thinking', v: thinkUsd, c: 'bg-violet-500' },
  ];

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);
  const play = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const start = performance.now();
    const duration = Math.min(8000, lat.totalMs);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setProgress(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  const ttftShare = lat.ttftMs / lat.totalMs;
  const answer = 'Your application APL-2026-004512 is awaiting police verification since 28 October. Verification usually completes within 7 working days; you will receive an SMS once it is done. If nothing changes by 10 November, raise a grievance quoting this ID.';
  const words = answer.split(' ');
  const shownWords = progress <= ttftShare ? 0 : Math.ceil(((progress - ttftShare) / (1 - ttftShare)) * words.length);

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <Card className="space-y-3 bg-slate-50 dark:bg-slate-950/40">
        <div>
          <div className="mb-1.5 text-sm font-medium">Model tier</div>
          <Segmented size="sm" value={tierId} onChange={setTierId} options={MODEL_TIERS.map((t) => ({ value: t.id, label: t.name.split(' ')[0] }))} />
        </div>
        <Slider label="System prompt + tools (static)" value={sys} min={300} max={10000} step={100} onChange={setSys} format={(v) => `${num(v)} tok`} />
        <Slider label="RAG context (per query)" value={rag} min={0} max={12000} step={100} onChange={setRag} format={(v) => `${num(v)} tok`} />
        <Slider label="Chat history" value={hist} min={0} max={8000} step={100} onChange={setHist} format={(v) => `${num(v)} tok`} />
        <Slider label="Output (answer length)" value={outTok} min={50} max={2000} step={25} onChange={setOutTok} format={(v) => `${num(v)} tok`} />
        <Toggle label="Prompt caching on the static prefix" checked={caching} onChange={setCaching} hint={`Cached reads at ${(tier.cachedInputFactor * 100).toFixed(0)}% of the input price`} />
      </Card>
      <div className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
            <span>Cost of this one request</span>
            <span className="font-mono text-slate-800 dark:text-slate-100">
              {usd(total)} · {inr(total * fx)}
            </span>
          </div>
          <div className="flex h-8 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            {parts.map((p) => (
              <div key={p.name} className={cx('h-full transition-all duration-500', p.c)} style={{ width: `${total ? (p.v / total) * 100 : 0}%` }} title={`${p.name}: ${usd(p.v)}`} />
            ))}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-[11px]">
            {parts.map((p) => (
              <span key={p.name} className="flex items-center gap-1">
                <span className={cx('h-2 w-2 rounded', p.c)} /> {p.name}: {total ? ((p.v / total) * 100).toFixed(0) : 0}%
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <Stat label="Input tokens" value={num(inputTotal)} sub={caching ? `${num(cached)} cached` : 'none cached'} />
          <Stat label="Per 1 lakh requests" value={inrShort(total * fx * 1e5)} />
          <Stat label="TTFT" value={ms(lat.ttftMs)} tone={lat.ttftMs > 2000 ? 'text-rose-600' : 'text-emerald-600'} />
          <Stat label="Total latency" value={ms(lat.totalMs)} tone={lat.totalMs > 6000 ? 'text-rose-600' : undefined} />
        </div>
        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Streaming timeline (what the user experiences)</span>
            <div className="flex gap-1.5">
              <Button size="sm" onClick={play}>
                <Play className="h-3.5 w-3.5" /> Play
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setProgress(0)}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="relative h-4 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
            <div className="absolute inset-y-0 left-0 bg-slate-400/60" style={{ width: `${ttftShare * 100}%` }} />
            <div className="absolute inset-y-0 left-0 bg-indigo-500/80 transition-[width]" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>waiting for first token ({ms(lat.ttftMs)})</span>
            <span>streaming {num(outTok)} tokens</span>
          </div>
          <p className="mt-2 min-h-[3rem] rounded-lg bg-slate-50 p-2 text-sm dark:bg-slate-950/40">
            {progress > 0 && shownWords === 0 && <span className="text-slate-400">thinking…</span>}
            {words.slice(0, shownWords).join(' ')}
            {progress > 0 && progress < 1 && shownWords > 0 && <span className="animate-pulse">▍</span>}
          </p>
        </div>
        <Callout tone={outUsd + thinkUsd > uncachedUsd + cachedUsd ? 'warn' : 'tip'}>
          {tier.thinkingMultiplier > 0
            ? 'Reasoning models generate hidden thinking tokens billed as output, and users wait for that thinking before the first visible token. Use them where the extra accuracy is worth it.'
            : outUsd > uncachedUsd + cachedUsd
              ? 'Output tokens dominate this bill. Cap max tokens and ask for concise answers before optimising anything else.'
              : caching
                ? 'Caching the static prefix makes it nearly free on repeat. The remaining cost is the variable RAG context and output.'
                : 'Input dominates — turn on prompt caching for the static prefix and trim RAG context (fewer, better chunks).'}
          <span className="mt-1 flex items-center gap-1 text-[11px] opacity-75">
            <AlertTriangle className="h-3 w-3" /> Illustrative prices; check your vendor’s current rates and cache rules.
          </span>
        </Callout>
        <HBar label="Monthly @ 10k/day" value={total * fx * 3e5} max={Math.max(total * fx * 3e5, 1)} right={inrShort(total * fx * 3e5)} color="bg-indigo-500" />
      </div>
    </div>
  );
}
