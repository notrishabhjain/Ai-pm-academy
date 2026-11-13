/**
 * A teaching tokenizer that behaves like real BPE tokenizers (GPT/Claude-style) in the ways
 * that matter to a PM: common words are one token, rare words split into fragments, numbers
 * split into groups of 3 digits, punctuation is separate, and non-Latin scripts cost more tokens.
 * Counts are realistic estimates (usually within ~10–20% of production tokenizers for English).
 */

export type TokenKind = 'word' | 'subword' | 'number' | 'punct' | 'space' | 'script' | 'emoji';

export interface Token {
  text: string;
  id: number;
  kind: TokenKind;
  /** Index of the pre-token (word) this fragment came from — used for colouring. */
  group: number;
}

const COMMON = new Set(
  (
    'the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is are was were been has had did said am does done made being here very much more such many those may must should still own same where why while each few both between through during before under again further once off down above below against own too nor every another least last long great little right old big high different small large next early young important public bad able hello thanks please yes ok okay dear sir madam regards help need problem issue request application apply applied applicant citizen citizens government department ministry office officer service services scheme form forms passport visa aadhaar card number status pending delay delayed month months days week weeks date name address phone email mobile document documents policy policies rule rules section act law court case data model models token tokens prompt prompts answer answers question questions user users customer customers system systems project projects product team manager program cost costs price budget money payment paid pay bill tax income bank account loan credit report reports review update updated support security secure password login access file files page pages web online portal website app software code test tests testing quality risk risks plan plans meeting meetings business company market sales email world country state city india indian national local school student students health hospital doctor medical water power energy solar electricity road roads transport train bus car home house land property family child children man woman men women information information question learn learning machine intelligence artificial language large small chat search find found show shown tell told ask asked call called send sent receive received open close closed start started stop stopped run running read write written thank kindly sorry approve approved reject rejected verify verified check checked complete completed submit submitted processing process issue issued renewal renew grievance complaint complaints resolve resolved january february march april june july august september october november december monday tuesday wednesday thursday friday saturday sunday order orders today tomorrow yesterday morning evening office'
  ).split(/\s+/),
);

const SUFFIXES = ['ization', 'isation', 'ations', 'ation', 'ments', 'ment', 'ness', 'ities', 'ity', 'ings', 'ing', 'tions', 'tion', 'sions', 'sion', 'ables', 'able', 'ible', 'ally', 'ful', 'less', 'ous', 'ive', 'ize', 'ise', 'ized', 'ised', 'ers', 'er', 'est', 'ed', 'ly', 'es', 's'];

const SCRIPT_RE = /[ऀ-ॿঀ-৿਀-੿઀-૿଀-୿஀-௿ఀ-౿ಀ-೿ഀ-ൿ؀-ۿЀ-ӿ一-鿿぀-ヿ가-힯]/u;
const EMOJI_RE = /\p{Extended_Pictographic}/u;

function idFor(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100256;
}

function chunk(s: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out;
}

function splitLatinWord(raw: string): { text: string; kind: TokenKind }[] {
  // raw may include a leading space (GPT-style tokenizers attach it to the word)
  const lead = raw.startsWith(' ') ? ' ' : '';
  const word = raw.slice(lead.length);
  const lower = word.toLowerCase();
  if (COMMON.has(lower) && word.length <= 14) return [{ text: raw, kind: 'word' }];
  if (word.length <= 3) return [{ text: raw, kind: 'word' }];

  // strip at most one known suffix if the remaining stem is reasonable
  let stem = word;
  let suffix = '';
  for (const suf of SUFFIXES) {
    if (lower.endsWith(suf) && lower.length - suf.length >= 3) {
      stem = word.slice(0, word.length - suf.length);
      suffix = word.slice(word.length - suf.length);
      break;
    }
  }
  const pieces: { text: string; kind: TokenKind }[] = [];
  if (COMMON.has(stem.toLowerCase()) || stem.length <= 4) {
    pieces.push({ text: lead + stem, kind: suffix ? 'subword' : 'word' });
  } else {
    const isCap = /^[A-Z]/.test(stem);
    const parts = chunk(stem, isCap ? 3 : 4);
    // merge a trailing 1-char fragment into the previous piece (BPE rarely leaves those)
    if (parts.length > 1 && parts[parts.length - 1].length === 1) {
      const last = parts.pop()!;
      parts[parts.length - 1] += last;
    }
    parts.forEach((p, i) => pieces.push({ text: (i === 0 ? lead : '') + p, kind: 'subword' }));
  }
  if (suffix) pieces.push({ text: suffix, kind: 'subword' });
  return pieces;
}

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  if (!text) return tokens;
  // Pre-tokenisation regex modelled on GPT-style tokenizers.
  const re = /'(?:s|t|re|ve|m|ll|d)\b| ?\p{L}[\p{L}\p{M}]*| ?\p{N}+| ?\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*| ?[^\s\p{L}\p{N}]+|\n+|\s+/gu;
  let group = 0;
  for (const m of text.matchAll(re)) {
    const piece = m[0];
    group++;
    const push = (t: string, kind: TokenKind) => tokens.push({ text: t, id: idFor(t), kind, group });

    if (/^\s+$/.test(piece)) {
      if (piece.includes('\n')) piece.split('').forEach((ch) => push(ch, 'space'));
      else push(piece, 'space');
      continue;
    }
    const lead = piece.startsWith(' ') ? ' ' : '';
    const body = piece.slice(lead.length);

    if (/^\p{N}+$/u.test(body)) {
      const groups = chunk(body, 3);
      groups.forEach((g, i) => push((i === 0 ? lead : '') + g, 'number'));
      continue;
    }
    if (EMOJI_RE.test(body)) {
      // byte-level fallback: emoji usually cost 2–3 tokens
      push(lead + body, 'emoji');
      push('​', 'emoji');
      continue;
    }
    if (SCRIPT_RE.test(body)) {
      // Indic & other scripts: roughly one token per 1–2 code points in many tokenizers.
      const cps = Array.from(body);
      const parts: string[] = [];
      for (let i = 0; i < cps.length; i += 2) parts.push(cps.slice(i, i + 2).join(''));
      parts.forEach((p, i) => push((i === 0 ? lead : '') + p, 'script'));
      continue;
    }
    if (/^\p{L}/u.test(body)) {
      splitLatinWord(piece).forEach((p) => push(p.text, p.kind));
      continue;
    }
    // punctuation & symbols: common clusters stay together
    if (['...', '--', '->', '=>', '**', '##', '://', '</', '/>', '{"', '"}', '",', '":'].includes(body)) push(piece, 'punct');
    else Array.from(body).forEach((ch, i) => push((i === 0 ? lead : '') + ch, 'punct'));
  }
  return tokens;
}

export function countWords(text: string): number {
  return (text.trim().match(/\S+/g) ?? []).length;
}

export const TOKEN_COLORS = [
  'bg-indigo-200 text-indigo-950 dark:bg-indigo-500/40 dark:text-indigo-50',
  'bg-emerald-200 text-emerald-950 dark:bg-emerald-500/40 dark:text-emerald-50',
  'bg-amber-200 text-amber-950 dark:bg-amber-500/40 dark:text-amber-50',
  'bg-rose-200 text-rose-950 dark:bg-rose-500/40 dark:text-rose-50',
  'bg-sky-200 text-sky-950 dark:bg-sky-500/40 dark:text-sky-50',
  'bg-violet-200 text-violet-950 dark:bg-violet-500/40 dark:text-violet-50',
];
