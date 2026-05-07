import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getOpenAI, MODELS, estimateCostUsd } from './client';
import {
  CATEGORY_SLUGS,
  CategorizeResult,
  categorizeResultJsonSchema,
} from './schemas';
import { CATEGORIZE_SYSTEM_PROMPT } from './prompts';
import { lookupMerchant, upsertLearnedMerchant } from './merchantKb';
import type { Database } from '@/lib/supabase/types';

export type CategorizationOutcome = {
  categoryId: string | null;
  categorySlug: (typeof CATEGORY_SLUGS)[number] | null;
  merchantId: string | null;
  confidence: number;
  source: 'kb' | 'llm' | 'unknown';
  costUsd: number;
};

export async function categorizeExpense(
  client: SupabaseClient<Database>,
  args: { merchantText: string; notes?: string | null },
): Promise<CategorizationOutcome> {
  const hit = await lookupMerchant(client, args.merchantText);
  if (hit && hit.default_category_id) {
    return {
      categoryId: hit.default_category_id,
      categorySlug: await slugForCategory(client, hit.default_category_id),
      merchantId: hit.id,
      confidence: hit.similarity,
      source: 'kb',
      costUsd: 0,
    };
  }

  const llm = await llmCategorize({ merchant: args.merchantText, notes: args.notes ?? null });
  const { data: cat } = await client
    .from('categories')
    .select('id, slug')
    .eq('slug', llm.result.category_slug)
    .maybeSingle();

  if (cat) {
    await upsertLearnedMerchant(client, {
      rawName: args.merchantText,
      categoryId: cat.id,
      displayName: args.merchantText,
    });
    return {
      categoryId: cat.id,
      categorySlug: cat.slug as (typeof CATEGORY_SLUGS)[number],
      merchantId: null,
      confidence: llm.result.confidence,
      source: 'llm',
      costUsd: llm.costUsd,
    };
  }

  return {
    categoryId: null,
    categorySlug: null,
    merchantId: null,
    confidence: 0,
    source: 'unknown',
    costUsd: llm.costUsd,
  };
}

async function slugForCategory(
  client: SupabaseClient<Database>,
  id: string,
): Promise<(typeof CATEGORY_SLUGS)[number] | null> {
  const { data } = await client.from('categories').select('slug').eq('id', id).maybeSingle();
  if (!data) return null;
  return CATEGORY_SLUGS.includes(data.slug as (typeof CATEGORY_SLUGS)[number])
    ? (data.slug as (typeof CATEGORY_SLUGS)[number])
    : null;
}

async function llmCategorize(input: {
  merchant: string;
  notes: string | null;
}): Promise<{ result: CategorizeResult; costUsd: number }> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: MODELS.parser,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'CategorizeResult',
        schema: categorizeResultJsonSchema as Record<string, unknown>,
        strict: false,
      },
    },
    messages: [
      { role: 'system', content: CATEGORIZE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `merchant: ${input.merchant}\nnotes: ${input.notes ?? ''}`,
      },
    ],
    temperature: 0,
  });

  const raw = response.choices[0]?.message.content ?? '{}';
  const parsed = CategorizeResult.parse(JSON.parse(raw));
  const usage = response.usage;
  const costUsd = estimateCostUsd(
    MODELS.parser,
    usage?.prompt_tokens ?? 0,
    usage?.completion_tokens ?? 0,
  );
  return { result: parsed, costUsd };
}
