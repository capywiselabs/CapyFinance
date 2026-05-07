// Daily cron: hard-delete receipt images past their retention window.
// Wire up in supabase/config.toml or via `supabase functions schedule`.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

Deno.serve(async (req: Request) => {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== Deno.env.get('CRON_SECRET')) {
    return new Response('forbidden', { status: 403 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: due } = await supabase
    .from('expenses')
    .select('id, receipt_storage_path')
    .lt('receipt_expires_at', new Date().toISOString())
    .not('receipt_storage_path', 'is', null);

  let deleted = 0;
  for (const row of (due ?? []) as Array<{ id: string; receipt_storage_path: string | null }>) {
    if (!row.receipt_storage_path) continue;
    await supabase.storage.from('receipts').remove([row.receipt_storage_path]);
    await supabase
      .from('expenses')
      .update({ receipt_storage_path: null, receipt_expires_at: null })
      .eq('id', row.id);
    deleted++;
  }

  return Response.json({ deleted });
});
