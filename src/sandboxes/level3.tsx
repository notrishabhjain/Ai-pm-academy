import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Globe, FolderLock, FileInput, Search, Award } from 'lucide-react';
import { Badge, Callout, Card, HBar, Meter, Segmented, Slider, Stat, Toggle, cx } from '../components/ui';
import { RAG_DOCS, RAG_QUERIES } from '../data/ragDocs';
import { CHUNK_SIZES, chunkDocs, retrieve, type SearchMode } from '../lib/rag';
import { num } from '../lib/format';

/* ------------------------------------------------------------------ */
/* Lesson 3.1 — Private data gap                                       */
/* ------------------------------------------------------------------ */

const ORG_QS = [
  {
    q: 'What is our daily travel allowance for Tier-2 cities?',
    source: '[Circular 14/2026, issued 2 Oct 2026] The daily allowance for official travel to Tier-2 cities is revised from ₹2,500 to ₹3,200 with effect from 1 Nov 2026.',
    correct: '₹3,200 per day (Circular 14/2026, effective 1 Nov 2026).',
    guess: 'Typically around ₹2,500 per day for Tier-2 cities.',
  },
  {
    q: 'Which form does a pensioner use to update bank details?',
    source: '[Pension SOP §6.2] Pensioners must submit Form PEN-7 (Bank Mandate Update) at the District Treasury or via the pension portal, with a cancelled cheque.',
    correct: 'Form PEN-7 (Bank Mandate Update), at the District Treasury or via the pension portal, with a cancelled cheque.',
    guess: 'Pensioners usually submit Form 15H to their bank branch to update details.',
  },
  {
    q: 'Who approves work-from-home beyond 10 days in a quarter?',
    source: '[HR Office Order 22/2025] Work-from-home beyond 10 days per quarter requires approval of the Joint Secretary (Administration) through e-Office.',
    correct: 'The Joint Secretary (Administration), via e-Office.',
    guess: 'Your reporting manager can approve extended work-from-home requests.',
  },
];

export function PrivateDataSandbox() {
  const [qi, setQi] = useState(0);
  const [grounded, setGrounded] = useState(false);
  const [abstain, setAbstain] = useState(false);
  const item = ORG_QS[qi];
  const outcome = grounded ? 'correct' : abstain ? 'abstain' : 'guess';
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ORG_QS.map((o, i) => (
          <button type="button" key={i} onClick={() => setQi(i)} className={cx('rounded-full border px-3 py-1 text-xs font-medium', qi === i ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700')}>
            {o.q}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_1.3fr]">
        <Card className="space-y-3 bg-slate-50 dark:bg-slate-950/40">
          <Toggle label="Retrieve the policy excerpt and paste it into the prompt (RAG)" checked={grounded} onChange={setGrounded} />
          <Toggle label="Allow the model to say “I don’t have that information”" checked={abstain} onChange={setAbstain} />
          <div className="space-y-1.5 pt-2 text-xs">
            <div className="font-semibold text-slate-500">What the model can “see”</div>
            <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-emerald-500" /> Public training data up to its cutoff <Badge tone="green">yes</Badge></div>
            <div className="flex items-center gap-2"><FolderLock className="h-4 w-4 text-rose-500" /> Your intranet, circulars, SOPs <Badge tone="red">never</Badge></div>
            <div className="flex items-center gap-2"><FileInput className={cx('h-4 w-4', grounded ? 'text-emerald-500' : 'text-slate-400')} /> Text you put in the prompt <Badge tone={grounded ? 'green' : 'slate'}>{grounded ? 'policy excerpt' : 'nothing'}</Badge></div>
          </div>
        </Card>
        <div className="space-y-3">
          {grounded && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 font-mono text-xs dark:border-amber-900 dark:bg-amber-950/30">{item.source}</div>}
          <div className={cx('rounded-xl border-2 p-4', outcome === 'correct' ? 'border-emerald-400' : outcome === 'abstain' ? 'border-sky-400' : 'border-rose-400')}>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
              Model answer {outcome === 'correct' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : outcome === 'guess' ? <XCircle className="h-4 w-4 text-rose-500" /> : null}
            </div>
            <p className="text-sm font-medium">{outcome === 'correct' ? item.correct : outcome === 'abstain' ? 'I don’t have access to your organisation’s internal policies. Please check the latest circular or contact the Admin section.' : item.guess}</p>
          </div>
          <Callout tone={outcome === 'correct' ? 'success' : outcome === 'abstain' ? 'info' : 'danger'}>
            {outcome === 'correct'
              ? 'Grounded: the model read the answer from the text you supplied. This is the core idea of RAG — your job is to make sure the right excerpt is retrieved every time.'
              : outcome === 'abstain'
                ? 'Honest but unhelpful. Abstaining is far better than guessing, but the user still needs an answer — supply the knowledge.'
                : 'A fluent, plausible guess based on “typical” organisations. It would sail through a casual demo and mislead real users.'}
          </Callout>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson 3.2 — Debug the 5-stage pipeline                             */
/* ------------------------------------------------------------------ */

export function RagStagesSandbox() {
  const [parser, setParser] = useState<'basic' | 'ocr'>('basic');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('small');
  const [overlap, setOverlap] = useState(false);
  const [multi, setMulti] = useState(false);
  const [k, setK] = useState<1 | 3 | 10>(3);
  const [strict, setStrict] = useState(false);

  const stages = [
    { name: '1 · Ingestion', health: parser === 'ocr' ? 96 : 45, note: parser === 'ocr' ? 'OCR + table parser: the allowance table is readable.' : 'Basic extraction: the scanned allowance table came out as “T|er-2 ... 3,2OO”.' },
    { name: '2 · Chunking', health: (size === 'medium' ? 94 : size === 'large' ? 72 : 55) + (overlap && size !== 'medium' ? 15 : overlap ? 3 : 0), note: size === 'small' ? (overlap ? 'Small chunks, but overlap keeps “Tier-2” with its amount.' : 'Small chunks split the city tier from its amount.') : size === 'large' ? 'Large chunks mix several tables — noisy.' : 'Medium chunks keep each table row with its heading.' },
    { name: '3 · Embedding', health: multi ? 93 : 48, note: multi ? 'Multilingual model understands the Hinglish query.' : 'English-only model: “shahar ke liye kitna” barely matches anything.' },
    { name: '4 · Retrieval', health: k === 3 ? 94 : k === 1 ? 62 : 70, note: k === 1 ? 'Top-1: one miss and the answer is gone.' : k === 10 ? 'Top-10: an older 2023 circular sneaks in and confuses the model.' : 'Top-3: right chunk included without much noise.' },
    { name: '5 · Generation', health: strict ? 95 : 64, note: strict ? 'Strict grounding: answer only from sources, cite, or say not found.' : 'Lenient prompt: the model blends sources with general knowledge.' },
  ].map((s) => ({ ...s, health: Math.min(99, s.health) }));
  const quality = stages.reduce((a, s) => a * (s.health / 100), 1) * 100;
  const worst = stages.reduce((w, s) => (s.health < w.health ? s : w), stages[0]);
  const answers: Record<string, string> = {
    '1 · Ingestion': 'I couldn’t find the Tier-2 allowance in the documents.',
    '2 · Chunking': 'The daily allowance is ₹2,800 per day. (That is the Tier-3 row — the tier label was in a different chunk.)',
    '3 · Embedding': 'Travel requests must be submitted 7 days in advance via e-Office. (Unrelated chunk retrieved.)',
    '4 · Retrieval': k === 10 ? 'The allowance is ₹2,500 per day [Source #7]. (Cites the superseded 2023 circular.)' : 'I couldn’t find this in the provided documents.',
    '5 · Generation': 'Tier-2 cities usually get between ₹2,500 and ₹3,500 per day depending on grade. (Blended guess.)',
  };
  const good = quality >= 70;

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
        Test question (Hinglish): <strong>“Tier-2 shahar ke liye travel allowance kitna hai?”</strong> · Correct answer: ₹3,200/day [Circular 14/2026]
      </p>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="space-y-3 bg-slate-50 dark:bg-slate-950/40">
          <div>
            <div className="mb-1 text-xs font-semibold">1 · Ingestion — PDF parsing</div>
            <Segmented size="sm" value={parser} onChange={setParser} options={[{ value: 'basic', label: 'Basic text extract' }, { value: 'ocr', label: 'OCR + tables' }]} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold">2 · Chunking — size</div>
            <Segmented size="sm" value={size} onChange={setSize} options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]} />
            <div className="mt-1.5">
              <Toggle label="25% overlap" checked={overlap} onChange={setOverlap} />
            </div>
          </div>
          <Toggle label="3 · Multilingual embedding model" checked={multi} onChange={setMulti} />
          <div>
            <div className="mb-1 text-xs font-semibold">4 · Retrieval — top-K</div>
            <Segmented size="sm" value={k} onChange={setK} options={[{ value: 1, label: '1' }, { value: 3, label: '3' }, { value: 10, label: '10' }]} />
          </div>
          <Toggle label="5 · Strict grounding prompt + citations" checked={strict} onChange={setStrict} />
        </Card>
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-5">
            {stages.map((s) => (
              <div key={s.name} className={cx('rounded-xl border-2 p-2.5 transition', s === worst && !good ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30' : s.health >= 90 ? 'border-emerald-300 dark:border-emerald-800' : 'border-amber-300 dark:border-amber-800')}>
                <div className="text-[11px] font-bold">{s.name}</div>
                <Meter label="health" value={s.health} />
                <p className="mt-1 text-[10px] leading-snug text-slate-500 dark:text-slate-400">{s.note}</p>
              </div>
            ))}
          </div>
          <Meter label="End-to-end answer quality (product of stage health)" value={quality} suffix="%" />
          <div className={cx('rounded-xl border-2 p-4 text-sm', good ? 'border-emerald-400' : 'border-rose-400')}>
            <div className="mb-1 text-xs font-bold uppercase text-slate-500">Assistant answer</div>
            {good ? 'Tier-2 shahar ke liye daily travel allowance ₹3,200 hai [Source #1 — Circular 14/2026].' : answers[worst.name]}
          </div>
          <Callout tone={good ? 'success' : 'warn'} title={good ? 'Healthy pipeline' : `Bottleneck: ${worst.name}`}>
            {good
              ? 'Every stage is healthy. Notice the end-to-end score multiplies: five stages at 95% give ~77%, not 95%. That is why RAG teams obsess over each stage.'
              : `Even with other stages perfect, this one stage caps quality. In real projects, log enough (parsed text, chunks, retrieved IDs, prompt) to pinpoint the failing stage instead of blaming “the model”.`}
          </Callout>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson 3.3 — Race the search modes                                  */
/* ------------------------------------------------------------------ */

const RACE_QUERIES = ['lost', 'pendrive', 'e07', 'password', 'breach'];

export function SearchModesSandbox() {
  const [qid, setQid] = useState('lost');
  const [custom, setCustom] = useState('');
  const preset = RAG_QUERIES.find((q) => q.id === qid);
  const query = custom.trim() || preset?.q || '';
  const { chunks } = useMemo(() => chunkDocs(RAG_DOCS, CHUNK_SIZES.small, 25), []);
  const modes: { id: SearchMode; label: string; score: (s: ReturnType<typeof retrieve>[number]) => string }[] = [
    { id: 'keyword', label: 'Keyword (BM25)', score: (s) => `BM25 ${s.bm25.toFixed(2)}` },
    { id: 'vector', label: 'Vector (semantic)', score: (s) => `cos ${s.vec.toFixed(2)}` },
    { id: 'hybrid', label: 'Hybrid + reranker', score: (s) => `rerank ${s.rerank.toFixed(2)}` },
  ];
  const isHit = (text: string) => !custom.trim() && !!preset && preset.answerKeys.every((k) => text.toLowerCase().includes(k.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {RACE_QUERIES.map((id) => {
          const q = RAG_QUERIES.find((x) => x.id === id)!;
          return (
            <button
              type="button"
              key={id}
              onClick={() => {
                setQid(id);
                setCustom('');
              }}
              className={cx('rounded-full border px-3 py-1 text-xs font-medium', qid === id && !custom ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700')}
            >
              {q.q}
            </button>
          );
        })}
      </div>
      <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        <Search className="h-4 w-4 text-slate-400" />
        <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="…or type your own question about the policy, SOP or inverter manual" className="flex-1 bg-transparent text-sm outline-none" />
      </label>
      {preset && !custom && <p className="text-xs text-slate-500">💡 {preset.lesson}</p>}
      <div className="grid gap-3 lg:grid-cols-3">
        {modes.map((m) => {
          const res = retrieve(query, chunks, m.id, 3);
          const hit = res.some((r) => isHit(r.chunk.text));
          return (
            <div key={m.id} className={cx('rounded-xl border-2 p-3', !custom && (hit ? 'border-emerald-400' : 'border-rose-300 dark:border-rose-800'))}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold">{m.label}</span>
                {!custom && (hit ? <Badge tone="green">answer found</Badge> : <Badge tone="red">missed</Badge>)}
              </div>
              {res.length === 0 && <p className="text-xs text-slate-500">No chunk shares any keyword with the query.</p>}
              <ol className="space-y-2">
                {res.map((r, i) => (
                  <li key={r.chunk.n} className={cx('rounded-lg p-2 text-xs', isHit(r.chunk.text) ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-slate-50 dark:bg-slate-800/60')}>
                    <div className="mb-0.5 flex items-center justify-between gap-2 font-semibold">
                      <span>
                        #{i + 1} · Chunk {r.chunk.n} {isHit(r.chunk.text) && '✅'}
                      </span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">{m.score(r)}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">{r.chunk.text}</div>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
      <Callout tone="tip">
        Keyword search is blind to synonyms (“misplaced computer” ≠ “lost endpoint”); vector search can blur exact codes and similar facts. Hybrid fusion plus a reranker is usually the most robust — but measure hit-rate on your own golden questions.
      </Callout>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson 3.4 — Strategy picker                                        */
/* ------------------------------------------------------------------ */

const clamp100 = (v: number) => Math.max(0, Math.min(100, v));

export function StrategyPickerSandbox() {
  const [fresh, setFresh] = useState(70);
  const [pagesExp, setPagesExp] = useState(3); // 10^x pages
  const [cite, setCite] = useState(true);
  const [behaviour, setBehaviour] = useState(20);
  const [volExp, setVolExp] = useState(4); // 10^x queries/day
  const [examples, setExamples] = useState(50);
  const pages = Math.round(10 ** pagesExp);
  const vol = Math.round(10 ** volExp);

  const s = {
    Prompting: clamp100(88 - (pages > 5 ? 55 : 0) - behaviour * 0.25),
    RAG: clamp100(55 + (pages > 20 ? 25 : pages > 5 ? 10 : -20) + fresh * 0.15 + (cite ? 10 : 0) - behaviour * 0.15),
    'Long context': pages > 1500 ? 3 : clamp100(82 - pagesExp * 14 - volExp * 6 + (cite ? 0 : 5)),
    'Fine-tuning': clamp100(18 + behaviour * 0.55 + (examples > 1000 ? 22 : examples > 300 ? 10 : -15) + (vol > 1e5 ? 15 : 0) - fresh * 0.3 - (cite ? 12 : 0)),
  };
  const ranked = (Object.entries(s) as [keyof typeof s, number][]).sort((a, b) => b[1] - a[1]);
  const [best] = ranked[0];
  const combo = best === 'RAG' && s['Fine-tuning'] > 50 ? 'RAG for knowledge + a fine-tuned (smaller) model for consistent format' : best === 'Fine-tuning' && pages > 20 ? 'Fine-tuned model for behaviour + RAG for facts and citations' : null;
  const meta: Record<string, { time: string; cost: string }> = {
    Prompting: { time: 'Hours–days', cost: 'Tokens only' },
    RAG: { time: '1–4 weeks', cost: 'Index + context tokens' },
    'Long context': { time: 'Immediate', cost: `~${num(pages * 650)} tokens / call` },
    'Fine-tuning': { time: '4–10 weeks', cost: 'Data prep + training + re-training' },
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <Card className="space-y-3 bg-slate-50 dark:bg-slate-950/40">
        <Slider label="How often the knowledge changes" value={fresh} min={0} max={100} onChange={setFresh} format={(v) => (v < 20 ? 'Rarely' : v < 60 ? 'Monthly' : 'Weekly/daily')} />
        <Slider label="Size of knowledge base" value={pagesExp} min={0} max={5} step={0.25} onChange={setPagesExp} format={() => `${num(pages)} pages`} />
        <Toggle label="Answers must cite sources" checked={cite} onChange={setCite} />
        <Slider label="Need to change style / format / behaviour" value={behaviour} min={0} max={100} onChange={setBehaviour} format={(v) => (v < 30 ? 'Little' : v < 70 ? 'Moderate' : 'Heavy')} />
        <Slider label="Query volume" value={volExp} min={1} max={6} step={0.25} onChange={setVolExp} format={() => `${num(vol)}/day`} />
        <Slider label="High-quality labelled examples" value={examples} min={0} max={5000} step={50} onChange={setExamples} format={num} />
      </Card>
      <div className="space-y-3">
        {ranked.map(([name, score]) => (
          <div key={name} className={cx('rounded-xl border-2 p-3', name === best ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800')}>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-semibold">
                {name} {name === best && <Badge tone="green"><Award className="h-3 w-3" /> Recommended</Badge>}
              </span>
              <span className="text-xs text-slate-500">
                {meta[name].time} · {meta[name].cost}
              </span>
            </div>
            <HBar label="Fit score" value={score} color={name === best ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'} />
          </div>
        ))}
        <div className="grid gap-2 sm:grid-cols-2">
          <Stat label="Recommended" value={best} />
          <Stat label="Consider combining" value={combo ? 'Yes' : 'Not needed'} sub={combo ?? 'One technique covers this profile'} />
        </div>
        <Callout tone="tip">
          {best === 'Prompting' && 'A tiny, stable knowledge base fits straight into a well-crafted prompt. Start here and only add machinery when evals show you need it.'}
          {best === 'RAG' && 'Large or changing knowledge with citations → RAG. Keep facts out of model weights so updates are a re-index, not a re-train.'}
          {best === 'Long context' && 'Few documents and modest volume: just include them in the prompt (with caching). Revisit once volume or corpus size grows.'}
          {best === 'Fine-tuning' && 'Stable knowledge, heavy behaviour change, lots of examples and high volume: fine-tuning (often of a smaller model) can pay off. Prove it on your golden dataset first.'}
        </Callout>
      </div>
    </div>
  );
}
