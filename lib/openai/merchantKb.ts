import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export function normalizeMerchantName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export type MerchantHit = {
  id: string;
  name_normalized: string;
  default_category_id: string | null;
  display_name_zh: string | null;
  display_name_en: string | null;
  similarity: number;
};

/**
 * Fuzzy lookup with pg_trgm. Returns best match with similarity >= 0.55.
 * Looks at name_normalized AND aliases.
 */
export async function lookupMerchant(
  client: SupabaseClient<Database>,
  rawName: string,
): Promise<MerchantHit | null> {
  const normalized = normalizeMerchantName(rawName);
  if (!normalized) return null;

  const { data: exact } = await client
    .from('merchants_kb')
    .select('id, name_normalized, default_category_id, display_name_zh, display_name_en')
    .eq('name_normalized', normalized)
    .maybeSingle();

  if (exact) {
    return { ...exact, similarity: 1 };
  }

  const { data: aliasHit } = await client
    .from('merchants_kb')
    .select('id, name_normalized, default_category_id, display_name_zh, display_name_en, aliases')
    .contains('aliases', [rawName])
    .limit(1)
    .maybeSingle();

  if (aliasHit) {
    return { ...aliasHit, similarity: 1 };
  }

  // Trigram similarity via RPC (fallback to client-side ranking on a small candidate set).
  const { data: candidates } = await client
    .from('merchants_kb')
    .select('id, name_normalized, default_category_id, display_name_zh, display_name_en, aliases')
    .ilike('name_normalized', `%${normalized.split(' ')[0] ?? normalized}%`)
    .limit(20);

  if (!candidates || candidates.length === 0) return null;

  let best: MerchantHit | null = null;
  for (const c of candidates) {
    const sim = trigramSimilarity(normalized, c.name_normalized);
    if (!best || sim > best.similarity) {
      best = {
        id: c.id,
        name_normalized: c.name_normalized,
        default_category_id: c.default_category_id,
        display_name_zh: c.display_name_zh,
        display_name_en: c.display_name_en,
        similarity: sim,
      };
    }
  }

  if (best && best.similarity >= 0.55) return best;
  return null;
}

/**
 * Cheap client-side trigram similarity for fallback.
 * Mirrors PG's `similarity()` shape closely enough for ranking, not for exact parity.
 */
function trigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const trigrams = (s: string) => {
    const padded = `  ${s} `;
    const set = new Set<string>();
    for (let i = 0; i < padded.length - 2; i++) set.add(padded.slice(i, i + 3));
    return set;
  };
  const ta = trigrams(a);
  const tb = trigrams(b);
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  const union = ta.size + tb.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Upsert a new merchant from an LLM-categorised receipt so future lookups are exact.
 */
export async function upsertLearnedMerchant(
  client: SupabaseClient<Database>,
  args: {
    rawName: string;
    categoryId: string;
    displayName?: string;
  },
): Promise<void> {
  const normalized = normalizeMerchantName(args.rawName);
  if (!normalized) return;
  await client.from('merchants_kb').upsert(
    {
      name_normalized: normalized,
      default_category_id: args.categoryId,
      display_name_en: args.displayName ?? args.rawName,
      source: 'llm',
    },
    { onConflict: 'name_normalized', ignoreDuplicates: true },
  );
}
