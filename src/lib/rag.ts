import type { RagDoc, RagQuery } from '../data/ragDocs';
import { tokenize } from './tokenizer';
import { cosine } from './math';

/* ------------------------------------------------------------------ */
/* Text utilities                                                      */
/* ------------------------------------------------------------------ */

const STOP = new Set(
  'a an the is are was were be been being of to in on for at by with from as and or but if then than so that this these those it its i me my we our you your he she they them their what which who whom whose how when where why can could should would will shall may might must do does did done have has had not no yes there here about into over under up down out any all each per very just also only own same such too more most other some'.split(
    ' ',
  ),
);

export function stem(w: string): string {
  let s = w.toLowerCase();
  if (s.length > 4 && s.endsWith('ies')) return s.slice(0, -3) + 'y';
  if (s.length > 4 && /(ss|x|ch|sh)es$/.test(s)) return s.slice(0, -2);
  if (s.length > 5 && s.endsWith('ing')) s = s.slice(0, -3);
  else if (s.length > 4 && s.endsWith('ed')) s = s.slice(0, -2);
  else if (s.length > 3 && s.endsWith('s') && !s.endsWith('ss')) s = s.slice(0, -1);
  // Porter-style final "e" removal so "resolve" / "resolved" and "device" / "devices" match.
  if (s.length > 4 && s.endsWith('e')) s = s.slice(0, -1);
  return s;
}

export function terms(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9₹]+(?:-[a-z0-9]+)*/g) ?? []).filter((t) => !STOP.has(t)).map(stem);
}

export function splitSentences(text: string): string[] {
  // Split only where sentence punctuation is followed by whitespace, so "6.5 kW" or "v4.2" stay intact.
  return text
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

const wc = (s: string) => (s.match(/\S+/g) ?? []).length;

/* ------------------------------------------------------------------ */
/* "Embeddings": concept vectors built from a synonym dictionary        */
/* ------------------------------------------------------------------ */

const CONCEPTS: Record<string, string[]> = {
  lost: ['lost', 'misplace', 'misplaced', 'missing', 'stolen', 'theft', 'nicked', 'lose'],
  device: ['device', 'endpoint', 'laptop', 'computer', 'desktop', 'notebook', 'machine', 'pc', 'system'],
  server: ['server', 'internet-facing', 'host'],
  report: ['report', 'inform', 'notify', 'tell', 'alert', 'contact', 'call', 'whom'],
  patch: ['patch', 'update', 'fix', 'vulnerability'],
  timeframe: ['deadline', 'within', 'timeline', 'quickly', 'soon', 'limit', 'period', 'day', 'hour'],
  breach: ['breach', 'leak', 'incident', 'compromise', 'exposure'],
  personal: ['personal', 'pii', 'aadhaar', 'aadhaar-linked', 'citizen', 'private', 'restricted'],
  usb: ['usb', 'pen', 'drive', 'pendrive', 'flash', 'thumb', 'removable', 'media'],
  copy: ['copy', 'transfer', 'move', 'file'],
  password: ['password', 'passphrase', 'credential', 'login'],
  length: ['length', 'character', 'minimum', 'least', 'long'],
  mfa: ['multi-factor', 'mfa', 'two-factor', 'otp', 'authentication'],
  warranty: ['warranty', 'guarantee', 'coverage', 'covered', 'extend', 'extended'],
  error: ['error', 'fault', 'code', 'alarm', 'led', 'indicate', 'mean'],
  heat: ['temperature', 'over-temperature', 'overheat', 'heat', 'hot', 'cool', 'cold'],
  battery: ['battery', 'charging', 'charge', 'lithium-ion'],
  grid: ['grid', 'voltage', 'overvoltage', 'export', 'metering', 'net'],
  inverter: ['inverter', 'unit', 'solarmax', 'product'],
  solar: ['solar', 'pv', 'panel', 'photovoltaic', 'rooftop'],
  maintenance: ['clean', 'maintenance', 'dust', 'filter', 'check', 'service'],
  grievance: ['grievance', 'complaint', 'issue', 'redressal'],
  resolve: ['resolve', 'resolved', 'resolution', 'settle', 'close', 'closure'],
  acknowledge: ['acknowledge', 'acknowledgement', 'receipt', 'received'],
  escalate: ['escalate', 'escalated', 'escalation', 'appeal', 'appellate'],
  officer: ['officer', 'nodal', 'authority', 'dpo', 'board'],
  retention: ['retain', 'retained', 'retention', 'keep', 'store', 'delete', 'deletion', 'deleted'],
  consent: ['consent', 'permission', 'agree', 'withdraw', 'withdrawal'],
  penalty: ['penalty', 'fine', 'disciplinary', 'punish', 'termination'],
  staff: ['staff', 'employee', 'user', 'personnel', 'contractor', 'office', 'work'],
  tax: ['gst', 'tax', 'rate', 'slab'],
  install: ['install', 'installation', 'installed', 'mount', 'location', 'setup'],
  fire: ['fire', 'extinguisher', 'safety', 'isolator'],
  department: ['department', 'directorate', 'ministry', 'govern'],
};

const TERM_TO_CONCEPT = new Map<string, string>();
for (const [c, words] of Object.entries(CONCEPTS)) words.forEach((w) => TERM_TO_CONCEPT.set(stem(w), c));
const CONCEPT_KEYS = Object.keys(CONCEPTS);
const HASH_BUCKETS = 12;

export function embed(text: string): number[] {
  const v = new Array(CONCEPT_KEYS.length + HASH_BUCKETS).fill(0);
  for (const t of terms(text)) {
    const c = TERM_TO_CONCEPT.get(t);
    if (c) v[CONCEPT_KEYS.indexOf(c)] += 1;
    else {
      // unknown words (names, codes) are hashed into a few shared buckets — weak, noisy signal
      let h = 0;
      for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
      v[CONCEPT_KEYS.length + (h % HASH_BUCKETS)] += 0.35;
    }
  }
  return v;
}

export function conceptsOf(text: string): string[] {
  return [...new Set(terms(text).map((t) => TERM_TO_CONCEPT.get(t)).filter((c): c is string => !!c))];
}

/* ------------------------------------------------------------------ */
/* Chunking                                                            */
/* ------------------------------------------------------------------ */

export interface Chunk {
  n: number; // 1-based display number
  docId: string;
  docTitle: string;
  section: string;
  text: string;
  sentences: number[]; // global sentence indices
  words: number;
}

export interface Sentence {
  idx: number;
  docId: string;
  section: string;
  sectionStart: boolean;
  text: string;
  words: number;
}

export interface ChunkResult {
  sentences: Sentence[];
  chunks: Chunk[];
}

export const CHUNK_SIZES = { small: 22, medium: 80, large: 220 } as const;
export type ChunkSize = keyof typeof CHUNK_SIZES;

/** Sentence-aware, section-aware packing with optional overlap (carry-over of trailing sentences). */
export function chunkDocs(docs: RagDoc[], targetWords: number, overlapPct: number): ChunkResult {
  const sentences: Sentence[] = [];
  const chunks: Chunk[] = [];
  for (const doc of docs) {
    // Large chunks may span sections; small/medium respect section boundaries.
    const respectSections = targetWords < 150;
    let current: Sentence[] = [];
    let prev: Sentence[] = [];
    const flush = () => {
      if (current.length === 0) return;
      chunks.push({
        n: chunks.length + 1,
        docId: doc.id,
        docTitle: doc.title,
        section: current[current.length - 1].section,
        text: current.map((s) => s.text).join(' '),
        sentences: current.map((s) => s.idx),
        words: current.reduce((a, s) => a + s.words, 0),
      });
      prev = current;
      current = [];
    };
    const startWithOverlap = () => {
      if (overlapPct <= 0 || prev.length === 0) return;
      const budget = Math.max(1, (targetWords * overlapPct) / 100);
      const carry: Sentence[] = [];
      let w = 0;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (carry.length > 0 && w + prev[i].words > budget) break;
        carry.unshift(prev[i]);
        w += prev[i].words;
        if (w >= budget) break;
      }
      // never carry an entire previous chunk (would duplicate it)
      if (carry.length < prev.length || prev.length === 1) current = [...carry];
    };
    doc.sections.forEach((sec) => {
      const ss = splitSentences(sec.text);
      if (respectSections) {
        flush();
        prev = [];
      }
      ss.forEach((text, i) => {
        const s: Sentence = { idx: sentences.length, docId: doc.id, section: sec.heading, sectionStart: i === 0, text, words: wc(text) };
        sentences.push(s);
        const curWords = current.reduce((a, x) => a + x.words, 0);
        const onlyCarry = current.length > 0 && current.every((c) => prev.includes(c));
        if (current.length > 0 && !onlyCarry && curWords + s.words > targetWords) {
          flush();
          startWithOverlap();
        }
        current.push(s);
      });
    });
    flush();
  }
  return { sentences, chunks };
}

/* ------------------------------------------------------------------ */
/* Retrieval                                                           */
/* ------------------------------------------------------------------ */

export type SearchMode = 'keyword' | 'vector' | 'hybrid';

export interface Scored {
  chunk: Chunk;
  bm25: number;
  vec: number;
  rrf: number;
  rerank: number;
  final: number;
  rankBm25: number;
  rankVec: number;
}

export function bm25Scores(query: string, chunks: Chunk[], k1 = 1.2, b = 0.75): number[] {
  const docsTerms = chunks.map((c) => terms(c.text));
  const avgdl = docsTerms.reduce((a, d) => a + d.length, 0) / Math.max(1, docsTerms.length);
  const N = chunks.length;
  const qTerms = [...new Set(terms(query))];
  const df = new Map<string, number>();
  qTerms.forEach((t) => df.set(t, docsTerms.filter((d) => d.includes(t)).length));
  return docsTerms.map((d) => {
    let score = 0;
    for (const t of qTerms) {
      const f = d.filter((x) => x === t).length;
      if (!f) continue;
      const n = df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.length) / avgdl)));
    }
    return score;
  });
}

/** Display-friendly similarity: real embedding cosines for related text typically sit in the 0.6–0.9 band. */
const displaySim = (c: number) => Math.min(0.99, 0.18 + 0.8 * c);

export function retrieve(query: string, chunks: Chunk[], mode: SearchMode, topK: number): Scored[] {
  if (!query.trim() || chunks.length === 0) return [];
  const bm = bm25Scores(query, chunks);
  const qv = embed(query);
  const vec = chunks.map((c) => displaySim(cosine(qv, embed(c.text))));
  const order = (arr: number[]) => arr.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
  const rb = order(bm);
  const rv = order(vec);
  const rankB = new Array(chunks.length);
  const rankV = new Array(chunks.length);
  rb.forEach((ci, r) => (rankB[ci] = r + 1));
  rv.forEach((ci, r) => (rankV[ci] = r + 1));
  const qTerms = new Set(terms(query));
  const qConcepts = new Set(conceptsOf(query));
  const maxBm = Math.max(1e-9, ...bm);

  const scored: Scored[] = chunks.map((chunk, i) => {
    const rrf = 1 / (60 + rankB[i]) + 1 / (60 + rankV[i]);
    // "Cross-encoder" reranker: joint coverage of the query's exact terms AND concepts in this chunk.
    const ct = new Set(terms(chunk.text));
    const cc = new Set(conceptsOf(chunk.text));
    const termCov = [...qTerms].filter((t) => ct.has(t)).length / Math.max(1, qTerms.size);
    const conCov = [...qConcepts].filter((c) => cc.has(c)).length / Math.max(1, qConcepts.size);
    const rerank = Math.min(0.99, 0.12 + 0.3 * termCov + 0.3 * conCov + 0.28 * vec[i] + 0.05 * (bm[i] / maxBm));
    const final = mode === 'keyword' ? bm[i] : mode === 'vector' ? vec[i] : rerank;
    return { chunk, bm25: bm[i], vec: vec[i], rrf, rerank, final, rankBm25: rankB[i], rankVec: rankV[i] };
  });

  if (mode === 'hybrid') {
    // Stage 1: fuse both lists with Reciprocal Rank Fusion, keep a candidate pool; Stage 2: rerank.
    const pool = [...scored].sort((a, b) => b.rrf - a.rrf).slice(0, Math.max(topK * 3, 8));
    return pool.sort((a, b) => b.rerank - a.rerank).slice(0, topK);
  }
  return [...scored]
    .filter((s) => (mode === 'keyword' ? s.bm25 > 0 : true))
    .sort((a, b) => b.final - a.final)
    .slice(0, topK);
}

/* ------------------------------------------------------------------ */
/* Grounded generation (simulated)                                     */
/* ------------------------------------------------------------------ */

export type AnswerStatus = 'grounded' | 'partial' | 'misgrounded' | 'abstain' | 'hallucinated';

export interface Answer {
  status: AnswerStatus;
  text: string;
  citations: number[];
  explanation: string;
}

const has = (hay: string, needle: string) => hay.toLowerCase().includes(needle.toLowerCase());

export function generateAnswer(query: string, results: Scored[], strict: boolean, preset?: RagQuery): Answer {
  const chunks = results.map((r) => r.chunk);
  if (preset) {
    if (preset.outOfScope) {
      return strict
        ? { status: 'abstain', text: preset.correct, citations: [], explanation: 'Correct behaviour: nothing relevant was retrieved and the strict grounding prompt let the model say so.' }
        : { status: 'hallucinated', text: preset.wrong ?? '', citations: [], explanation: 'Nothing relevant was retrieved, but the lenient prompt let the model answer from “general knowledge” — a confident, uncited, unverifiable claim.' };
    }
    const full = chunks.filter((c) => preset.answerKeys.every((k) => has(c.text, k)) && (!preset.qualifier || has(c.text, preset.qualifier)));
    if (full.length) return { status: 'grounded', text: preset.correct, citations: full.map((c) => c.n), explanation: 'A retrieved chunk contains both the answer and its qualifying context, so the answer is fully supported.' };

    const distractor = preset.distractorKey ? chunks.find((c) => has(c.text, preset.distractorKey!)) : undefined;
    if (distractor && preset.wrong) {
      return {
        status: 'misgrounded',
        text: preset.wrong,
        citations: [distractor.n],
        explanation: `Hallucination with a real citation: the right chunk was not retrieved (or was split), so the model latched onto a similar-looking fact (“${preset.distractorKey}”) in Chunk #${distractor.n}. The citation looks legitimate — that is what makes this failure dangerous.`,
      };
    }
    const keyOnly = chunks.filter((c) => preset.answerKeys.some((k) => has(c.text, k)));
    if (keyOnly.length) {
      const sentence = splitSentences(keyOnly[0].text).find((s) => preset.answerKeys.some((k) => has(s, k))) ?? keyOnly[0].text;
      return {
        status: 'partial',
        text: sentence,
        citations: keyOnly.map((c) => c.n),
        explanation: 'The fact was retrieved but separated from its context (or only part of a multi-part answer was found). The model can quote it, but cannot be sure it applies — a chunking/overlap problem.',
      };
    }
    return strict
      ? { status: 'abstain', text: 'I couldn’t find this in the provided documents. Please contact the relevant department or refine your question.', citations: [], explanation: 'Retrieval missed the relevant chunk entirely. Strict grounding prevented a made-up answer — but the user still did not get help. Fix retrieval.' }
      : { status: 'hallucinated', text: preset.wrong ?? 'Based on general practice, this is usually handled within a few days.', citations: [], explanation: 'Retrieval missed the relevant chunk and the lenient prompt let the model fill the gap from its training data — a fluent, uncited invention.' };
  }

  // Free-form query: extractive answer from best-matching sentences.
  const qT = new Set(terms(query));
  const qC = new Set(conceptsOf(query));
  const cands = chunks.flatMap((c) =>
    splitSentences(c.text).map((s) => {
      const st = new Set(terms(s));
      const sc = new Set(conceptsOf(s));
      const score = [...qT].filter((t) => st.has(t)).length + 0.8 * [...qC].filter((x) => sc.has(x)).length;
      return { s, n: c.n, score };
    }),
  );
  cands.sort((a, b) => b.score - a.score);
  const best = cands[0];
  const threshold = Math.max(1.6, (qT.size + qC.size) * 0.3);
  if (!best || best.score < threshold) {
    return strict
      ? { status: 'abstain', text: 'I couldn’t find this in the provided documents.', citations: [], explanation: 'No retrieved sentence matched the question strongly enough, so the strict prompt abstained.' }
      : { status: 'hallucinated', text: 'Generally speaking, organisations handle this according to their standard procedures and timelines.', citations: [], explanation: 'Weak retrieval + lenient prompt = a vague, ungrounded answer from general knowledge.' };
  }
  const picked = cands.filter((c) => c.score >= best.score * 0.8).slice(0, 2);
  return {
    status: 'grounded',
    text: picked.map((p) => p.s).join(' '),
    citations: [...new Set(picked.map((p) => p.n))],
    explanation: 'Extractive answer built from the best-matching retrieved sentences, with citations. Always verify against the highlighted source.',
  };
}

export function contextTokens(results: Scored[]): number {
  return results.reduce((a, r) => a + tokenize(r.chunk.text).length, 0);
}

/** Parse pasted text into a RagDoc (paragraphs become sections). */
export function customDoc(text: string): RagDoc {
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return {
    id: 'custom',
    title: 'Your pasted document',
    short: 'Your text',
    kind: 'Custom document pasted by you',
    sections: paras.map((p, i) => ({ heading: `Paragraph ${i + 1}`, text: p })),
  };
}
