import { useEffect, useState } from 'react';
import { Award, Ban, Briefcase, Server, Cloud, Route as RouteIcon, Brain, Zap } from 'lucide-react';
import { Badge, Callout, Card, Missions, SectionLabel, Segmented, Slider, Stat, Toggle, cx } from '../components/ui';
import { inrShort, num } from '../lib/format';
import { useProgress } from '../store/progress';

type Sov = 'none' | 'india' | 'onprem';
type Complexity = 'simple' | 'moderate' | 'complex' | 'expert';
const CX_INDEX: Record<Complexity, number> = { simple: 0, moderate: 1, complex: 2, expert: 3 };
const MIN_QUALITY: Record<Complexity, number> = { simple: 80, moderate: 82, complex: 82, expert: 88 };

interface Strategy {
  id: string;
  name: string;
  icon: typeof Cloud;
  blurb: string;
  sov: Sov; // strongest sovereignty level it satisfies
  quality: [number, number, number, number];
  p95: number;
  usdPerM?: number; // API blended price
  fixedInrMonthly?: number; // self-hosting base
  capacityMTok?: number; // tokens (millions) per node per month
  nodeInr?: number;
  needsMlops: boolean;
  customisation: number;
  simplicity: number;
}

const STRATEGIES: Strategy[] = [
  { id: 'frontier', name: 'Frontier closed API (global region)', icon: Cloud, blurb: 'Best general quality, zero infra, data processed abroad under contract.', sov: 'none', quality: [94, 92, 88, 80], p95: 3.5, usdPerM: 6, needsMlops: false, customisation: 40, simplicity: 100 },
  { id: 'frontier-in', name: 'Frontier API via in-country cloud region', icon: Cloud, blurb: 'Same models hosted in an Indian region via a hyperscaler; meets residency rules.', sov: 'india', quality: [94, 92, 88, 80], p95: 3.8, usdPerM: 6.6, needsMlops: false, customisation: 40, simplicity: 95 },
  { id: 'small', name: 'Small / fast closed API', icon: Zap, blurb: 'Cheap and fast; great for classification and extraction at scale.', sov: 'india', quality: [88, 74, 55, 40], p95: 1.2, usdPerM: 0.35, needsMlops: false, customisation: 40, simplicity: 100 },
  { id: 'reasoning', name: 'Reasoning / thinking model API', icon: Brain, blurb: 'Thinks before answering — top accuracy on hard multi-step problems, slow and pricey.', sov: 'none', quality: [94, 93, 95, 93], p95: 22, usdPerM: 28, needsMlops: false, customisation: 20, simplicity: 95 },
  { id: 'router', name: 'Hybrid router: small API + frontier escalation', icon: RouteIcon, blurb: '~80% of traffic to the small model, low-confidence cases escalated.', sov: 'india', quality: [92, 89, 83, 74], p95: 3.2, usdPerM: 1.5, needsMlops: false, customisation: 45, simplicity: 80 },
  { id: 'os-small', name: 'Open-weights small (~8B) self-hosted', icon: Server, blurb: 'Runs on a single GPU server on-prem; full control, modest quality.', sov: 'onprem', quality: [84, 70, 50, 36], p95: 1, fixedInrMonthly: 6e5, nodeInr: 3e5, capacityMTok: 1500, needsMlops: true, customisation: 100, simplicity: 30 },
  { id: 'os-large', name: 'Open-weights large (~70B) self-hosted', icon: Server, blurb: 'Near-frontier quality on your own GPUs; expensive hardware and ops.', sov: 'onprem', quality: [91, 87, 80, 70], p95: 3, fixedInrMonthly: 8e5, nodeInr: 1.2e6, capacityMTok: 600, needsMlops: true, customisation: 100, simplicity: 25 },
  { id: 'os-router', name: 'Self-hosted router: small + large open models', icon: RouteIcon, blurb: 'On-prem cascade: the small model handles most, the large one the hard cases.', sov: 'onprem', quality: [89, 84, 76, 64], p95: 2.6, fixedInrMonthly: 1e6, nodeInr: 1.5e6, capacityMTok: 1200, needsMlops: true, customisation: 100, simplicity: 20 },
];

const SOV_RANK: Record<Sov, number> = { none: 0, india: 1, onprem: 2 };

interface Inputs {
  sov: Sov;
  budgetL: number;
  sla: number;
  complexity: Complexity;
  volume: number;
  tokens: number;
  custom: boolean;
  mlops: boolean;
}

const PRESETS: { label: string; desc: string; v: Inputs }[] = [
  { label: 'State police FIR summariser', desc: 'Air-gapped network, 3,000 FIRs/day, summaries for officers.', v: { sov: 'onprem', budgetL: 30, sla: 8, complexity: 'moderate', volume: 3000, tokens: 6000, custom: true, mlops: true } },
  { label: 'National citizen helpline bot', desc: '5 lakh queries/day, India residency, chat latency.', v: { sov: 'india', budgetL: 60, sla: 4, complexity: 'moderate', volume: 500000, tokens: 2500, custom: false, mlops: false } },
  { label: 'Ministry legal-opinion drafting', desc: 'Low volume, very complex reasoning, quality first.', v: { sov: 'none', budgetL: 10, sla: 60, complexity: 'expert', volume: 150, tokens: 30000, custom: false, mlops: false } },
];

function evaluate(s: Strategy, inp: Inputs, fx: number) {
  const monthlyMTok = (inp.volume * 30 * inp.tokens) / 1e6;
  let monthlyInr: number;
  if (s.usdPerM !== undefined) monthlyInr = monthlyMTok * s.usdPerM * fx;
  else {
    const nodes = Math.max(1, Math.ceil(monthlyMTok / s.capacityMTok!));
    monthlyInr = s.fixedInrMonthly! + nodes * s.nodeInr!;
  }
  const quality = s.quality[CX_INDEX[inp.complexity]];
  const reasons: string[] = [];
  if (SOV_RANK[s.sov] < SOV_RANK[inp.sov]) reasons.push(inp.sov === 'onprem' ? 'Data cannot leave your premises' : 'Data must stay in India');
  if (s.p95 > inp.sla) reasons.push(`p95 ${s.p95}s exceeds ${inp.sla}s SLA`);
  if (monthlyInr > inp.budgetL * 1e5) reasons.push(`${inrShort(monthlyInr)}/mo exceeds budget`);
  if (quality < MIN_QUALITY[inp.complexity]) reasons.push(`Quality ${quality} below ${MIN_QUALITY[inp.complexity]} needed for ${inp.complexity} tasks`);
  if (s.needsMlops && !inp.mlops) reasons.push('Needs a GPU/MLOps team you don’t have');
  const costScore = Math.max(0, 100 - (monthlyInr / (inp.budgetL * 1e5)) * 100);
  const latScore = Math.max(0, 100 - (s.p95 / inp.sla) * 100);
  const score = quality * 0.4 + costScore * 0.25 + latScore * 0.15 + s.simplicity * 0.1 + (inp.custom ? s.customisation : 50) * 0.1;
  return { s, monthlyInr, quality, reasons, score, eliminated: reasons.length > 0 };
}

export default function Lab2BRecommender() {
  const { state } = useProgress();
  const fx = state.settings.fxRate;
  const [inp, setInp] = useState<Inputs>({ sov: 'none', budgetL: 15, sla: 5, complexity: 'moderate', volume: 2000, tokens: 3000, custom: false, mlops: false });
  const [presetsTried, setPresetsTried] = useState<Set<number>>(new Set());
  const [seen, setSeen] = useState({ onprem: false, router: false, reasoning: false });
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setInp({ ...inp, [k]: v });

  const results = STRATEGIES.map((s) => evaluate(s, inp, fx)).sort((a, b) => (a.eliminated === b.eliminated ? b.score - a.score : a.eliminated ? 1 : -1));
  const winner = results.find((r) => !r.eliminated);
  const apisEliminated = inp.sov === 'onprem' && results.filter((r) => r.s.usdPerM !== undefined).every((r) => r.eliminated);
  const winnerId = winner?.s.id;
  useEffect(() => {
    setSeen((prev) => ({
      onprem: prev.onprem || apisEliminated,
      router: prev.router || winnerId === 'router' || winnerId === 'os-router',
      reasoning: prev.reasoning || winnerId === 'reasoning',
    }));
  }, [apisEliminated, winnerId]);

  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel className="flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5" /> Client briefs (load a preset or set your own constraints)
        </SectionLabel>
        <div className="grid gap-2 md:grid-cols-3">
          {PRESETS.map((p, i) => (
            <button
              type="button"
              key={p.label}
              onClick={() => {
                setInp(p.v);
                setPresetsTried(new Set([...presetsTried, i]));
              }}
              className="rounded-xl border border-slate-200 p-3 text-left text-sm transition hover:border-indigo-400 dark:border-slate-700"
            >
              <div className="font-semibold">{p.label}</div>
              <div className="text-xs text-slate-500">{p.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
        <Card className="space-y-4">
          <SectionLabel className="mb-0">Project constraints</SectionLabel>
          <div>
            <div className="mb-1.5 text-sm font-medium">Data sovereignty</div>
            <Segmented size="sm" value={inp.sov} onChange={(v) => set('sov', v)} options={[{ value: 'none', label: 'No restriction' }, { value: 'india', label: 'India-only' }, { value: 'onprem', label: 'On-prem / air-gapped' }]} />
          </div>
          <div>
            <div className="mb-1.5 text-sm font-medium">Task complexity</div>
            <Segmented size="sm" value={inp.complexity} onChange={(v) => set('complexity', v)} options={[{ value: 'simple', label: 'Simple' }, { value: 'moderate', label: 'Moderate' }, { value: 'complex', label: 'Complex' }, { value: 'expert', label: 'Expert' }]} />
            <p className="mt-1 text-[11px] text-slate-500">
              {inp.complexity === 'simple' && 'Classification, extraction, routing'}
              {inp.complexity === 'moderate' && 'RAG Q&A, summaries, drafting'}
              {inp.complexity === 'complex' && 'Multi-step analysis, agents'}
              {inp.complexity === 'expert' && 'Legal/financial reasoning, high stakes'}
            </p>
          </div>
          <Slider label="Monthly budget ceiling" value={inp.budgetL} min={0.5} max={100} step={0.5} onChange={(v) => set('budgetL', v)} format={(v) => `₹${v} L`} />
          <Slider label="Latency SLA (p95)" value={inp.sla} min={0.5} max={60} step={0.5} onChange={(v) => set('sla', v)} format={(v) => `${v}s`} />
          <Slider label="Requests per day" value={inp.volume} min={100} max={1000000} step={100} onChange={(v) => set('volume', v)} format={num} />
          <Slider label="Tokens per request (in + out)" value={inp.tokens} min={300} max={40000} step={100} onChange={(v) => set('tokens', v)} format={num} />
          <Toggle label="Need deep customisation / fine-tuning control" checked={inp.custom} onChange={(v) => set('custom', v)} />
          <Toggle label="We have a GPU / MLOps team" checked={inp.mlops} onChange={(v) => set('mlops', v)} />
        </Card>

        <div className="space-y-4">
          {winner ? (
            <Card className="border-2 border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <winner.s.icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <Badge tone="green">
                    <Award className="h-3 w-3" /> Recommended strategy
                  </Badge>
                  <div className="mt-1 text-lg font-bold">{winner.s.name}</div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{winner.s.blurb}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                <Stat label="Quality" value={winner.quality} />
                <Stat label="p95 latency" value={`${winner.s.p95}s`} />
                <Stat label="Monthly cost" value={inrShort(winner.monthlyInr)} />
                <Stat label="Score" value={winner.score.toFixed(0)} />
              </div>
            </Card>
          ) : (
            <Callout tone="danger" title="No strategy satisfies all constraints">
              Every option breaks at least one hard constraint. This is a real and common outcome: go back to stakeholders with the trade-off — raise the budget, relax the latency SLA, reduce scope, or invest in an MLOps team.
            </Callout>
          )}
          <Card padded={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-3 py-2">Strategy</th>
                    <th className="px-2 py-2">Quality</th>
                    <th className="px-2 py-2">p95</th>
                    <th className="px-2 py-2">Monthly</th>
                    <th className="px-2 py-2">Sovereignty</th>
                    <th className="px-2 py-2">Ops</th>
                    <th className="px-2 py-2">Score / status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.s.id} className={cx('border-t border-slate-100 dark:border-slate-800', r.eliminated && 'bg-slate-50/60 text-slate-400 dark:bg-slate-900/40', winner?.s.id === r.s.id && 'bg-emerald-50 dark:bg-emerald-950/30')}>
                      <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                        <span className={cx(r.eliminated && 'line-through decoration-rose-400')}>{r.s.name}</span>
                      </td>
                      <td className={cx('px-2 py-2 font-mono', r.quality < MIN_QUALITY[inp.complexity] && 'text-rose-500')}>{r.quality}</td>
                      <td className={cx('px-2 py-2 font-mono', r.s.p95 > inp.sla && 'text-rose-500')}>{r.s.p95}s</td>
                      <td className={cx('px-2 py-2 font-mono', r.monthlyInr > inp.budgetL * 1e5 && 'text-rose-500')}>{inrShort(r.monthlyInr)}</td>
                      <td className={cx('px-2 py-2', SOV_RANK[r.s.sov] < SOV_RANK[inp.sov] && 'text-rose-500')}>{r.s.sov === 'onprem' ? 'On-prem' : r.s.sov === 'india' ? 'India' : 'Global'}</td>
                      <td className="px-2 py-2">{r.s.needsMlops ? 'Heavy' : 'Light'}</td>
                      <td className="px-2 py-2">
                        {r.eliminated ? (
                          <span className="flex items-start gap-1 text-rose-600 dark:text-rose-400">
                            <Ban className="mt-0.5 h-3 w-3 shrink-0" /> {r.reasons[0]}
                            {r.reasons.length > 1 && ` (+${r.reasons.length - 1})`}
                          </span>
                        ) : (
                          <span className="font-bold text-slate-800 dark:text-slate-100">{r.score.toFixed(0)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-200 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-800">
              Score = quality 40% · cost headroom 25% · latency headroom 15% · operational simplicity 10% · customisation 10%. Figures are illustrative planning numbers — validate with real evals and quotes.
            </div>
          </Card>
          <Callout tone="tip" title="How a Chief AI PM uses this matrix">
            Hard constraints (sovereignty, SLA, budget, minimum quality) eliminate options before any beauty contest. Then shortlist the top 2–3 and run them on your golden dataset — the matrix tells you what to test, evals tell you what to buy.
          </Callout>
        </div>
      </div>

      <Missions
        labId="lab-2b"
        missions={[
          { id: 'onprem', label: 'Require on-prem deployment and watch every API option get eliminated', done: seen.onprem },
          { id: 'router', label: 'Find a constraint set where a hybrid router is the winner', done: seen.router },
          { id: 'reasoning', label: 'Find a constraint set where a reasoning model is the winner', done: seen.reasoning },
          { id: 'presets', label: 'Evaluate all 3 client briefs', done: presetsTried.size >= 3 },
        ]}
      />
    </div>
  );
}
