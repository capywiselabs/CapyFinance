import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { transcribeAudio, parseSpokenExpense } from '@/lib/openai/whisper';
import { finalizeExpense } from '@/lib/expenses/pipeline';
import { MODELS, estimateCostUsd } from '@/lib/openai/client';
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
    .select('id, student_id, voice_storage_path')
    .eq('id', expenseId)
    .maybeSingle();

  if (!expense || expense.student_id !== user.id || !expense.voice_storage_path) {
    return NextResponse.json({ error: 'expense_not_found' }, { status: 404 });
  }

  const service = createServiceRoleClient();
  const { data: blob, error: dlErr } = await service.storage
    .from('voice')
    .download(expense.voice_storage_path);
  if (dlErr || !blob) {
    return NextResponse.json({ error: 'cannot_read_voice' }, { status: 500 });
  }

  const startedAt = Date.now();
  const transcribed = await transcribeAudio(blob, 'voice.webm');
  const parsed = await parseSpokenExpense(transcribed.text);

  const totalCost =
    transcribed.costUsd + estimateCostUsd(MODELS.parser, 200, 200);

  await supabase
    .from('expenses')
    .update({ voice_transcript: transcribed.text })
    .eq('id', expenseId);

  const result = await finalizeExpense({
    client: supabase,
    studentId: user.id,
    expenseId,
    source: 'voice',
    extracted: parsed,
    rawOcr: { transcript: transcribed.text, parsed },
    aiModel: `${MODELS.whisper}+${MODELS.parser}`,
    aiCostUsd: totalCost,
  });

  posthogServer.capture({
    distinctId: user.id,
    event: 'expense_logged',
    properties: {
      source: 'voice',
      status: result.status,
      category: result.categorySlug,
      amount_cents: result.amountCents,
      coins: result.coinsEarned,
      ai_cost_usd: totalCost,
      latency_ms: Date.now() - startedAt,
    },
  });

  return NextResponse.json(result);
}
