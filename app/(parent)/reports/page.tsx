import { requireRole } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  await requireRole('parent');
  const supabase = await createClient();
  const { data } = await supabase
    .from('reports')
    .select('id, period, period_start, period_end, summary_md')
    .order('generated_at', { ascending: false })
    .limit(20);

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold">理財報告</h1>
      {(data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">仲未有報告,要等下星期。</p>
      ) : (
        <ul className="space-y-3">
          {(data ?? []).map((r) => (
            <li key={r.id} className="rounded-2xl border bg-card p-4">
              <div className="text-sm text-muted-foreground">
                {r.period_start} – {r.period_end}
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-sm">{r.summary_md ?? '—'}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
