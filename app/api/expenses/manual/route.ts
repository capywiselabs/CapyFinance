import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { categorizeExpense } from '@/lib/openai/categorize';
import { buildNudgeForExpense } from '@/lib/expenses/nudge';
import { posthogServer } from '@/lib/posthog/server';

const Body = z.object({
  amountCents: z.number().int().positive(),
  currency: z.enum(['HKD', 'CNY', 'USD']).default('HKD'),
  merchantText: z.string().min(1).max(200),
  occurredAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const input = Body.parse(json);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const startedAt = Date.now();
  const cat = await categorizeExpense(supabase, {
    merchantText: input.merchantText,
    notes: input.notes ?? null,
  });

  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      student_id: user.id,
      amount_cents: input.amountCents,
      currency: input.currency,
      merchant_text: input.merchantText,
      merchant_id: cat.merchantId,
      category_id: cat.categoryId,
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      source: 'manual',
      status: 'confirmed',
      notes: input.notes ?? null,
      confidence: cat.confidence,
      ai_model: cat.source === 'llm' ? 'gpt-4o-mini' : null,
      ai_cost_usd: cat.costUsd,
    })
    .select('id')
    .single();

  if (error || !expense) {
    return NextResponse.json({ error: error?.message ?? 'insert_failed' }, { status: 500 });
  }

  const { data: reward } = await supabase.rpc('confirm_expense', { p_expense_id: expense.id });
  const coinsEarned = typeof reward === 'number' ? reward : 0;

  const nudge = await buildNudgeForExpense(supabase, {
    studentId: user.id,
    categoryId: cat.categoryId,
    coinsEarned,
  });

  posthogServer.capture({
    distinctId: user.id,
    event: 'expense_logged',
    properties: {
      source: 'manual',
      status: 'confirmed',
      category: cat.categorySlug,
      amount_cents: input.amountCents,
      coins: coinsEarned,
      ai_cost_usd: cat.costUsd,
      latency_ms: Date.now() - startedAt,
    },
  });

  return NextResponse.json({
    expenseId: expense.id,
    status: 'confirmed' as const,
    amountCents: input.amountCents,
    categorySlug: cat.categorySlug,
    merchantText: input.merchantText,
    coinsEarned,
    nudge,
  });
}
