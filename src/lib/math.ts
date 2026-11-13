/** Numerically-stable softmax with temperature. Temperature 0 collapses to argmax. */
export function softmax(logits: number[], temperature = 1): number[] {
  if (logits.length === 0) return [];
  if (temperature <= 0.001) {
    const max = Math.max(...logits);
    const idx = logits.indexOf(max);
    return logits.map((_, i) => (i === idx ? 1 : 0));
  }
  const scaled = logits.map((l) => l / temperature);
  const m = Math.max(...scaled);
  const exps = scaled.map((v) => Math.exp(v - m));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/** Indices kept by nucleus (top-p) sampling, in descending probability order. */
export function topPIndices(probs: number[], topP: number): number[] {
  const order = probs.map((p, i) => [p, i] as const).sort((a, b) => b[0] - a[0]);
  const kept: number[] = [];
  let cum = 0;
  for (const [p, i] of order) {
    kept.push(i);
    cum += p;
    if (cum >= topP - 1e-9) break;
  }
  return kept;
}

/** Shannon entropy in bits — how "unsure" a distribution is. */
export function entropy(probs: number[]): number {
  return -probs.reduce((acc, p) => (p > 0 ? acc + p * Math.log2(p) : acc), 0);
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Deterministic PRNG (mulberry32) so simulations are reproducible per "run". */
export function rng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Sample an index from a probability vector using a [0,1) random number. */
export function sampleIndex(probs: number[], r: number, allowed?: number[]): number {
  const idxs = allowed ?? probs.map((_, i) => i);
  const total = idxs.reduce((a, i) => a + probs[i], 0);
  let x = r * total;
  for (const i of idxs) {
    x -= probs[i];
    if (x <= 0) return i;
  }
  return idxs[idxs.length - 1];
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
