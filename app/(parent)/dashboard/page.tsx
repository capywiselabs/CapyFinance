import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatHKD } from '@/lib/utils/money';

export const dynamic = 'force-dynamic';

export default async function ParentDashboard() {
  const profile = await requireRole('parent');
  const supabase = await createClient();

  const { data: kids } = await supabase
    .from('family_members')
    .select('profile_id, profiles!inner(id, display_name, role)')
    .eq('relation', 'child');

  type ProfileRow = { id: string; display_name: string; role: string };
  const kidProfiles = (kids ?? [])
    .map((m) => {
      const p = m.profiles as unknown as ProfileRow | ProfileRow[] | null;
      return Array.isArray(p) ? p[0] : p;
    })
    .filter((p): p is ProfileRow => !!p && p.role === 'student');

  const ids = kidProfiles.map((k) => k.id);
  const { data: weekExpenses } = ids.length
    ? await supabase
        .from('expenses')
        .select('student_id, amount_cents, occurred_at')
        .in('student_id', ids)
        .gte(
          'occurred_at',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        )
        .is('deleted_at', null)
    : { data: [] as { student_id: string; amount_cents: number; occurred_at: string }[] };

  const totals = new Map<string, number>();
  for (const row of weekExpenses ?? []) {
    totals.set(row.student_id, (totals.get(row.student_id) ?? 0) + row.amount_cents);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">家長 · {profile.display_name}</h1>
      {kidProfiles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          仲未加入小朋友。去「家庭」頁面加入。
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {kidProfiles.map((kid) => (
            <Card key={kid.id}>
              <CardHeader>
                <CardTitle>{kid.display_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">本週開支</div>
                <div className="text-2xl font-extrabold text-capy-700">
                  {formatHKD(totals.get(kid.id) ?? 0)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
