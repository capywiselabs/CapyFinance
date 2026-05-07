import 'server-only';
import OpenAI from 'openai';

let cached: OpenAI | undefined;

export function getOpenAI(): OpenAI {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  cached = new OpenAI({
    apiKey,
    organization: process.env.OPENAI_ORG_ID || undefined,
  });
  return cached;
}

export const MODELS = {
  vision: 'gpt-4o',
  parser: 'gpt-4o-mini',
  whisper: 'whisper-1',
} as const;

// Approximate per-1K-token costs for the budget logger (USD).
// Vision adds image tokens; we treat it as a flat surcharge per call below.
const PRICING_PER_1K = {
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'whisper-1': { input: 0, output: 0 }, // priced per minute, set via duration
};

export function estimateCostUsd(
  model: keyof typeof PRICING_PER_1K,
  inputTokens: number,
  outputTokens: number,
  extras: { audioMinutes?: number; imageCount?: number } = {},
): number {
  const p = PRICING_PER_1K[model];
  let cost = (inputTokens / 1000) * p.input + (outputTokens / 1000) * p.output;
  if (extras.audioMinutes) cost += extras.audioMinutes * 0.006;
  if (extras.imageCount) cost += extras.imageCount * 0.00765;
  return Number(cost.toFixed(5));
}
