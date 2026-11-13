import { useMemo, useState } from 'react';
import { Award, Calculator, Bot, RefreshCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Flag, Skull, Play } from 'lucide-react';
import { Badge, Button, Callout, Card, Meter, Segmented, Slider, Stat, Toggle, cx } from '../components/ui';
import { LineChart } from '../components/charts';
import { inr, inrShort, num } from '../lib/format';
import { clamp, rng } from '../lib/math';

/* ------------------------------------------------------------------ */
/* Lesson 0.1 — Same problem, four approaches                          */
/* ------------------------------------------------------------------ */

const APPROACHES = [
  { id: 'rules', name: 'Rules / SQL', color: 'bg-sky-500', explain: 100, buildWeeks: 1, costPer1k: 0.5 },
  { id: 'ml', name: 'Classical ML', color: 'bg-emerald-500', explain: 70, buildWeeks: 5, costPer1k: 2 },
  { id: 'dl', name: 'Deep Learning', color: 'bg-violet-500', explain: 30, buildWeeks: 9, costPer1k: 12 },
  { id: 'genai', name: 'GenAI / LLM', color: 'bg-rose-500', explain: 45, buildWeeks: 3, costPer1k: 55 },
] as const;

export function ApproachSandbox() {
  const [messiness, setMessiness] = useState(30);
  const [volume, setVolume] = useState(5000);
  const [audit, setAudit] = useState(true);
  const [labels, setLabels] = useState(true);

  const rows = APPROACHES.map((a) => {
    let acc = 0;
    if (a.id === 'rules') acc = 97 - messiness * 0.82;
    if (a.id === 'ml') acc = (labels ? 93 : 55) - messiness * 0.42;
    if (a.id === 'dl') acc = (labels ? 92 : 50) - messiness * 0.18;
    if (a.id === 'genai') acc = 89 - messiness * 0.06;
    acc = clamp(acc, 5, 99);
    const monthly = (volume * 30 * a.costPer1k) / 1000;
    const costScore = 100 - clamp(Math.log10(Math.max(1, monthly)) * 16, 0, 100);
    const score = acc * 0.55 + costScore * 0.2 + (audit ? a.explain * 0.25 : 15) + (a.id === 'rules' && messiness < 25 ? 6 : 0);
    return { ...a, acc, monthly, score };
  });
  const best = rows.reduce((b, r) => (r.score > b.score ? r : b), rows[0]);

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <Card className="space-y-4 bg-slate-50 dark:bg-slate-950/40">
        <Slider
          label="How messy is the input?"
          value={messiness}
          min={0}
          max={100}
          onChange={setMessiness}
          format={(v) => (v < 20 ? 'Dropdown form' : v < 50 ? 'Short typed text' : v < 80 ? 'Free text + typos' : 'Mixed Hindi-English voice notes')}
        />
        <Slider label="Grievances per day" value={volume} min={100} max={100000} step={100} onChange={setVolume} format={(v) => num(v)} />
        <Toggle label="Every decision must be explainable / auditable" checked={audit} onChange={setAudit} hint="Common for government & regulated sectors" />
        <Toggle label="We have 20,000 labelled historical grievances" checked={labels} onChange={setLabels} hint="ML and deep learning need labelled history" />
      </Card>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className={cx('rounded-xl border-2 p-3 transition', r.id === best.id ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800')}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold">
                <span className={cx('h-3 w-3 rounded-full', r.color)} /> {r.name}
                {r.id === best.id && (
                  <Badge tone="green">
                    <Award className="h-3 w-3" /> Best fit
                  </Badge>
                )}
              </div>
              <div className="text-xs text-slate-500">
                ~{r.buildWeeks} wk build · <strong className="text-slate-700 dark:text-slate-200">{inrShort(r.monthly)}/month</strong> to run
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Meter label="Routing accuracy" value={r.acc} suffix="%" />
              <Meter label="Explainability" value={r.explain} />
            </div>
          </div>
        ))}
        <Callout tone={best.id === 'genai' ? 'warn' : 'tip'} title={`Why ${best.name} wins here`}>
          {best.id === 'rules' && 'Inputs are structured enough that a handful of rules route almost everything correctly — at near-zero cost and with a perfect audit trail. Adding AI here is over-engineering.'}
          {best.id === 'ml' && 'Inputs are semi-structured and you have labelled history. A classical classifier is accurate, cheap to run and reasonably explainable (you can show which words drove the decision).'}
          {best.id === 'dl' && 'Messy inputs plus lots of labelled data favour a trained neural classifier — but notice the long build time and weak explainability.'}
          {best.id === 'genai' && 'Inputs are so messy (typos, code-mixed language, voice notes) that only an LLM routes reliably. Budget for per-token cost, add evals, and log reasons for each routing decision to recover some explainability.'}
        </Callout>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson 0.2 — Supervised / Unsupervised / Reinforcement              */
/* ------------------------------------------------------------------ */

const CLUSTER_COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#a855f7'];

function makePoints() {
  const r = rng(42);
  const centers = [
    [25, 30],
    [72, 28],
    [48, 74],
  ];
  const pts: [number, number][] = [];
  centers.forEach(([cx0, cy0]) => {
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * 15;
      pts.push([cx0 + Math.cos(a) * d, cy0 + Math.sin(a) * d]);
    }
  });
  return pts;
}
const POINTS = makePoints();

function kmeans(points: [number, number][], k: number, seed: number) {
  const r = rng(seed);
  // k-means++ initialisation
  const cents: [number, number][] = [points[Math.floor(r() * points.length)]];
  while (cents.length < k) {
    const d2 = points.map((p) => Math.min(...cents.map((c) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2)));
    const total = d2.reduce((a, b) => a + b, 0);
    let x = r() * total;
    let idx = 0;
    for (let i = 0; i < d2.length; i++) {
      x -= d2[i];
      if (x <= 0) {
        idx = i;
        break;
      }
    }
    cents.push([...points[idx]] as [number, number]);
  }
  let assign = points.map(() => 0);
  for (let it = 0; it < 20; it++) {
    assign = points.map((p) => {
      let best = 0;
      let bd = Infinity;
      cents.forEach((c, ci) => {
        const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2;
        if (d < bd) {
          bd = d;
          best = ci;
        }
      });
      return best;
    });
    cents.forEach((_, ci) => {
      const mine = points.filter((_, pi) => assign[pi] === ci);
      if (mine.length) cents[ci] = [mine.reduce((a, p) => a + p[0], 0) / mine.length, mine.reduce((a, p) => a + p[1], 0) / mine.length];
    });
  }
  const inertia = points.reduce((acc, p, i) => acc + (p[0] - cents[assign[i]][0]) ** 2 + (p[1] - cents[assign[i]][1]) ** 2, 0);
  return { cents, assign, inertia };
}

const GRID = 5;
const START: [number, number] = [4, 0];
const GOAL: [number, number] = [0, 4];
const PITS = new Set(['1,1', '2,3', '3,2', '1,3']);
const ACTIONS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

function trainQ(episodes: number) {
  const r = rng(7);
  const Q: number[][][] = Array.from({ length: GRID }, () => Array.from({ length: GRID }, () => [0, 0, 0, 0]));
  const rewards: number[] = [];
  for (let ep = 0; ep < episodes; ep++) {
    let [row, col] = START;
    let total = 0;
    for (let step = 0; step < 40; step++) {
      const eps = Math.max(0.05, 0.6 * (1 - ep / Math.max(1, episodes)));
      const a = r() < eps ? Math.floor(r() * 4) : Q[row][col].indexOf(Math.max(...Q[row][col]));
      const nr = clamp(row + ACTIONS[a][0], 0, GRID - 1);
      const nc = clamp(col + ACTIONS[a][1], 0, GRID - 1);
      let reward = -1;
      let done = false;
      if (nr === GOAL[0] && nc === GOAL[1]) {
        reward = 20;
        done = true;
      } else if (PITS.has(`${nr},${nc}`)) {
        reward = -20;
        done = true;
      }
      const future = done ? 0 : Math.max(...Q[nr][nc]);
      Q[row][col][a] += 0.5 * (reward + 0.9 * future - Q[row][col][a]);
      total += reward;
      row = nr;
      col = nc;
      if (done) break;
    }
    rewards.push(total);
  }
  // Greedy path from start
  const path: string[] = [];
  let [row, col] = START;
  let reached = false;
  for (let i = 0; i < 16; i++) {
    path.push(`${row},${col}`);
    if (row === GOAL[0] && col === GOAL[1]) {
      reached = true;
      break;
    }
    if (PITS.has(`${row},${col}`)) break;
    const a = Q[row][col].indexOf(Math.max(...Q[row][col]));
    row = clamp(row + ACTIONS[a][0], 0, GRID - 1);
    col = clamp(col + ACTIONS[a][1], 0, GRID - 1);
    if (path.includes(`${row},${col}`)) break;
  }
  return { Q, rewards, path, reached };
}

export function LearningTypesSandbox() {
  const [mode, setMode] = useState<'sup' | 'unsup' | 'rl'>('sup');
  const [nLabels, setNLabels] = useState(800);
  const [noise, setNoise] = useState(5);
  const [k, setK] = useState(2);
  const [seed, setSeed] = useState(1);
  const [episodes, setEpisodes] = useState(20);

  const acc = (n: number) => 20 + (95 - noise * 1.15 - 20) * (1 - Math.exp(-n / 1400));
  const curveNs = Array.from({ length: 21 }, (_, i) => i * 500);
  const km = useMemo(() => kmeans(POINTS, k, seed), [k, seed]);
  const elbow = useMemo(() => [1, 2, 3, 4, 5, 6].map((kk) => kmeans(POINTS, kk, 3).inertia), []);
  const q = useMemo(() => trainQ(episodes), [episodes]);
  const smooth = q.rewards.map((_, i, arr) => {
    const w = arr.slice(Math.max(0, i - 9), i + 1);
    return w.reduce((a, b) => a + b, 0) / w.length + 45;
  });

  return (
    <div className="space-y-4">
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'sup', label: 'Supervised' },
          { value: 'unsup', label: 'Unsupervised (k-means)' },
          { value: 'rl', label: 'Reinforcement (Q-learning)' },
        ]}
      />
      {mode === 'sup' && (
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <Card className="space-y-4 bg-slate-50 dark:bg-slate-950/40">
            <Slider label="Labelled examples" value={nLabels} min={50} max={10000} step={50} onChange={setNLabels} format={(v) => num(v)} />
            <Slider label="Label noise (wrong labels)" value={noise} min={0} max={40} onChange={setNoise} format={(v) => `${v}%`} hint="Annotators disagree or rush" />
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Accuracy" value={`${acc(nLabels).toFixed(1)}%`} />
              <Stat label="Labelling cost" value={inrShort(nLabels * 8)} sub="@ ₹8 / label" />
            </div>
          </Card>
          <div>
            <LineChart
              series={[{ name: 'Accuracy vs. number of labels (5 departments)', color: '#6366f1', points: curveNs.map((n) => acc(Math.max(50, n))) }]}
              xLabels={curveNs.map((n, i) => (i % 4 === 0 ? num(n) : ''))}
              yMax={100}
              yFormat={(v) => `${Math.round(v)}%`}
              markerX={Math.round(nLabels / 500)}
            />
            <Callout tone={noise > 15 ? 'danger' : nLabels > 5000 ? 'warn' : 'info'}>
              {noise > 15
                ? `With ${noise}% wrong labels the ceiling drops to ~${(95 - noise * 1.15).toFixed(0)}% no matter how much data you add. Fix label quality before buying more labels.`
                : nLabels > 5000
                  ? 'Diminishing returns: each extra 1,000 labels buys less than a point of accuracy. Spend the money on hard edge cases instead.'
                  : 'Early on, every batch of labels lifts accuracy sharply. Notice the curve flattening as you add more.'}
            </Callout>
          </div>
        </div>
      )}
      {mode === 'unsup' && (
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <Card className="space-y-4 bg-slate-50 dark:bg-slate-950/40">
            <Slider label="Number of clusters (k)" value={k} min={1} max={6} onChange={setK} />
            <Button variant="secondary" size="sm" onClick={() => setSeed(seed + 1)}>
              <RefreshCw className="h-3.5 w-3.5" /> Re-run with new random start
            </Button>
            <Stat label="Inertia (spread within clusters)" value={num(km.inertia)} sub="lower = tighter groups" />
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-500">Elbow chart (inertia per k)</div>
              <div className="flex h-20 items-end gap-1">
                {elbow.map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center">
                    <div className={cx('w-full rounded-t', i + 1 === k ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700')} style={{ height: `${(v / elbow[0]) * 64}px` }} />
                    <span className="text-[10px] text-slate-500">{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <div>
            <svg viewBox="0 0 100 100" className="mx-auto aspect-square w-full max-w-md rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              {POINTS.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r={1.6} fill={CLUSTER_COLORS[km.assign[i]]} className="transition-all duration-500" />
              ))}
              {km.cents.map((c, i) => (
                <g key={i}>
                  <circle cx={c[0]} cy={c[1]} r={3.2} fill="white" stroke={CLUSTER_COLORS[i]} strokeWidth={1.2} />
                  <text x={c[0]} y={c[1] + 1.2} textAnchor="middle" fontSize={3} fontWeight={700} fill={CLUSTER_COLORS[i]}>
                    ?
                  </text>
                </g>
              ))}
            </svg>
            <Callout tone={k === 3 ? 'success' : 'info'}>
              {k === 3
                ? 'k = 3 matches the “elbow” — the natural groups in this data. But notice each centroid is labelled “?”: the algorithm found groups, a human must decide that they mean “pension”, “water supply” and “roads”.'
                : 'Try different k values. Too few clusters merge different issues; too many split one issue into meaningless fragments. Look for the elbow in the chart.'}
            </Callout>
          </div>
        </div>
      )}
      {mode === 'rl' && (
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <Card className="space-y-4 bg-slate-50 dark:bg-slate-950/40">
            <Slider label="Training episodes (attempts)" value={episodes} min={0} max={400} step={10} onChange={setEpisodes} />
            <p className="text-xs text-slate-500">Reward: +20 for reaching the flag, −20 for falling in a pit, −1 per step (so shorter paths are better). Real Q-learning runs in your browser on every change.</p>
            <Stat label="Learned route" value={q.reached ? `Reaches goal in ${q.path.length - 1} steps` : 'Not yet reliable'} tone={q.reached ? 'text-emerald-600' : 'text-rose-600'} />
            <Button variant="secondary" size="sm" onClick={() => setEpisodes(Math.min(400, episodes + 50))}>
              <Play className="h-3.5 w-3.5" /> Train 50 more episodes
            </Button>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid aspect-square grid-cols-5 gap-1 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
              {Array.from({ length: GRID * GRID }, (_, i) => {
                const row = Math.floor(i / GRID);
                const col = i % GRID;
                const key = `${row},${col}`;
                const isGoal = row === GOAL[0] && col === GOAL[1];
                const isPit = PITS.has(key);
                const onPath = q.path.includes(key);
                const best = q.Q[row][col].indexOf(Math.max(...q.Q[row][col]));
                const untrained = q.Q[row][col].every((v) => v === 0);
                const Arrow = [ArrowUp, ArrowDown, ArrowLeft, ArrowRight][best];
                return (
                  <div
                    key={key}
                    className={cx(
                      'flex items-center justify-center rounded-md text-xs transition',
                      isGoal ? 'bg-emerald-500 text-white' : isPit ? 'bg-slate-800 text-rose-400' : onPath ? 'bg-amber-200 dark:bg-amber-800/60' : 'bg-slate-100 dark:bg-slate-800',
                    )}
                  >
                    {isGoal ? <Flag className="h-4 w-4" /> : isPit ? <Skull className="h-4 w-4" /> : untrained ? <span className="text-slate-400">·</span> : <Arrow className="h-4 w-4 text-slate-600 dark:text-slate-300" />}
                  </div>
                );
              })}
            </div>
            <div>
              <LineChart series={[{ name: 'Average reward per episode (smoothed)', color: '#10b981', points: smooth.length ? smooth : [0] }]} height={180} yFormat={(v) => String(Math.round(v - 45))} />
              <Callout tone={q.reached ? 'success' : 'warn'}>
                {episodes === 0
                  ? 'The agent knows nothing yet. Add episodes and watch arrows (its learned strategy) appear.'
                  : q.reached
                    ? 'The agent learned a safe route (highlighted) purely from rewards — nobody showed it the correct path. That is reinforcement learning.'
                    : 'Still exploring: early episodes are mostly random wandering and falling into pits. Keep training.'}
              </Callout>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson 0.3 — Training vs Inference cost crossover                   */
/* ------------------------------------------------------------------ */

export function TrainingInferenceSandbox() {
  const [ftCost, setFtCost] = useState(12); // lakhs
  const [qpd, setQpd] = useState(20000);
  const [cpq, setCpq] = useState(0.8);
  const months = 36;

  const series = useMemo(() => {
    const a: number[] = [];
    const b: number[] = [];
    for (let m = 0; m <= months; m++) {
      const usage = qpd * 30 * m;
      a.push(usage * cpq);
      const retrains = Math.floor(m / 6);
      b.push(ftCost * 1e5 + retrains * ftCost * 1e5 * 0.4 + usage * cpq * 0.3);
    }
    return { a, b };
  }, [ftCost, qpd, cpq]);

  const cross = series.a.findIndex((v, i) => v > series.b[i]);
  const totalB = series.b[months];
  const trainingShareB = ((ftCost * 1e5 + Math.floor(months / 6) * ftCost * 1e5 * 0.4) / totalB) * 100;

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <Card className="space-y-4 bg-slate-50 dark:bg-slate-950/40">
        <Slider label="One-time fine-tuning project" value={ftCost} min={1} max={60} onChange={setFtCost} format={(v) => `₹${v} L`} hint="Re-training every 6 months costs 40% of this" />
        <Slider label="Queries per day" value={qpd} min={500} max={300000} step={500} onChange={setQpd} format={(v) => num(v)} />
        <Slider label="Frontier model cost per query" value={cpq} min={0.05} max={5} step={0.05} onChange={setCpq} format={(v) => inr(v)} hint="Fine-tuned small model costs 30% of this per query" />
      </Card>
      <div className="space-y-3">
        <LineChart
          series={[
            { name: 'A: Prompt a frontier model (no training)', color: '#f43f5e', points: series.a },
            { name: 'B: Fine-tune a small model + cheaper inference', color: '#6366f1', points: series.b },
          ]}
          xLabels={series.a.map((_, i) => (i % 6 === 0 ? `M${i}` : ''))}
          yFormat={(v) => inrShort(v)}
          markerX={cross > 0 ? cross : undefined}
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <Stat label="3-yr cost A" value={inrShort(series.a[months])} />
          <Stat label="3-yr cost B" value={inrShort(totalB)} />
          <Stat label="Break-even" value={cross > 0 ? `Month ${cross}` : 'Never (36 mo)'} tone={cross > 0 ? 'text-emerald-600' : 'text-rose-600'} />
        </div>
        <Callout tone="tip">
          Even in option B, training is only <strong>{trainingShareB.toFixed(0)}%</strong> of the 3-year spend — inference is the rest.{' '}
          {cross > 0
            ? `At this volume fine-tuning pays back in month ${cross}; but only if the fine-tuned model actually meets quality targets in your evals.`
            : 'At this volume the fine-tuning project never pays back — keep prompting the vendor model and revisit if traffic grows.'}
        </Callout>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson 0.4 — Run it five times                                      */
/* ------------------------------------------------------------------ */

const PHRASES = [
  (t: string) => `The total payable is ${t}.`,
  (t: string) => `Including 18% GST, the amount comes to ${t}.`,
  (t: string) => `You will need to pay ${t} in total.`,
  (t: string) => `After adding GST at 18%, the final figure is ${t}.`,
  (t: string) => `Total (with GST): ${t}.`,
];
const EMBELLISH = [' This is as per the revised 2024 GST slab for services.', ' Note: a 2% late fee may also apply.', ' This rate is fixed under Section 9(4).'];

export function DeterminismSandbox() {
  const [amount, setAmount] = useState(10000);
  const [temp, setTemp] = useState(0.7);
  const [seed, setSeed] = useState(1);
  const correct = amount * 1.18;
  const fmt = (v: number) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const runs = useMemo(() => {
    const r = rng(seed * 997 + Math.round(temp * 100));
    return Array.from({ length: 5 }, () => {
      const phraseIdx = temp < 0.05 ? 0 : Math.floor(r() * Math.min(PHRASES.length, 1 + Math.ceil(temp * 5)));
      const wrongNum = r() < temp * temp * 0.35;
      const embellish = r() < temp * temp * 0.3;
      const value = wrongNum ? [amount * 1.188, amount * 1.08, amount * 1.18 + 100][Math.floor(r() * 3)] : correct;
      const text = PHRASES[phraseIdx](fmt(value)) + (embellish ? EMBELLISH[Math.floor(r() * EMBELLISH.length)] : '');
      return { text, ok: !wrongNum, embellish };
    });
  }, [seed, temp, amount, correct]);

  const unique = new Set(runs.map((r) => r.text)).size;
  const okCount = runs.filter((r) => r.ok && !r.embellish).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Slider label="Invoice amount" value={amount} min={1000} max={100000} step={500} onChange={setAmount} format={(v) => fmt(v)} />
        <Slider label="LLM temperature" value={temp} min={0} max={1} step={0.05} onChange={setTemp} format={(v) => v.toFixed(2)} />
        <div className="flex items-end">
          <Button onClick={() => setSeed(seed + 1)} className="w-full">
            <RefreshCw className="h-4 w-4" /> Run 5×
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border-2 border-sky-200 p-3 dark:border-sky-900">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-sky-700 dark:text-sky-300">
            <Calculator className="h-4 w-4" /> Deterministic calculator
            <Badge tone="green">5/5 identical</Badge>
          </div>
          <ol className="space-y-1.5">
            {runs.map((_, i) => (
              <li key={i} className="rounded-lg bg-sky-50 px-2.5 py-1.5 font-mono text-xs dark:bg-sky-950/40">
                #{i + 1} total = {fmt(correct)}
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl border-2 border-rose-200 p-3 dark:border-rose-900">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-bold text-rose-700 dark:text-rose-300">
            <Bot className="h-4 w-4" /> Simulated LLM
            <Badge tone={unique === 1 ? 'green' : 'amber'}>{unique} distinct outputs</Badge>
            <Badge tone={okCount === 5 ? 'green' : 'red'}>{okCount}/5 fully correct</Badge>
          </div>
          <ol className="space-y-1.5">
            {runs.map((r, i) => (
              <li
                key={i}
                className={cx(
                  'rounded-lg px-2.5 py-1.5 text-xs',
                  !r.ok ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200' : r.embellish ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-slate-50 dark:bg-slate-800',
                )}
              >
                #{i + 1} {r.text} {!r.ok && <strong>← wrong number</strong>} {r.ok && r.embellish && <strong>← invented detail</strong>}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <Callout tone={temp === 0 ? 'success' : temp > 0.6 ? 'warn' : 'info'}>
        {temp === 0
          ? 'At temperature 0 the simulated LLM always picks its single most likely answer — consistent, but consistency is not the same as correctness. Exact numbers should still come from code.'
          : `Same question, ${unique} different phrasings. Wording variety is fine; wrong numbers or invented legal references are not. This is why AI UAT uses many runs and rubrics, and why the safest design lets the LLM call the calculator as a tool.`}
      </Callout>
    </div>
  );
}
