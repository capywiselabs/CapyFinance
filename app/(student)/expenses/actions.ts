'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { getServerEnv } from '@/lib/env';

const RequestUploadInput = z.object({
  contentType: z.string().regex(/^(image|audio)\//),
  kind: z.enum(['receipt', 'voice']),
});

export type RequestUploadResult = {
  expenseId: string;
  storagePath: string;
  signedUrl: string;
  token: string;
  bucket: 'receipts' | 'voice';
};

export async function requestExpenseUpload(
  input: z.infer<typeof RequestUploadInput>,
): Promise<RequestUploadResult> {
  const parsed = RequestUploadInput.parse(input);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not_authenticated');

  const env = getServerEnv();
  const ext = parsed.contentType.split('/')[1]?.split(';')[0] ?? 'bin';
  const bucket = parsed.kind === 'receipt' ? 'receipts' : 'voice';

  const { data: expense, error: insertErr } = await supabase
    .from('expenses')
    .insert({
      student_id: user.id,
      amount_cents: 1, // placeholder; updated after AI parse
      currency: 'HKD',
      source: parsed.kind === 'receipt' ? 'photo' : 'voice',
      status: 'pending_review',
    })
    .select('id')
    .single();

  if (insertErr || !expense) {
    throw new Error(insertErr?.message ?? 'failed_to_create_expense');
  }

  const storagePath = `${user.id}/${expense.id}.${ext}`;

  // Service-role to mint the upload URL (bypasses storage RLS for the create token call).
  const service = createServiceRoleClient();
  const { data: signed, error: signErr } = await service.storage
    .from(bucket)
    .createSignedUploadUrl(storagePath);

  if (signErr || !signed) {
    throw new Error(signErr?.message ?? 'failed_to_sign_upload');
  }

  const expiresAt =
    parsed.kind === 'receipt'
      ? new Date(Date.now() + env.RECEIPT_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
      : null;

  await supabase
    .from('expenses')
    .update({
      receipt_storage_path: parsed.kind === 'receipt' ? storagePath : null,
      receipt_expires_at: expiresAt,
      voice_storage_path: parsed.kind === 'voice' ? storagePath : null,
    })
    .eq('id', expense.id);

  return {
    expenseId: expense.id,
    storagePath,
    signedUrl: signed.signedUrl,
    token: signed.token,
    bucket,
  };
}
