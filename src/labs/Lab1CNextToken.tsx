import { useMemo, useState } from 'react';
import { ChevronRight, Play, RotateCcw, Sparkles } from 'lucide-react';
import { Badge, Button, Callout, Card, Meter, Missions, SectionLabel, Slider, Stat, Toggle, cx } from '../components/ui';
import { ProbBars } from '../components/charts';
import { entropy, rng, sampleIndex, softmax } from '../lib/math';

type Kind = 'correct' | 'wrong' | 'abstain' | 'neutral';
interface Cand {
  t: string;
  l: number;
  kind: Kind;
}
interface Scenario {
  id: string;
  label: string;
  prompt: string;
  grounding: string;
  truth: string;
  slotBase: Cand[];
  slotGrounded: Cand[];
  abstainLogit: { base: number; withInstruction: number; grounded: number };
  abstainText: string;
  contRight: Cand[][];
  contWrong: Cand[][];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'capital',
    label: 'Well-known fact',
    prompt: 'The capital of India is',
    grounding: 'Context: “New Delhi is the capital of India and the seat of all three branches of the Government.”',
    truth: 'New Delhi',
    slotBase: [
      { t: ' New Delhi', l: 8, kind: 'correct' },
      { t: ' Delhi', l: 6.4, kind: 'correct' },
      { t: ' Mumbai', l: 3.6, kind: 'wrong' },
      { t: ' Kolkata', l: 3.1, kind: 'wrong' },
      { t: ' Bengaluru', l: 2.2, kind: 'wrong' },
    ],
    slotGrounded: [
      { t: ' New Delhi', l: 9.5, kind: 'correct' },
      { t: ' Delhi', l: 6.5, kind: 'correct' },
      { t: ' Mumbai', l: 2.5, kind: 'wrong' },
      { t: ' Kolkata', l: 2, kind: 'wrong' },
      { t: ' Bengaluru', l: 1.5, kind: 'wrong' },
    ],
    abstainLogit: { base: -3, withInstruction: 0.5, grounded: -2 },
    abstainText: ' not specified',
    contRight: [
      [
        { t: '.', l: 4, kind: 'neutral' },
        { t: ', home to Parliament.', l: 2.6, kind: 'neutral' },
        { t: ', located in north India.', l: 2.2, kind: 'neutral' },
      ],
    ],
    contWrong: [
      [
        { t: ', the country’s capital since 1947.', l: 3.5, kind: 'wrong' },
        { t: '.', l: 3, kind: 'neutral' },
      ],
    ],
  },
  {
    id: 'penalty',
    label: 'Obscure policy detail',
    prompt: 'Under Section 14(b) of the Rajasthan Solar Rooftop Policy 2025, the penalty for late filing is',
    grounding: 'Context: “[Policy §14(b)] Applicants who file the completion report late shall pay a penalty of ₹2,500 per month of delay.”',
    truth: '₹2,500',
    slotBase: [
      { t: ' ₹5,000', l: 2.2, kind: 'wrong' },
      { t: ' ₹10,000', l: 2.1, kind: 'wrong' },
      { t: ' ₹2,500', l: 1.75, kind: 'correct' },
      { t: ' ₹1,000', l: 1.5, kind: 'wrong' },
      { t: ' ₹25,000', l: 1.2, kind: 'wrong' },
    ],
    slotGrounded: [
      { t: ' ₹5,000', l: 1.2, kind: 'wrong' },
      { t: ' ₹10,000', l: 1, kind: 'wrong' },
      { t: ' ₹2,500', l: 7.6, kind: 'correct' },
      { t: ' ₹1,000', l: 0.8, kind: 'wrong' },
      { t: ' ₹25,000', l: 0.5, kind: 'wrong' },
    ],
    abstainLogit: { base: -1.5, withInstruction: 2.5, grounded: -1 },
    abstainText: ' not specified in my sources',
    contRight: [
      [
        { t: ' per month of delay', l: 4.2, kind: 'neutral' },
        { t: ' per month', l: 3, kind: 'neutral' },
      ],
      [
        { t: ' [Source: Policy §14(b)].', l: 4, kind: 'neutral' },
        { t: '.', l: 2.5, kind: 'neutral' },
      ],
    ],
    contWrong: [
      [
        { t: ' per day of delay', l: 3, kind: 'wrong' },
        { t: ' per month', l: 2.8, kind: 'neutral' },
        { t: ' as a one-time fee', l: 2.2, kind: 'wrong' },
      ],
      [
        { t: ', as specified in the 2025 amendment notified by the Energy Department.', l: 3.6, kind: 'wrong' },
        { t: '.', l: 2.5, kind: 'neutral' },
      ],
    ],
  },
  {
    id: 'officer',
    label: 'Specific person',
    prompt: 'The Nodal Grievance Officer for Ward 12, Pune Municipal Corporation, is Mr.',
    grounding: 'Context: “[Office Order 7/2026] Mr. R. Iyer, Deputy Commissioner, is designated Nodal Grievance Officer for Ward 12.”',
    truth: 'R. Iyer',
    slotBase: [
      { t: ' Sharma', l: 2, kind: 'wrong' },
      { t: ' Kulkarni', l: 1.95, kind: 'wrong' },
      { t: ' Patil', l: 1.9, kind: 'wrong' },
      { t: ' Deshmukh', l: 1.7, kind: 'wrong' },
      { t: ' R. Iyer', l: 0.4, kind: 'correct' },
    ],
    slotGrounded: [
      { t: ' Sharma', l: 0.8, kind: 'wrong' },
      { t: ' Kulkarni', l: 0.9, kind: 'wrong' },
      { t: ' Patil', l: 0.8, kind: 'wrong' },
      { t: ' Deshmukh', l: 0.6, kind: 'wrong' },
      { t: ' R. Iyer', l: 8, kind: 'correct' },
    ],
    abstainLogit: { base: -2, withInstruction: 2.4, grounded: -1 },
    abstainText: ' [name not provided in my sources]',
    contRight: [
      [
        { t: ', Deputy Commissioner', l: 4, kind: 'neutral' },
        { t: '.', l: 2.4, kind: 'neutral' },
      ],
    ],
    contWrong: [
      [
        { t: ', reachable at 020-2550-1234', l: 3.2, kind: 'wrong' },
        { t: ', Assistant Commissioner', l: 3, kind: 'wrong' },
        { t: '.', l: 2.2, kind: 'neutral' },
      ],
    ],
  },
];

interface Gen {
  t: string;
  kind: Kind;
}

export default function Lab1CNextToken() {
  const [sid, setSid] = useState('penalty');
  const [grounded, setGrounded] = useState(false);
  const [abstain, setAbstain] = useState(false);
  const [temp, setTemp] = useState(0.8);
  const [gen, setGen] = useState<Gen[]>([]);
  const [seed, setSeed] = useState(7);
  const [flags, setFlags] = useState({ hallucinated: false, fixed: false, greedy: false, abstained: false });

  const sc = SCENARIOS.find((s) => s.id === sid)!;
  const slot = useMemo(() => {
    const base = grounded ? sc.slotGrounded : sc.slotBase;
    const ab = grounded ? sc.abstainLogit.grounded : abstain ? sc.abstainLogit.withInstruction : sc.abstainLogit.base;
    return [...base, { t: sc.abstainText, l: ab, kind: 'abstain' as Kind }];
  }, [sc, grounded, abstain]);

  // Which distribution is "next"?
  const slotChoice = gen[0];
  const finished = slotChoice?.kind === 'abstain' || (slotChoice && gen.length >= 1 + (slotChoice.kind === 'wrong' ? sc.contWrong.length : sc.contRight.length));
  const nextDist: Cand[] = !slotChoice ? slot : slotChoice.kind === 'wrong' ? sc.contWrong[gen.length - 1] ?? [] : sc.contRight[gen.length - 1] ?? [];
  const probs = softmax(
    nextDist.map((c) => c.l),
    temp,
  );
  const slotProbs = softmax(
    slot.map((c) => c.l),
    temp,
  );
  const top = slotProbs.indexOf(Math.max(...slotProbs));
  const ent = entropy(slotProbs);
  const correctMass = slot.reduce((a, c, i) => a + (c.kind === 'correct' ? slotProbs[i] : 0), 0);
  const risk = Math.round((1 - correctMass - slot.reduce((a, c, i) => a + (c.kind === 'abstain' ? slotProbs[i] : 0), 0)) * 100);

  const reset = () => setGen([]);
  const step = (all = false) => {
    let g = [...gen];
    let s = seed;
    const r = rng(s);
    const pickFrom = (dist: Cand[]) => {
      const p = softmax(
        dist.map((c) => c.l),
        temp,
      );
      const i = sampleIndex(p, r());
      return dist[i];
    };
    do {
      const sc0 = g[0];
      if (sc0?.kind === 'abstain') break;
      const dist = !sc0 ? slot : sc0.kind === 'wrong' ? sc.contWrong[g.length - 1] : sc.contRight[g.length - 1];
      if (!dist) break;
      const c = pickFrom(dist);
      g = [...g, { t: c.t, kind: c.kind }];
    } while (all);
    s += 1;
    setSeed(s);
    setGen(g);
    const slotTok = g[0];
    if (slotTok) {
      setFlags((f) => ({
        hallucinated: f.hallucinated || slotTok.kind === 'wrong',
        fixed: f.fixed || (grounded && slotTok.kind === 'correct' && sc.id !== 'capital'),
        greedy: f.greedy || temp === 0,
        abstained: f.abstained || slotTok.kind === 'abstain',
      }));
    }
  };

  const fullPrompt = [grounded ? sc.grounding : null, abstain ? 'Instruction: If the answer is not in the context, say it is not specified.' : null, sc.prompt].filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button
            type="button"
            key={s.id}
            onClick={() => {
              setSid(s.id);
              reset();
            }}
            className={cx('rounded-full border px-3 py-1 text-sm font-medium', sid === s.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700')}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <Card className="space-y-3">
            <SectionLabel className="mb-0">Change the prompt</SectionLabel>
            <Toggle label="Add grounding context (the real source text)" checked={grounded} onChange={(v) => { setGrounded(v); reset(); }} />
            <Toggle label="Allow “not specified” answers" checked={abstain} onChange={(v) => { setAbstain(v); reset(); }} />
            <Slider label="Temperature" value={temp} min={0} max={1.5} step={0.05} onChange={(v) => { setTemp(v); reset(); }} format={(v) => v.toFixed(2)} />
          </Card>
          <Card className="space-y-3">
            <SectionLabel className="mb-0">Hallucination radar (for the key slot)</SectionLabel>
            <Meter label="Hallucination risk" value={risk} invert suffix="%" detail="Probability mass on plausible-but-wrong tokens" />
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Model’s top pick" value={slot[top].t.trim()} tone={slot[top].kind === 'correct' ? 'text-emerald-600' : slot[top].kind === 'abstain' ? 'text-sky-600' : 'text-rose-600'} />
              <Stat label="Uncertainty" value={`${ent.toFixed(2)} bits`} sub={ent > 1.8 ? 'flat = guessing' : ent > 0.8 ? 'unsure' : 'confident'} />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionLabel>Assembled prompt</SectionLabel>
            <div className="space-y-1 rounded-xl bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-200">
              {fullPrompt.map((line, i) => (
                <div key={i} className={cx(line.startsWith('Context') && 'text-amber-300', line.startsWith('Instruction') && 'text-sky-300')}>
                  {line}
                </div>
              ))}
            </div>
            <div className="mt-3 min-h-[3rem] rounded-xl border-2 border-dashed border-slate-300 p-3 text-sm dark:border-slate-700">
              <span className="text-slate-500">{sc.prompt}</span>
              {gen.map((g, i) => (
                <span
                  key={i}
                  className={cx(
                    'animate-pop rounded px-0.5 font-semibold',
                    g.kind === 'correct' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
                    g.kind === 'wrong' && 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
                    g.kind === 'abstain' && 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
                    g.kind === 'neutral' && 'text-slate-800 dark:text-slate-100',
                  )}
                >
                  {g.t}
                </span>
              ))}
              {!finished && <span className="ml-0.5 animate-pulse text-indigo-500">▍</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" disabled={!!finished} onClick={() => step(false)}>
                <ChevronRight className="h-3.5 w-3.5" /> Generate next token
              </Button>
              <Button size="sm" variant="secondary" disabled={!!finished} onClick={() => step(true)}>
                <Play className="h-3.5 w-3.5" /> Generate full answer
              </Button>
              <Button size="sm" variant="ghost" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
            </div>
          </Card>
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <SectionLabel className="mb-0">{finished ? 'Final step distribution' : `Next-token probabilities (step ${gen.length + 1})`}</SectionLabel>
              <div className="flex gap-1.5 text-[11px]">
                <Badge tone="green">correct</Badge>
                <Badge tone="red">plausible but wrong</Badge>
                <Badge tone="blue">abstain</Badge>
              </div>
            </div>
            {nextDist.length > 0 && !finished ? (
              <ProbBars items={nextDist.map((c, i) => ({ label: c.t.trim(), p: probs[i], tone: c.kind === 'correct' ? 'good' : c.kind === 'wrong' ? 'bad' : 'neutral' }))} />
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">Generation complete. Reset to sample again{temp > 0 ? ' — with temperature above 0 you may get a different answer.' : '.'}</p>
            )}
          </Card>
        </div>
      </div>

      {gen[0] && finished && (
        <Callout tone={gen[0].kind === 'correct' ? 'success' : gen[0].kind === 'abstain' ? 'info' : 'danger'} title={gen[0].kind === 'correct' ? 'Correct' : gen[0].kind === 'abstain' ? 'Safe abstention' : 'A hallucination is born'}>
          {gen[0].kind === 'wrong' &&
            `The model had no reliable knowledge, so several answers looked equally plausible. It sampled “${gen[0].t.trim()}” — and then every following token was generated to stay consistent with that mistake, even inventing supporting detail. The true answer was ${sc.truth}.`}
          {gen[0].kind === 'correct' && (grounded ? 'With the source text in the prompt, the correct token dominates the distribution. Grounding turned a guess into a lookup.' : 'This fact was common in training data, so the model was genuinely confident. But you cannot see training-data frequency in production — ground important facts anyway.')}
          {gen[0].kind === 'abstain' && 'Permitted to abstain, the model chose “not specified” instead of inventing an answer. In a citizen service, that response should hand off to a human or a source.'}
        </Callout>
      )}

      <Missions
        labId="lab-1c"
        missions={[
          { id: 'hallucinate', label: 'Generate a hallucination on an obscure fact (a red token)', done: flags.hallucinated },
          { id: 'ground', label: 'Eliminate it by adding grounding context and regenerating', done: flags.fixed },
          { id: 'greedy', label: 'Generate at temperature 0 (greedy decoding) and compare', done: flags.greedy },
          { id: 'abstain', label: 'Make the model abstain safely instead of guessing', done: flags.abstained },
        ]}
      />
      <p className="flex items-center gap-1 text-xs text-slate-500">
        <Sparkles className="h-3.5 w-3.5" /> Probabilities use real softmax maths over illustrative logits; policy and names are fictional.
      </p>
    </div>
  );
}
