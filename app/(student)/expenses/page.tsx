import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { ExpensePageClient } from '@/components/expenses/ExpensePageClient';
import type { ExpenseRow } from '@/components/expenses/ExpenseHistory';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const profile = await requireRole('student');
  const supabase = await createClient();

  const { data } = await supabase
    .from('expenses')
    .select(
      'id, amount_cents, merchant_text, occurred_at, source, status, category:categories(slug)',
    )
    .eq('student_id', profile.id)
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })
    .limit(30);

  const initial: ExpenseRow[] = (data ?? []).map((row) => ({
    id: row.id,
    amount_cents: row.amount_cents,
    merchant_text: row.merchant_text,
    occurred_at: row.occurred_at,
    source: row.source,
    status: row.status,
    category_slug:
      Array.isArray(row.category) ? (row.category[0]?.slug ?? null) : (row.category as { slug: string } | null)?.slug ?? null,
  }));

  return <ExpensePageClient initialHistory={initial} />;
}
