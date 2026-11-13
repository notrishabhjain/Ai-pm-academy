import { useEffect, useMemo, useState } from 'react';
import { MousePointerClick, Search, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { Badge, Button, Callout, Card, HBar, Missions, SectionLabel, cx } from '../components/ui';
import { cosine } from '../lib/math';

const DIMS = ['Govt service', 'ID / document', 'Travel', 'Energy', 'Hardware', 'Money', 'Health', 'Digital / IT'];


interface Concept {
  name: string;
  v: number[];
  group: 'gov' | 'energy' | 'money' | 'health' | 'it';
  /** Hand-placed 2D projection of the hidden vector (for a readable map). */
  xy: [number, number];
}

const CONCEPTS: Concept[] = [
  { name: 'Citizen Application', v: [0.9, 0.6, 0.1, 0, 0, 0.1, 0.05, 0.2], group: 'gov', xy: [38, 50] },
  { name: 'Passport Form', v: [0.8, 0.9, 0.8, 0, 0, 0.05, 0, 0.1], group: 'gov', xy: [27, 22] },
  { name: 'Visa Application', v: [0.7, 0.85, 0.95, 0, 0, 0.1, 0, 0.1], group: 'gov', xy: [14, 14] },
  { name: 'Aadhaar Update', v: [0.85, 0.9, 0, 0, 0, 0.05, 0, 0.35], group: 'gov', xy: [34, 34] },
  { name: 'Birth Certificate', v: [0.85, 0.9, 0, 0, 0, 0, 0.25, 0.05], group: 'gov', xy: [19, 45] },
  { name: 'Driving Licence', v: [0.75, 0.9, 0.35, 0, 0.1, 0, 0, 0.1], group: 'gov', xy: [11, 32] },
  { name: 'Solar Inverter', v: [0, 0, 0, 0.95, 0.9, 0.05, 0, 0.15], group: 'energy', xy: [73, 35] },
  { name: 'Battery Storage', v: [0, 0, 0, 0.9, 0.85, 0.05, 0, 0.1], group: 'energy', xy: [89, 29] },
  { name: 'Wind Turbine', v: [0, 0, 0, 0.95, 0.8, 0, 0, 0], group: 'energy', xy: [80, 19] },
  { name: 'Power Grid', v: [0.3, 0, 0, 0.95, 0.6, 0.05, 0, 0.2], group: 'energy', xy: [86, 45] },
  { name: 'Electricity Bill', v: [0.3, 0.3, 0, 0.7, 0, 0.75, 0, 0.1], group: 'money', xy: [80, 58] },
  { name: 'Tax Return', v: [0.6, 0.5, 0, 0, 0, 0.95, 0, 0.2], group: 'money', xy: [56, 58] },
  { name: 'GST Filing', v: [0.6, 0.45, 0, 0, 0, 0.95, 0, 0.3], group: 'money', xy: [67, 67] },
  { name: 'Invoice', v: [0.1, 0.5, 0, 0, 0, 0.9, 0, 0.15], group: 'money', xy: [66, 84] },
  { name: 'Pension Payment', v: [0.7, 0.2, 0, 0, 0, 0.85, 0.15, 0.05], group: 'money', xy: [50, 73] },
  { name: 'Hospital Admission', v: [0.2, 0.3, 0, 0, 0.1, 0.2, 0.95, 0.05], group: 'health', xy: [36, 82] },
  { name: 'Vaccination Record', v: [0.45, 0.65, 0.15, 0, 0, 0, 0.9, 0.1], group: 'health', xy: [24, 63] },
  { name: 'Password Reset', v: [0.1, 0.1, 0, 0, 0.1, 0, 0, 0.95], group: 'it', xy: [48, 10] },
  { name: 'Cloud Server', v: [0, 0, 0, 0.15, 0.7, 0, 0, 0.95], group: 'it', xy: [67, 9] },
  { name: 'Software Bug', v: [0, 0, 0, 0, 0.2, 0, 0, 0.95], group: 'it', xy: [57, 22] },
];

const GROUP_COLOR: Record<Concept['group'], { fill: string; text: string; label: string }> = {
  gov: { fill: '#6366f1', text: 'text-indigo-600', label: 'Govt documents' },
  energy: { fill: '#f59e0b', text: 'text-amber-600', label: 'Energy' },
  money: { fill: '#10b981', text: 'text-emerald-600', label: 'Money' },
  health: { fill: '#f43f5e', text: 'text-rose-600', label: 'Health' },
  it: { fill: '#06b6d4', text: 'text-cyan-600', label: 'Digital / IT' },
};

const QUERIES: { q: string; v: number[] }[] = [
  { q: 'I lost my travel documents abroad', v: [0.6, 0.8, 0.9, 0, 0, 0, 0, 0.05] },
  { q: 'My rooftop panels stopped producing power', v: [0, 0, 0, 0.95, 0.8, 0, 0, 0.1] },
  { q: 'How do I pay my taxes on time?', v: [0.5, 0.3, 0, 0, 0, 0.95, 0, 0.15] },
  { q: 'I’m locked out of my account', v: [0.1, 0.1, 0, 0, 0, 0.05, 0, 0.95] },
  { q: 'Proof of my child’s immunisation', v: [0.4, 0.7, 0, 0, 0, 0, 0.85, 0.05] },
];

const PREDICTIONS: { q: string; target: string; a: string; b: string }[] = [
  { q: 'Which is closer in meaning to “Passport Form”?', target: 'Passport Form', a: 'Visa Application', b: 'Driving Licence' },
  { q: 'Which is closer in meaning to “Electricity Bill”?', target: 'Electricity Bill', a: 'Power Grid', b: 'Invoice' },
  { q: 'Which is closer in meaning to “Vaccination Record”?', target: 'Vaccination Record', a: 'Hospital Admission', b: 'Birth Certificate' },
];

const pos = (c: Concept): [number, number] => c.xy;
const byName = (n: string) => CONCEPTS.find((c) => c.name === n)!;
const sim = (a: string, b: string) => cosine(byName(a).v, byName(b).v);

function interpret(s: number) {
  if (s >= 0.9) return { label: 'Near-synonyms', tone: 'green' as const };
  if (s >= 0.7) return { label: 'Closely related', tone: 'green' as const };
  if (s >= 0.4) return { label: 'Somewhat related', tone: 'amber' as const };
  if (s >= 0.15) return { label: 'Weakly related', tone: 'amber' as const };
  return { label: 'Unrelated', tone: 'red' as const };
}

export default function Lab1BEmbeddingMap() {
  const [a, setA] = useState<string | null>('Citizen Application');
  const [b, setB] = useState<string | null>('Passport Form');
  const [qi, setQi] = useState<number | null>(null);
  const [preds, setPreds] = useState<(string | null)[]>([null, null, null]);
  const [seenHigh, setSeenHigh] = useState(false);
  const [seenLow, setSeenLow] = useState(false);

  const points = useMemo(() => CONCEPTS.map((c) => ({ c, p: pos(c) })), []);
  const pairSim = a && b ? sim(a, b) : null;
  useEffect(() => {
    if (pairSim !== null && pairSim > 0.9) setSeenHigh(true);
    if (pairSim !== null && pairSim < 0.1) setSeenLow(true);
  }, [pairSim]);

  const neighbours = a
    ? CONCEPTS.filter((c) => c.name !== a)
        .map((c) => ({ name: c.name, s: sim(a, c.name) }))
        .sort((x, y) => y.s - x.s)
        .slice(0, 5)
    : [];
  const queryHits = qi !== null ? CONCEPTS.map((c) => ({ name: c.name, s: cosine(QUERIES[qi].v, c.v) })).sort((x, y) => y.s - x.s).slice(0, 3) : [];
  const hitNames = new Set(queryHits.map((h) => h.name));

  const click = (name: string) => {
    setQi(null);
    if (!a || (a && b)) {
      setA(name);
      setB(null);
    } else if (name !== a) setB(name);
  };

  const pa = a ? pos(byName(a)) : null;
  const pb = b ? pos(byName(b)) : null;
  const predCorrect = preds.filter((p, i) => {
    if (!p) return false;
    const pr = PREDICTIONS[i];
    const better = sim(pr.target, pr.a) >= sim(pr.target, pr.b) ? pr.a : pr.b;
    return p === better;
  }).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Card padded={false} className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <MousePointerClick className="h-4 w-4 text-indigo-500" /> Click any two concepts to measure their meaning distance
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setA(null);
                setB(null);
                setQi(null);
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>
          <svg viewBox="0 0 100 100" className="aspect-square w-full bg-white dark:bg-slate-950" role="img" aria-label="2D embedding map">
            {Array.from({ length: 9 }, (_, i) => (
              <g key={i}>
                <line x1={(i + 1) * 10} x2={(i + 1) * 10} y1={0} y2={100} className="stroke-slate-100 dark:stroke-slate-900" strokeWidth={0.3} />
                <line y1={(i + 1) * 10} y2={(i + 1) * 10} x1={0} x2={100} className="stroke-slate-100 dark:stroke-slate-900" strokeWidth={0.3} />
              </g>
            ))}
            {pa && pb && (
              <g>
                <line x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]} stroke="#6366f1" strokeWidth={0.6} strokeDasharray="1.5 1" className="animate-flow" />
                <rect x={(pa[0] + pb[0]) / 2 - 5.5} y={(pa[1] + pb[1]) / 2 - 2.6} width={11} height={4.4} rx={1} fill="#4f46e5" />
                <text x={(pa[0] + pb[0]) / 2} y={(pa[1] + pb[1]) / 2 + 0.6} textAnchor="middle" fontSize={2.6} fontWeight={700} fill="white">
                  {pairSim!.toFixed(2)}
                </text>
              </g>
            )}
            {qi !== null &&
              queryHits.map((h) => {
                const p = pos(byName(h.name));
                return <circle key={h.name} cx={p[0]} cy={p[1]} r={4.2} fill="none" stroke="#f59e0b" strokeWidth={0.6} className="animate-pulse" />;
              })}
            {points.map(({ c, p }) => {
              const selected = c.name === a || c.name === b;
              const dim = (a && b && !selected) || (qi !== null && !hitNames.has(c.name));
              return (
                <g key={c.name} onClick={() => click(c.name)} className="cursor-pointer" opacity={dim ? 0.35 : 1}>
                  <circle cx={p[0]} cy={p[1]} r={selected ? 2.4 : 1.7} fill={GROUP_COLOR[c.group].fill} stroke="white" strokeWidth={0.5} />
                  <text x={p[0]} y={p[1] - 2.8} textAnchor="middle" fontSize={2.3} fontWeight={selected ? 700 : 500} className="fill-slate-700 dark:fill-slate-200">
                    {c.name}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="flex flex-wrap gap-3 border-t border-slate-200 px-4 py-2 text-[11px] dark:border-slate-800">
            {Object.values(GROUP_COLOR).map((g) => (
              <span key={g.label} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: g.fill }} /> {g.label}
              </span>
            ))}
            <span className="text-slate-400">· 2D view of 8 hidden dimensions</span>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionLabel>Cosine similarity</SectionLabel>
            {a && b && pairSim !== null ? (
              <div>
                <div className="text-sm">
                  <strong>{a}</strong> ↔ <strong>{b}</strong>
                </div>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">{pairSim.toFixed(2)}</span>
                  <Badge tone={interpret(pairSim).tone}>{interpret(pairSim).label}</Badge>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-500">Why: the hidden dimensions side by side</div>
                  {DIMS.map((d, i) => (
                    <div key={d} className="flex items-center gap-2 text-[11px]">
                      <span className="w-20 shrink-0 text-slate-500">{d}</span>
                      <div className="flex h-2 flex-1 justify-end overflow-hidden rounded-l bg-slate-100 dark:bg-slate-800">
                        <div className="bg-indigo-500" style={{ width: `${byName(a).v[i] * 100}%` }} />
                      </div>
                      <div className="flex h-2 flex-1 overflow-hidden rounded-r bg-slate-100 dark:bg-slate-800">
                        <div className="bg-violet-400" style={{ width: `${byName(b).v[i] * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">{a ? `Selected “${a}”. Now click a second concept.` : 'Click a concept on the map to start.'}</p>
            )}
          </Card>
          {a && (
            <Card>
              <SectionLabel>Nearest neighbours of “{a}”</SectionLabel>
              <div className="space-y-1.5">
                {neighbours.map((n) => (
                  <button type="button" key={n.name} className="block w-full text-left" onClick={() => setB(n.name)}>
                    <HBar label={n.name} value={n.s * 100} right={n.s.toFixed(2)} color="bg-indigo-500" />
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionLabel className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" /> Semantic search on the map
          </SectionLabel>
          <p className="mb-2 text-xs text-slate-500">A user’s question is embedded into the same space; the closest concepts are retrieved — even with zero shared words.</p>
          <div className="flex flex-wrap gap-1.5">
            {QUERIES.map((q, i) => (
              <button
                type="button"
                key={q.q}
                onClick={() => {
                  setQi(i);
                  setA(null);
                  setB(null);
                }}
                className={cx('rounded-full border px-3 py-1 text-xs', qi === i ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200' : 'border-slate-200 dark:border-slate-700')}
              >
                “{q.q}”
              </button>
            ))}
          </div>
          {qi !== null && (
            <div className="mt-3 space-y-1.5">
              {queryHits.map((h, i) => (
                <HBar key={h.name} label={`${i + 1}. ${h.name}`} value={h.s * 100} right={h.s.toFixed(2)} color="bg-amber-500" />
              ))}
            </div>
          )}
        </Card>
        <Card>
          <SectionLabel>Prediction challenge</SectionLabel>
          <div className="space-y-3">
            {PREDICTIONS.map((p, i) => {
              const better = sim(p.target, p.a) >= sim(p.target, p.b) ? p.a : p.b;
              return (
                <div key={i} className="text-sm">
                  <div className="mb-1 font-medium">{p.q}</div>
                  <div className="flex flex-wrap gap-2">
                    {[p.a, p.b].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        disabled={preds[i] !== null}
                        onClick={() => setPreds(preds.map((x, k) => (k === i ? opt : x)))}
                        className={cx(
                          'rounded-lg border px-3 py-1 text-xs font-medium',
                          preds[i] === null && 'border-slate-200 hover:border-indigo-400 dark:border-slate-700',
                          preds[i] !== null && opt === better && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
                          preds[i] === opt && opt !== better && 'border-rose-500 bg-rose-50 dark:bg-rose-950/40',
                        )}
                      >
                        {opt}
                        {preds[i] !== null && ` (${sim(p.target, opt).toFixed(2)})`}
                      </button>
                    ))}
                    {preds[i] !== null && (preds[i] === better ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-rose-500" />)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Callout tone="tip" title="Why this matters for RAG">
        Retrieval in RAG is exactly this: embed the user’s question, find the nearest document chunks, and hand them to the LLM. If two different things sit close together (e.g. two similar error codes or form numbers), vector search can confuse them — which is why production systems add keyword search and reranking.
      </Callout>

      <Missions
        labId="lab-1b"
        missions={[
          { id: 'high', label: 'Find a pair with similarity above 0.90', done: seenHigh },
          { id: 'low', label: 'Find a pair with similarity below 0.10', done: seenLow },
          { id: 'search', label: 'Run a semantic search query and inspect the top-3 matches', done: qi !== null },
          { id: 'predict', label: 'Get at least 2 of 3 prediction challenges right', done: predCorrect >= 2 },
        ]}
      />
    </div>
  );
}
