import { useState } from 'react';
import { Lightbulb, Wand2, IndianRupee, DollarSign, TrendingUp } from 'lucide-react';
import { Badge, Button, Callout, Card, Meter, Missions, SectionLabel, Segmented, Slider, Stat, cx } from '../components/ui';
import { MODEL_TIERS, type ModelTier } from '../data/models';
import { inr, inrShort, num, usd } from '../lib/format';
import { useLabData, useProgress } from '../store/progress';

interface Inputs {
  dau: number;
  qpu: number;
  sysTok: number;
  varTok: number;
  outTok: number;
  cachePct: number;
  tier: ModelTier['id'];
  days: number;
  infraInr: number;
  evalRuns: number;
  budgetL: number;
  routerPct: number;
}

const DEFAULTS: Inputs = { dau: 20000, qpu: 3, sysTok: 2500, varTok: 3500, outTok: 450, cachePct: 0, tier: 'frontier', days: 30, infraInr: 60000, evalRuns: 8, budgetL: 12, routerPct: 0 };

function compute(i: Inputs, fx: number) {
  const tier = MODEL_TIERS.find((t) => t.id === i.tier)!;
  const small = MODEL_TIERS[0];
  const queries = i.dau * i.qpu * i.days;
  const perQuery = (t: ModelTier) => {
    const cached = i.sysTok * (i.cachePct / 100);
    const uncachedIn = i.sysTok - cached + i.varTok;
    return {
      inUncached: (uncachedIn / 1e6) * t.inputPerM,
      inCached: (cached / 1e6) * t.inputPerM * t.cachedInputFactor,
      out: (i.outTok / 1e6) * t.outputPerM,
      think: ((i.outTok * t.thinkingMultiplier) / 1e6) * t.outputPerM,
    };
  };
  const main = perQuery(tier);
  const sm = perQuery(small);
  const share = i.routerPct / 100; // share routed to the small model
  const blend = (k: keyof typeof main) => main[k] * (1 - share) + sm[k] * share;
  const pq = { inUncached: blend('inUncached'), inCached: blend('inCached'), out: blend('out'), think: blend('think') };
  const tokenUsdPerQuery = pq.inUncached + pq.inCached + pq.out + pq.think;
  const tokenUsd = tokenUsdPerQuery * queries;
  const evalUsd = i.evalRuns * 200 * 3 * (((i.sysTok + i.varTok) / 1e6) * 3 + (i.outTok / 1e6) * 15 + (1500 / 1e6) * 3);
  const infraUsd = i.infraInr / fx;
  const totalUsd = tokenUsd + evalUsd + infraUsd;
  return {
    queries,
    parts: [
      { name: 'Input (uncached)', usd: pq.inUncached * queries, c: 'bg-sky-500' },
      { name: 'Input (cached)', usd: pq.inCached * queries, c: 'bg-emerald-500' },
      { name: 'Output', usd: pq.out * queries, c: 'bg-rose-500' },
      { name: 'Hidden thinking', usd: pq.think * queries, c: 'bg-violet-500' },
      { name: 'Eval runs', usd: evalUsd, c: 'bg-amber-500' },
      { name: 'Infra (vector DB, hosting, monitoring)', usd: infraUsd, c: 'bg-slate-500' },
    ],
    tokenUsd,
    totalUsd,
    totalInr: totalUsd * fx,
    perQueryInr: (totalUsd * fx) / Math.max(1, queries),
    perUserInr: (totalUsd * fx) / Math.max(1, i.dau),
  };
}

export default function Lab5BFinOps() {
  const { state, setFxRate } = useProgress();
  const fx = state.settings.fxRate;
  const [inp, setInp] = useLabData<Inputs>('lab-5b:inputs', DEFAULTS);
  const [tiersTried, setTiersTried] = useState<Set<string>>(new Set([inp.tier]));
  const [applied, setApplied] = useState(0);
  const [sawCaching, setSawCaching] = useState(false);
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => {
    setInp({ ...inp, [k]: v });
    if (k === 'tier') setTiersTried(new Set([...tiersTried, v as string]));
    if (k === 'cachePct' && (v as number) >= 50) setSawCaching(true);
  };
  const r = compute(inp, fx);
  const maxPart = r.totalUsd || 1;
  const budget = inp.budgetL * 1e5;

  // Optimisation tips with computed savings
  const tips: { title: string; detail: string; saving: number; apply: Partial<Inputs> }[] = [];
  const tryIt = (patch: Partial<Inputs>) => r.totalInr - compute({ ...inp, ...patch }, fx).totalInr;
  const outShare = r.parts[2].usd / Math.max(1e-9, r.tokenUsd);
  if (outShare > 0.3 && inp.outTok > 200) tips.push({ title: `Cap output at ${Math.round(inp.outTok * 0.65)} tokens`, detail: `Output is ${(outShare * 100).toFixed(0)}% of token spend. Ask for concise answers and set max_tokens.`, saving: tryIt({ outTok: Math.round(inp.outTok * 0.65) }), apply: { outTok: Math.round(inp.outTok * 0.65) } });
  if (inp.cachePct < 85 && inp.sysTok >= 800) tips.push({ title: 'Cache the static prompt prefix (90% hit rate)', detail: `Your ${num(inp.sysTok)}-token system prompt is re-sent on every call. Put static content first and enable prompt caching.`, saving: tryIt({ cachePct: 90 }), apply: { cachePct: 90 } });
  if ((inp.tier === 'frontier' || inp.tier === 'reasoning') && inp.routerPct < 60) tips.push({ title: 'Route 70% of easy traffic to the small model', detail: 'A router or cascade sends simple queries to a cheap model and escalates the rest. Validate on your golden set first.', saving: tryIt({ routerPct: 70 }), apply: { routerPct: 70 } });
  if (inp.varTok > 2500) tips.push({ title: `Trim RAG context to ${num(Math.round(inp.varTok * 0.6))} tokens`, detail: 'Fewer, better chunks (reranker, top-K 5 → 3) cut input tokens and often improve faithfulness.', saving: tryIt({ varTok: Math.round(inp.varTok * 0.6) }), apply: { varTok: Math.round(inp.varTok * 0.6) } });
  if (inp.tier === 'reasoning') tips.push({ title: 'Use a non-reasoning frontier model for routine queries', detail: 'Hidden thinking tokens are billed as output. Reserve reasoning models for genuinely hard cases.', saving: tryIt({ tier: 'frontier' }), apply: { tier: 'frontier' } });
  tips.sort((a, b) => b.saving - a.saving);

  const growth3x = compute({ ...inp, dau: inp.dau * 3 }, fx).totalInr;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <Card className="space-y-3">
          <SectionLabel className="mb-0">Usage</SectionLabel>
          <Slider label="Daily active users" value={inp.dau} min={100} max={1000000} step={100} onChange={(v) => set('dau', v)} format={num} />
          <Slider label="Queries per user per day" value={inp.qpu} min={0.5} max={20} step={0.5} onChange={(v) => set('qpu', v)} />
          <Slider label="Days per month" value={inp.days} min={20} max={31} onChange={(v) => set('days', v)} hint="Use 22 for office-hours-only tools" />
          <SectionLabel className="mb-0 pt-2">Tokens per query</SectionLabel>
          <Slider label="System prompt (static, cacheable)" value={inp.sysTok} min={0} max={10000} step={100} onChange={(v) => set('sysTok', v)} format={(v) => `${num(v)} tok`} />
          <Slider label="Variable input (RAG + history + question)" value={inp.varTok} min={50} max={20000} step={50} onChange={(v) => set('varTok', v)} format={(v) => `${num(v)} tok`} />
          <Slider label="Output tokens" value={inp.outTok} min={20} max={3000} step={10} onChange={(v) => set('outTok', v)} format={(v) => `${num(v)} tok`} />
          <Slider label="Prompt-cache hit rate on static prefix" value={inp.cachePct} min={0} max={100} step={5} onChange={(v) => set('cachePct', v)} format={(v) => `${v}%`} />
          <SectionLabel className="mb-0 pt-2">Model & architecture</SectionLabel>
          <Segmented size="sm" value={inp.tier} onChange={(v) => set('tier', v)} options={MODEL_TIERS.map((t) => ({ value: t.id, label: t.name.split(' ')[0] }))} />
          <Slider label="Share routed to the small model" value={inp.routerPct} min={0} max={90} step={5} onChange={(v) => set('routerPct', v)} format={(v) => `${v}%`} hint="0% = no router" />
          <SectionLabel className="mb-0 pt-2">Overheads & finance</SectionLabel>
          <Slider label="Infra: vector DB, hosting, monitoring" value={inp.infraInr} min={0} max={500000} step={5000} onChange={(v) => set('infraInr', v)} format={inr} />
          <Slider label="Eval-suite runs per month" value={inp.evalRuns} min={0} max={60} onChange={(v) => set('evalRuns', v)} hint="200 cases × 3 runs + LLM judge, each" />
          <Slider label="Monthly budget" value={inp.budgetL} min={1} max={200} onChange={(v) => set('budgetL', v)} format={(v) => `₹${v} L`} />
          <Slider label="Exchange rate (₹ per $)" value={fx} min={70} max={110} step={0.5} onChange={setFxRate} format={(v) => `₹${v}`} />
          <Button variant="ghost" size="sm" onClick={() => setInp(DEFAULTS)}>
            Reset to defaults
          </Button>
        </Card>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-white/80">
                <IndianRupee className="h-3.5 w-3.5" /> Monthly cost (INR)
              </div>
              <div className="mt-1 text-3xl font-extrabold">{inrShort(r.totalInr)}</div>
              <div className="text-sm text-white/80">{inr(r.totalInr)} · annual {inrShort(r.totalInr * 12)}</div>
            </Card>
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-white/70">
                <DollarSign className="h-3.5 w-3.5" /> Monthly cost (USD)
              </div>
              <div className="mt-1 text-3xl font-extrabold">{usd(r.totalUsd)}</div>
              <div className="text-sm text-white/70">annual {usd(r.totalUsd * 12)}</div>
            </Card>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <Stat label="Queries / month" value={num(r.queries)} />
            <Stat label="Cost per query" value={inr(r.perQueryInr)} tone={r.perQueryInr < 0.25 ? 'text-emerald-600' : r.perQueryInr > 1 ? 'text-rose-600' : undefined} />
            <Stat label="Cost per user / month" value={inr(r.perUserInr)} />
            <Stat label="At 3× users" value={inrShort(growth3x)} sub={growth3x > budget ? 'exceeds budget' : 'within budget'} tone={growth3x > budget ? 'text-rose-600' : 'text-emerald-600'} />
          </div>
          <Card>
            <SectionLabel>Where the money goes</SectionLabel>
            <div className="flex h-8 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
              {r.parts.map((p) => (
                <div key={p.name} className={cx('h-full transition-all duration-500', p.c)} style={{ width: `${(p.usd / maxPart) * 100}%` }} title={`${p.name}: ${inrShort(p.usd * fx)}`} />
              ))}
            </div>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {r.parts.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-xs">
                  <span className={cx('h-2.5 w-2.5 rounded', p.c)} />
                  <span className="flex-1 text-slate-600 dark:text-slate-300">{p.name}</span>
                  <span className="font-mono">{inrShort(p.usd * fx)}</span>
                  <span className="w-10 text-right text-slate-400">{((p.usd / maxPart) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Meter label={`Budget used (₹${inp.budgetL} L)`} value={Math.min(100, (r.totalInr / budget) * 100)} invert suffix="%" />
            </div>
          </Card>

          <Card>
            <SectionLabel className="flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" /> Cost optimisation tips (computed for your scenario)
            </SectionLabel>
            {tips.length === 0 ? (
              <p className="text-sm text-slate-500">Nicely optimised — no big wins left. Focus on quality and growth headroom.</p>
            ) : (
              <ul className="space-y-2">
                {tips.map((t) => (
                  <li key={t.title} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{t.title}</div>
                      <div className="text-xs text-slate-500">{t.detail}</div>
                    </div>
                    <Badge tone="green">saves {inrShort(t.saving)}/mo</Badge>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setInp({ ...inp, ...t.apply });
                        if (t.apply.tier) setTiersTried(new Set([...tiersTried, t.apply.tier]));
                        if ((t.apply.cachePct ?? 0) >= 50) setSawCaching(true);
                        setApplied(applied + 1);
                      }}
                    >
                      <Wand2 className="h-3.5 w-3.5" /> Apply
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padded={false} className="overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-2.5 text-sm font-bold dark:border-slate-800">Same workload, every model tier</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-3 py-2">Tier</th>
                    <th className="px-2 py-2">Monthly (₹)</th>
                    <th className="px-2 py-2">Monthly ($)</th>
                    <th className="px-2 py-2">Per query</th>
                    <th className="px-2 py-2">vs. budget</th>
                  </tr>
                </thead>
                <tbody>
                  {MODEL_TIERS.map((t) => {
                    const x = compute({ ...inp, tier: t.id }, fx);
                    return (
                      <tr key={t.id} className={cx('border-t border-slate-100 dark:border-slate-800', t.id === inp.tier && 'bg-indigo-50 dark:bg-indigo-950/30')}>
                        <td className="px-3 py-2 font-semibold">{t.name}</td>
                        <td className="px-2 py-2 font-mono">{inrShort(x.totalInr)}</td>
                        <td className="px-2 py-2 font-mono">{usd(x.totalUsd)}</td>
                        <td className="px-2 py-2 font-mono">{inr(x.perQueryInr)}</td>
                        <td className="px-2 py-2">{x.totalInr <= budget ? <Badge tone="green">{((x.totalInr / budget) * 100).toFixed(0)}%</Badge> : <Badge tone="red">{((x.totalInr / budget) * 100).toFixed(0)}%</Badge>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Callout tone="info" title="How to present this to finance">
            <span className="flex items-start gap-1.5">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />
              Show three numbers: cost per successful outcome (not per call), monthly cost at today’s and 3× volume, and the optimisation roadmap with savings. Always state assumptions (tokens, cache rate, FX) — and update them with production telemetry after launch.
            </span>
          </Callout>
        </div>
      </div>

      <Missions
        labId="lab-5b"
        missions={[
          { id: 'cheap', label: 'Bring cost per query under ₹0.25 without dropping users', done: r.perQueryInr < 0.25 && inp.dau >= DEFAULTS.dau },
          { id: 'cache', label: 'Turn prompt caching up to at least 50% and watch input cost fall', done: sawCaching },
          { id: 'tiers', label: 'Compare at least 3 model tiers for the same workload', done: tiersTried.size >= 3 },
          { id: 'apply', label: 'Apply two optimisation tips', done: applied >= 2 },
          { id: 'budget', label: 'Fit the 3× growth scenario inside your budget', done: growth3x <= budget },
        ]}
      />
    </div>
  );
}
