import { requireRole } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { CreateChildForm } from '@/components/forms/CreateChildForm';

export const dynamic = 'force-dynamic';

export default async function FamilyPage() {
  await requireRole('parent');
  const supabase = await createClient();

  const { data: families } = await supabase
    .from('family_members')
    .select('family_id, families!inner(name, family_code)')
    .eq('relation', 'parent');

  type Fam = { name: string | null; family_code: string };
  const myFamily = (families ?? [])
    .map((row) => {
      const f = row.families as unknown as Fam | Fam[] | null;
      return Array.isArray(f) ? f[0] : f;
    })
    .find((f): f is Fam => !!f);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">家庭</h1>
      <div className="rounded-2xl border bg-card p-4">
        <div className="text-sm text-muted-foreground">家庭代碼</div>
        <div className="font-mono text-2xl font-bold tracking-widest">
          {myFamily?.family_code ?? '—'}
        </div>
        <div className="text-xs text-muted-foreground">
          交畀小朋友喺登入頁輸入呢個代碼 + 暱稱 + 4 位 PIN。
        </div>
      </div>
      <CreateChildForm />
    </div>
  );
}
