/** Lightweight, India-focused PII detection & masking (regex-based, for teaching). */

export interface PiiHit {
  type: 'AADHAAR' | 'PAN' | 'PHONE' | 'EMAIL' | 'IFSC';
  value: string;
  token: string;
}

const PATTERNS: { type: PiiHit['type']; re: RegExp }[] = [
  { type: 'EMAIL', re: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  { type: 'AADHAAR', re: /\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/g },
  { type: 'PAN', re: /\b[A-Z]{5}\d{4}[A-Z]\b/g },
  { type: 'IFSC', re: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g },
  { type: 'PHONE', re: /(?:\+91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/g },
];

export function maskPii(text: string): { masked: string; hits: PiiHit[] } {
  const hits: PiiHit[] = [];
  const counters: Record<string, number> = {};
  let masked = text;
  for (const { type, re } of PATTERNS) {
    masked = masked.replace(re, (m) => {
      counters[type] = (counters[type] ?? 0) + 1;
      const token = `[${type}_${counters[type]}]`;
      hits.push({ type, value: m, token });
      return token;
    });
  }
  return { masked, hits };
}

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all |any )?(previous|prior|above|your) (instructions|rules|prompts?)/i,
  /disregard (all |the |your )?(previous |prior )?(instructions|rules)/i,
  /you are now (in )?\w+/i,
  /(admin|developer|god|dan) mode/i,
  /(print|reveal|show|repeat) (your |the )?(system prompt|hidden instructions|instructions)/i,
  /^\s*system\s*:/im,
  /do not (mention|reveal) this/i,
  /approve this application/i,
];

export function detectInjection(text: string): string[] {
  return INJECTION_PATTERNS.filter((re) => re.test(text)).map((re) => re.source);
}
