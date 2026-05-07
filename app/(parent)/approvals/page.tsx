import { requireRole } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  await requireRole('parent');
  const supabase = await createClient();
  const { data } = await supabase
    .from('task_completions')
    .select('id, submitted_at, notes, evidence_url, tasks!inner(title, reward_coins), student:profiles!task_completions_student_id_fkey(display_name)')
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false });

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold">待批核任務</h1>
      {(data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">沒有待處理嘅項目。</p>
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((row) => (
            <li key={row.id} className="rounded-2xl border bg-card p-4">
              <div className="font-semibold">
                {(Array.isArray(row.student) ? row.student[0] : row.student)?.display_name ?? '—'} ·{' '}
                {(Array.isArray(row.tasks) ? row.tasks[0] : row.tasks)?.title ?? '—'}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(row.submitted_at).toLocaleString('zh-HK')} ·{' '}
                +{(Array.isArray(row.tasks) ? row.tasks[0] : row.tasks)?.reward_coins ?? 0}🪙
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
