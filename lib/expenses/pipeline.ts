import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { categorizeExpense } from '@/lib/openai/categorize';
import { buildNudgeForExpense, type Nudge } from './nudge';
import type { ReceiptExtraction } from '@/lib/openai/schemas';

export type FinalizeArgs = {
  client: SupabaseClient<Database>;
  studentId: string;
  expenseId: string;
  source: 'photo' | 'voice' | 'manual';
  extracted: ReceiptExtraction;
  rawOcr?: unknown;
  aiModel: string;
  aiCostUsd: number;
};

export type FinalizeResult = {
  expenseId: string;
  status: 'pending_review' | 'confirmed';
  amountCents: number;
  categorySlug: string | null;
  merchantText: string;
  coinsEarned: number;
  nudge: Nudge;
};

const REVIEW_THRESHOLD = 0.7;

export async function finalizeExpense(args: FinalizeArgs): Promise<FinalizeResult> {
  const { client, extracted, expenseId, studentId } = args;

  const cat = await categorizeExpense(client, {
    merchantText: extracted.merchant.raw,
    notes: extracted.notes,
  });

  const minConfidence = Math.min(
    extracted.confidence.merchant,
    extracted.confidence.amount,
    cat.confidence || 0.6,
  );
  const status: 'pending_review' | 'confirmed' =
    minConfidence < REVIEW_THRESHOLD ? 'pending_review' : 'confirmed';

  const amountCents = Math.round(Math.max(extracted.amount.value, 0.01) * 100);
  const occurredAt = extracted.occurred_at ? new Date(extracted.occurred_at) : new Date();

  const { error } = await client
    .from('expenses')
    .update({
      amount_cents: amountCents,
      currency:
        extracted.amount.currency === 'OTHER'
          ? 'HKD'
          : (extracted.amount.currency as 'HKD' | 'CNY' | 'USD'),
      merchant_text: extracted.merchant.raw,
      merchant_id: cat.merchantId,
      category_id: cat.categoryId,
      occurred_at: occurredAt.toISOString(),
      source: args.source,
      status,
      raw_ocr: (args.rawOcr ?? extracted) as never,
      confidence: minConfidence,
      ai_model: args.aiModel,
      ai_cost_usd: args.aiCostUsd + cat.costUsd,
    })
    .eq('id', expenseId);

  if (error) throw new Error(`expense_update_failed: ${error.message}`);

  let coinsEarned = 0;
  if (status === 'confirmed') {
    const { data: reward } = await client.rpc('confirm_expense', {
      p_expense_id: expenseId,
    });
    coinsEarned = typeof reward === 'number' ? reward : 0;
  }

  const nudge = await buildNudgeForExpense(client, {
    studentId,
    categoryId: cat.categoryId,
    coinsEarned,
  });

  return {
    expenseId,
    status,
    amountCents,
    categorySlug: cat.categorySlug,
    merchantText: extracted.merchant.raw,
    coinsEarned,
    nudge,
  };
}
