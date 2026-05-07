import type { ReactNode } from 'react';
import { BottomNav } from '@/components/capy/BottomNav';
import { CoinBadge } from '@/components/capy/CoinBadge';
import { requireRole } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole('student');
  const supabase = await createClient();
  const { data: pet } = await supabase
    .from('pets')
    .select('coins')
    .eq('student_id', profile.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-capy-50">
      <header className="flex items-center justify-between p-4">
        <span className="text-lg font-bold text-capy-700">悠學豚</span>
        <CoinBadge coins={pet?.coins ?? 0} />
      </header>
      <main className="flex-1 px-4 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}
