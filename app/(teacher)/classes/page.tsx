import { requireRole } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ClassesPage() {
  await requireRole('teacher');
  const supabase = await createClient();
  const { data } = await supabase.from('classes').select('id, name, grade, year').order('name');

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold">班級</h1>
      {(data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">仲未連結班級。</p>
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((c) => (
            <li key={c.id} className="rounded-2xl border bg-card p-4">
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-muted-foreground">
                Grade {c.grade ?? '—'} · {c.year ?? '—'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
