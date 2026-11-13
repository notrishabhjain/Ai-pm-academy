/**
 * Illustrative model tiers used by every cost/latency simulator in the app.
 * Prices are realistic *shapes* (per 1M tokens, USD) for teaching — always check
 * your vendor's current price sheet before putting numbers in a business case.
 */
export interface ModelTier {
  id: 'small' | 'mid' | 'frontier' | 'reasoning';
  name: string;
  examples: string;
  inputPerM: number;
  outputPerM: number;
  /** Fraction of the normal input price charged for cache hits (0.1 = 90% discount). */
  cachedInputFactor: number;
  ttftMs: number;
  tokensPerSec: number;
  /** Hidden "thinking" tokens generated per visible output token (reasoning models). */
  thinkingMultiplier: number;
  quality: number;
}

export const MODEL_TIERS: ModelTier[] = [
  {
    id: 'small',
    name: 'Small / Fast',
    examples: 'Lightweight "mini / flash / haiku-class" models',
    inputPerM: 0.2,
    outputPerM: 0.8,
    cachedInputFactor: 0.1,
    ttftMs: 250,
    tokensPerSec: 180,
    thinkingMultiplier: 0,
    quality: 62,
  },
  {
    id: 'mid',
    name: 'Balanced',
    examples: 'Mid-size general-purpose models',
    inputPerM: 1,
    outputPerM: 5,
    cachedInputFactor: 0.1,
    ttftMs: 450,
    tokensPerSec: 110,
    thinkingMultiplier: 0,
    quality: 78,
  },
  {
    id: 'frontier',
    name: 'Frontier',
    examples: 'Top-tier flagship models',
    inputPerM: 3,
    outputPerM: 15,
    cachedInputFactor: 0.1,
    ttftMs: 700,
    tokensPerSec: 70,
    thinkingMultiplier: 0,
    quality: 90,
  },
  {
    id: 'reasoning',
    name: 'Reasoning / Thinking',
    examples: 'Models that "think" before answering',
    inputPerM: 5,
    outputPerM: 25,
    cachedInputFactor: 0.1,
    ttftMs: 4500,
    tokensPerSec: 60,
    thinkingMultiplier: 3,
    quality: 96,
  },
];

export const tierById = (id: ModelTier['id']): ModelTier => MODEL_TIERS.find((t) => t.id === id) ?? MODEL_TIERS[1];

export interface CostInput {
  inputTokens: number;
  outputTokens: number;
  cachedFraction: number;
  tier: ModelTier;
}

/** Cost of ONE request in USD, split into its parts. */
export function requestCost({ inputTokens, outputTokens, cachedFraction, tier }: CostInput) {
  const cached = inputTokens * cachedFraction;
  const uncached = inputTokens - cached;
  const thinking = outputTokens * tier.thinkingMultiplier;
  const inputUncachedUsd = (uncached / 1e6) * tier.inputPerM;
  const inputCachedUsd = (cached / 1e6) * tier.inputPerM * tier.cachedInputFactor;
  const outputUsd = (outputTokens / 1e6) * tier.outputPerM;
  const thinkingUsd = (thinking / 1e6) * tier.outputPerM;
  return {
    inputUncachedUsd,
    inputCachedUsd,
    outputUsd,
    thinkingUsd,
    totalUsd: inputUncachedUsd + inputCachedUsd + outputUsd + thinkingUsd,
  };
}

export function requestLatency(tier: ModelTier, outputTokens: number, inputTokens = 1000) {
  // Longer prompts add a little prefill time to time-to-first-token.
  const ttft = tier.ttftMs + (inputTokens / 1000) * 40 + outputTokens * tier.thinkingMultiplier * (1000 / tier.tokensPerSec) * 0.25;
  const generation = (outputTokens / tier.tokensPerSec) * 1000;
  return { ttftMs: Math.round(ttft), totalMs: Math.round(ttft + generation) };
}
