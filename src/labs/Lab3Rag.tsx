import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Play, FileText, Scissors, Sigma, Database, Sparkles, CheckCircle2, AlertTriangle, XCircle, ShieldQuestion, Loader2 } from 'lucide-react';
import { Badge, Button, Callout, Card, Missions, SectionLabel, Segmented, Slider, Stat, Toggle, cx } from '../components/ui';
import { RAG_DOCS, RAG_QUERIES, type RagDoc } from '../data/ragDocs';
import { CHUNK_SIZES, chunkDocs, contextTokens, customDoc, generateAnswer, retrieve, type Answer, type ChunkSize, type Scored, type SearchMode } from '../lib/rag';
import { inr, num } from '../lib/format';
import { useLabData, useProgress } from '../store/progress';

const CHUNK_BG = [
  'bg-indigo-100 dark:bg-indigo-500/20',
  'bg-emerald-100 dark:bg-emerald-500/20',
  'bg-amber-100 dark:bg-amber-500/20',
  'bg-rose-100 dark:bg-rose-500/20',
  'bg-sky-100 dark:bg-sky-500/20',
  'bg-violet-100 dark:bg-violet-500/20',
];
const CHUNK_BADGE = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-sky-600', 'bg-violet-600'];

const DEFAULT_CUSTOM =
  'Our office canteen opens at 8:30 am and closes at 6 pm on working days.\n\nVisitors must register at the reception and wear a visitor badge at all times. Visitor badges must be returned before leaving.\n\nThe library allows staff to borrow up to 4 books for 21 days. Late returns attract a fine of ₹10 per book per day.';

const STATUS_META: Record<Answer['status'], { label: string; tone: 'green' | 'amber' | 'red' | 'blue'; icon: typeof CheckCircle2 }> = {
  grounded: { label: 'Grounded answer', tone: 'green', icon: CheckCircle2 },
  partial: { label: 'Partially grounded', tone: 'amber', icon: AlertTriangle },
  misgrounded: { label: 'Hallucination — wrong chunk cited', tone: 'red', icon: XCircle },
  hallucinated: { label: 'Hallucination — no source', tone: 'red', icon: XCircle },
  abstain: { label: 'Abstained (not found)', tone: 'blue', icon: ShieldQuestion },
};

export default function Lab3Rag() {
  const { state } = useProgress();
  const fx = state.settings.fxRate;
  const [docIds, setDocIds] = useState<string[]>(['policy', 'sop', 'manual']);
  const [useCustom, setUseCustom] = useState(false);
  const [customText, setCustomText] = useLabData('lab-3:custom', DEFAULT_CUSTOM);
  const [size, setSize] = useState<ChunkSize>('small');
  const [overlap, setOverlap] = useState(0);
  const [mode, setMode] = useState<SearchMode>('hybrid');
  const [topK, setTopK] = useState(3);
  const [strict, setStrict] = useState(true);
  const [query, setQuery] = useState(RAG_QUERIES[0].q);
  const [viewDoc, setViewDoc] = useState('sop');
  const [results, setResults] = useState<Scored[] | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'embedding' | 'retrieving' | 'generating' | 'done'>('idle');
  const [focus, setFocus] = useState<number | null>(null);
  const [m, setM] = useState({ trap: false, fixed: false, kwMiss: false, synFound: false, cite: false, custom: false });
  const timers = useRef<number[]>([]);

  const docs: RagDoc[] = useMemo(() => [...RAG_DOCS.filter((d) => docIds.includes(d.id)), ...(useCustom && customText.trim() ? [customDoc(customText)] : [])], [docIds, useCustom, customText]);
  const { sentences, chunks } = useMemo(() => chunkDocs(docs, CHUNK_SIZES[size], overlap), [docs, size, overlap]);
  const preset = RAG_QUERIES.find((q) => q.q === query.trim());

  // Any change to the pipeline invalidates the last run.
  useEffect(() => {
    setResults(null);
    setAnswer(null);
    setPhase('idle');
    setFocus(null);
  }, [size, overlap, mode, topK, strict, docs]);
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);
  useEffect(() => {
    if (!docs.some((d) => d.id === viewDoc) && docs[0]) setViewDoc(docs[0].id);
  }, [docs, viewDoc]);

  const run = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    const res = retrieve(query, chunks, mode, topK);
    const ans = generateAnswer(query, res, strict, preset);
    setResults(res);
    setAnswer(null);
    setRevealed(0);
    setFocus(null);
    setPhase('embedding');
    if (res[0]) setViewDoc(res[0].chunk.docId);
    const t0 = 450;
    timers.current.push(window.setTimeout(() => setPhase('retrieving'), t0));
    res.forEach((_, i) => timers.current.push(window.setTimeout(() => setRevealed(i + 1), t0 + 350 * (i + 1))));
    const tGen = t0 + 350 * (res.length + 1);
    timers.current.push(window.setTimeout(() => setPhase('generating'), tGen));
    timers.current.push(
      window.setTimeout(() => {
        setAnswer(ans);
        setPhase('done');
        setM((prev) => {
          const next = { ...prev };
          if (preset?.id === 'catb' && ans.status === 'misgrounded') next.trap = true;
          if (preset?.id === 'catb' && ans.status === 'grounded' && prev.trap) next.fixed = true;
          if (preset?.id === 'lost' && mode === 'keyword' && ans.status !== 'grounded') next.kwMiss = true;
          if (preset?.id === 'lost' && mode !== 'keyword' && ans.status === 'grounded' && prev.kwMiss) next.synFound = true;
          if (useCustom && res.some((r) => r.chunk.docId === 'custom')) next.custom = true;
          return next;
        });
      }, tGen + 700),
    );
  };

  const retrievedNums = new Map((results ?? []).slice(0, revealed).map((r, i) => [r.chunk.n, i + 1]));
  const chunkOfSentence = useMemo(() => {
    const map = new Map<number, number[]>();
    chunks.forEach((c) => c.sentences.forEach((s) => map.set(s, [...(map.get(s) ?? []), c.n])));
    return map;
  }, [chunks]);
  const firstSentenceOf = useMemo(() => new Map(chunks.map((c) => [c.sentences[0], c.n])), [chunks]);
  const ctxTok = results ? contextTokens(results) : 0;
  const costPerQuery = ((ctxTok + 400 + 150 * 5) / 1e6) * 3 * fx;

  const jumpTo = (n: number) => {
    const c = chunks.find((x) => x.n === n);
    if (!c) return;
    setViewDoc(c.docId);
    setFocus(n);
    setM((prev) => ({ ...prev, cite: true }));
    setTimeout(() => document.getElementById(`chunk-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  };

  const scoreLabel = (r: Scored) => (mode === 'keyword' ? `BM25 ${r.bm25.toFixed(2)}` : mode === 'vector' ? `cos ${r.vec.toFixed(2)}` : `rerank ${r.rerank.toFixed(2)}`);
  const viewed = docs.find((d) => d.id === viewDoc) ?? docs[0];

  return (
    <div className="space-y-5">
      {/* Pipeline controls */}
      <Card>
        <div className="grid gap-5 lg:grid-cols-4">
          <div className="space-y-2">
            <SectionLabel className="mb-1 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> 1 · Ingest documents
            </SectionLabel>
            {RAG_DOCS.map((d) => (
              <Toggle key={d.id} label={d.short} hint={d.kind} checked={docIds.includes(d.id)} onChange={(v) => setDocIds(v ? [...docIds, d.id] : docIds.filter((x) => x !== d.id))} />
            ))}
            <Toggle label="Your own text" hint="Paste anything below" checked={useCustom} onChange={setUseCustom} />
          </div>
          <div className="space-y-3">
            <SectionLabel className="mb-1 flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5" /> 2 · Chunk
            </SectionLabel>
            <Segmented
              size="sm"
              value={size}
              onChange={setSize}
              options={[
                { value: 'small', label: `Small (~${CHUNK_SIZES.small}w)` },
                { value: 'medium', label: `Medium (~${CHUNK_SIZES.medium}w)` },
                { value: 'large', label: `Large (~${CHUNK_SIZES.large}w)` },
              ]}
            />
            <Slider label="Chunk overlap" value={overlap} min={0} max={50} step={5} onChange={setOverlap} format={(v) => `${v}%`} hint="Carries trailing sentences into the next chunk" />
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Chunks" value={chunks.length} />
              <Stat label="Avg words" value={chunks.length ? Math.round(chunks.reduce((a, c) => a + c.words, 0) / chunks.length) : 0} />
            </div>
          </div>
          <div className="space-y-3">
            <SectionLabel className="mb-1 flex items-center gap-1.5">
              <Sigma className="h-3.5 w-3.5" /> 3–4 · Embed & retrieve
            </SectionLabel>
            <Segmented
              size="sm"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'keyword', label: 'Keyword (BM25)' },
                { value: 'vector', label: 'Vector' },
                { value: 'hybrid', label: 'Hybrid + reranker' },
              ]}
            />
            <Slider label="Top-K chunks sent to the LLM" value={topK} min={1} max={6} onChange={setTopK} />
          </div>
          <div className="space-y-3">
            <SectionLabel className="mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> 5 · Generate
            </SectionLabel>
            <Toggle label="Strict grounding prompt" hint="Answer only from sources, cite them, else say not found" checked={strict} onChange={setStrict} />
            <div className="rounded-lg bg-slate-50 p-2 text-[11px] text-slate-500 dark:bg-slate-800/60">
              Tip: start with <strong>Small · 0% overlap</strong> and the Category B question to watch a hallucination happen — then fix it.
            </div>
          </div>
        </div>
        {useCustom && (
          <textarea value={customText} onChange={(e) => setCustomText(e.target.value)} rows={4} className="mt-4 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" placeholder="Paste your own policy, SOP or notes. Blank lines separate sections." />
        )}
      </Card>

      {/* Query */}
      <Card>
        <SectionLabel className="flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5" /> Test query
        </SectionLabel>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {RAG_QUERIES.map((q) => (
            <button type="button" key={q.id} onClick={() => setQuery(q.q)} className={cx('rounded-full border px-3 py-1 text-xs', query === q.q ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700')} title={q.lesson}>
              {q.q}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Ask anything about the selected documents…"
          />
          <Button onClick={run} disabled={!query.trim() || chunks.length === 0}>
            <Play className="h-4 w-4" /> Run RAG pipeline
          </Button>
        </div>
        {preset && <p className="mt-2 text-xs text-slate-500">💡 {preset.lesson} (Source: {preset.docHint})</p>}
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        {/* Document viewer with chunk boundaries */}
        <Card padded={false} className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-3 pt-2 dark:border-slate-800">
            {docs.map((d) => (
              <button type="button" key={d.id} onClick={() => setViewDoc(d.id)} className={cx('rounded-t-lg border-b-2 px-3 py-1.5 text-xs font-semibold', viewed?.id === d.id ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300' : 'border-transparent text-slate-500')}>
                {d.short}
                {results && results.slice(0, revealed).some((r) => r.chunk.docId === d.id) && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />}
              </button>
            ))}
          </div>
          <div className="scrollbar-thin max-h-[560px] overflow-y-auto p-4 text-sm leading-7">
            {viewed ? (
              <>
                <h3 className="mb-1 font-bold">{viewed.title}</h3>
                <p className="mb-3 text-xs text-slate-500">{viewed.kind}</p>
                {viewed.sections.map((sec) => {
                  const secSentences = sentences.filter((s) => s.docId === viewed.id && s.section === sec.heading);
                  return (
                    <div key={sec.heading} className="mb-3">
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{sec.heading}</div>
                      <p>
                        {secSentences.map((s) => {
                          const owners = chunkOfSentence.get(s.idx) ?? [];
                          const primary = owners[0] ?? 0;
                          const startN = firstSentenceOf.get(s.idx);
                          const retrievedRank = owners.map((n) => retrievedNums.get(n)).find((x) => x !== undefined);
                          const focused = focus !== null && owners.includes(focus);
                          return (
                            <Fragment key={s.idx}>
                              {startN !== undefined && (
                                <span id={`chunk-${startN}`} className={cx('mr-1 inline-flex items-center rounded px-1.5 align-middle text-[10px] font-bold leading-4 text-white', CHUNK_BADGE[(startN - 1) % CHUNK_BADGE.length])}>
                                  #{startN}
                                </span>
                              )}
                              <span
                                className={cx(
                                  'rounded px-0.5 py-0.5 transition-all duration-300 [box-decoration-break:clone]',
                                  CHUNK_BG[(primary - 1 + CHUNK_BG.length) % CHUNK_BG.length],
                                  owners.length > 1 && 'underline decoration-slate-500 decoration-dashed decoration-2 underline-offset-4',
                                  retrievedRank !== undefined && 'font-medium ring-2 ring-amber-500',
                                  focused && 'bg-amber-300 ring-4 ring-amber-500 dark:bg-amber-500/50',
                                )}
                                title={`In chunk${owners.length > 1 ? 's' : ''} ${owners.map((o) => `#${o}`).join(', ')}${owners.length > 1 ? ' (overlap)' : ''}`}
                              >
                                {s.text}
                              </span>{' '}
                            </Fragment>
                          );
                        })}
                      </p>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-slate-500">Select at least one document.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-800">
            <span>Colours = chunk boundaries</span>
            <span className="underline decoration-dashed decoration-2 underline-offset-4">dashed = overlap (in 2 chunks)</span>
            <span className="rounded px-1 ring-2 ring-amber-500">ring = retrieved</span>
          </div>
        </Card>

        {/* Retrieval + answer */}
        <div className="space-y-4">
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <SectionLabel className="mb-0 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5" /> Retrieval ({mode === 'hybrid' ? 'BM25 + vector → RRF → rerank' : mode === 'vector' ? 'cosine similarity' : 'BM25'})
              </SectionLabel>
              {phase !== 'idle' && phase !== 'done' && (
                <span className="flex items-center gap-1 text-xs text-indigo-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {phase === 'embedding' ? 'embedding query…' : phase === 'retrieving' ? 'searching index…' : 'generating answer…'}
                </span>
              )}
            </div>
            {!results ? (
              <p className="py-6 text-center text-sm text-slate-500">Run the pipeline to see which chunks are retrieved and why.</p>
            ) : results.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No chunk matched (keyword search needs shared words).</p>
            ) : (
              <ol className="space-y-2">
                {results.slice(0, revealed).map((r, i) => {
                  const hasAnswer = preset && !preset.outOfScope && preset.answerKeys.every((k) => r.chunk.text.toLowerCase().includes(k.toLowerCase()));
                  return (
                    <li key={r.chunk.n} className="animate-fade-in">
                      <button type="button" onClick={() => jumpTo(r.chunk.n)} className={cx('w-full rounded-xl border p-2.5 text-left text-xs transition hover:border-indigo-400', focus === r.chunk.n ? 'border-amber-500' : 'border-slate-200 dark:border-slate-700')}>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <span className={cx('rounded px-1.5 text-[10px] text-white', CHUNK_BADGE[(r.chunk.n - 1) % CHUNK_BADGE.length])}>#{r.chunk.n}</span>
                            Rank {i + 1} · {r.chunk.docTitle.split(' ').slice(0, 3).join(' ')}…
                            {hasAnswer && <Badge tone="green">contains answer</Badge>}
                          </span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{scoreLabel(r)}</span>
                        </div>
                        <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${Math.min(100, (mode === 'keyword' ? r.bm25 / Math.max(1e-9, results[0].bm25) : mode === 'vector' ? r.vec : r.rerank) * 100)}%` }} />
                        </div>
                        <div className="line-clamp-3 text-slate-600 dark:text-slate-300">{r.chunk.text}</div>
                        {mode === 'hybrid' && (
                          <div className="mt-1 text-[10px] text-slate-400">
                            BM25 rank {r.rankBm25} · vector rank {r.rankVec} · RRF {r.rrf.toFixed(4)}
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          <Card className={cx(answer && (answer.status === 'misgrounded' || answer.status === 'hallucinated') && 'border-2 border-rose-400', answer?.status === 'grounded' && 'border-2 border-emerald-400')}>
            <SectionLabel className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Generated answer
            </SectionLabel>
            {!answer ? (
              <p className="py-6 text-center text-sm text-slate-500">{phase === 'generating' ? 'The LLM is reading the retrieved chunks…' : 'The grounded answer appears here, with clickable citations.'}</p>
            ) : (
              <div className="animate-fade-in space-y-3">
                {(() => {
                  const meta = STATUS_META[answer.status];
                  return (
                    <Badge tone={meta.tone}>
                      <meta.icon className="h-3 w-3" /> {meta.label}
                    </Badge>
                  );
                })()}
                <p className="text-sm leading-relaxed">
                  {answer.text}{' '}
                  {answer.citations.map((n) => (
                    <button type="button" key={n} onClick={() => jumpTo(n)} className="mx-0.5 rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/60 dark:text-indigo-200">
                      [Source Chunk #{n}]
                    </button>
                  ))}
                </p>
                <Callout tone={answer.status === 'grounded' ? 'success' : answer.status === 'abstain' ? 'info' : answer.status === 'partial' ? 'warn' : 'danger'}>{answer.explanation}</Callout>
                {preset && !preset.outOfScope && answer.status !== 'grounded' && (
                  <p className="text-xs text-slate-500">
                    <strong>Correct answer:</strong> {preset.correct}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Context tokens" value={num(ctxTok)} />
                  <Stat label="Chunks sent" value={results?.length ?? 0} />
                  <Stat label="Est. cost / query" value={inr(costPerQuery)} sub="frontier tier" />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Callout tone="tip" title="What to try (and what a PM should learn)">
        <ul className="list-disc space-y-1 pl-4">
          <li>
            <strong>Chunk-boundary hallucination:</strong> Small chunks, 0% overlap, “Category B patch deadline” → the model cites a real chunk but answers <em>7 days</em>. Add 25% overlap or use medium chunks.
          </li>
          <li>
            <strong>Synonyms:</strong> “I misplaced my work computer” fails with keyword search but works with vector or hybrid.
          </li>
          <li>
            <strong>Top-K trade-off:</strong> top-1 misses facts; top-6 adds tokens, cost and noise.
          </li>
          <li>
            <strong>Out of scope:</strong> the GST question should abstain. Turn off strict grounding and watch it invent a rate.
          </li>
        </ul>
      </Callout>

      <Missions
        labId="lab-3"
        missions={[
          { id: 'trap', label: 'Trigger the chunk-boundary hallucination (Category B question, wrong chunk cited)', done: m.trap },
          { id: 'fixed', label: 'Fix it by changing chunk size or overlap — then re-run', done: m.fixed },
          { id: 'kw', label: 'Watch keyword search miss the “misplaced computer” synonym query', done: m.kwMiss },
          { id: 'syn', label: '…then find it with vector or hybrid search', done: m.synFound },
          { id: 'cite', label: 'Click a citation or retrieved chunk to verify it in the source', done: m.cite },
          { id: 'custom', label: 'Run a query over your own pasted text', done: m.custom },
        ]}
      />
    </div>
  );
}
