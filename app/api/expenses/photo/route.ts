import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { extractReceipt } from '@/lib/openai/ocr';
import { finalizeExpense } from '@/lib/expenses/pipeline';
import { posthogServer } from '@/lib/posthog/server';

const Body = z.object({ expenseId: z.string().uuid() });

export async function POST(req: Request) {
  const json = await req.json();
  const { expenseId } = Body.parse(json);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const { data: expense } = await supabase
    .from('expenses')
    .select('id, student_id, receipt_storage_path')
    .eq('id', expenseId)
    .maybeSingle();

  if (!expense || expense.student_id !== user.id || !expense.receipt_storage_path) {
    return NextResponse.json({ error: 'expense_not_found' }, { status: 404 });
  }

  const service = createServiceRoleClient();
  const { data: signed, error: signErr } = await service.storage
    .from('receipts')
    .createSignedUrl(expense.receipt_storage_path, 60);

  if (signErr || !signed) {
    return NextResponse.json({ error: 'cannot_read_receipt' }, { status: 500 });
  }

  const startedAt = Date.now();
  const ocr = await extractReceipt(signed.signedUrl);

  const result = await finalizeExpense({
    client: supabase,
    studentId: user.id,
    expenseId,
    source: 'photo',
    extracted: ocr.data,
    rawOcr: ocr.data,
    aiModel: ocr.model,
    aiCostUsd: ocr.costUsd,
  });

  posthogServer.capture({
    distinctId: user.id,
    event: 'expense_logged',
    properties: {
      source: 'photo',
      status: result.status,
      category: result.categorySlug,
      amount_cents: result.amountCents,
      coins: result.coinsEarned,
      ai_cost_usd: ocr.costUsd,
      latency_ms: Date.now() - startedAt,
    },
  });

  return NextResponse.json(result);
}
