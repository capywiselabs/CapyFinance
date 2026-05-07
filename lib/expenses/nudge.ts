import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export type Nudge =
  | { kind: 'budget_warning'; categorySlug: string; percentUsed: number }
  | { kind: 'streak_celebration'; days: number }
  | { kind: 'first_log_today' }
  | { kind: 'coin_earned'; coins: number }
  | null;

export async function buildNudgeForExpense(
  client: SupabaseClient<Database>,
  args: {
    studentId: string;
    categoryId: string | null;
    coinsEarned: number;
  },
): Promise<Nudge> {
  if (args.categoryId) {
    const { data: budget } = await client
      .from('budgets')
      .select('id, period, limit_cents, category_id')
      .eq('student_id', args.studentId)
      .eq('category_id', args.categoryId)
      .eq('active', true)
      .limit(1)
      .maybeSingle();

    if (budget) {
      const periodStart = startOfPeriod(budget.period as 'weekly' | 'monthly');
      const { data: agg } = await client
        .from('expenses')
        .select('amount_cents')
        .eq('student_id', args.studentId)
        .eq('category_id', args.categoryId)
        .eq('status', 'confirmed')
        .gte('occurred_at', periodStart.toISOString())
        .is('deleted_at', null);

      const total = (agg ?? []).reduce((sum, row) => sum + row.amount_cents, 0);
      const percent = Math.round((total / budget.limit_cents) * 100);
      if (percent >= 80) {
        const { data: cat } = await client
          .from('categories')
          .select('slug')
          .eq('id', args.categoryId)
          .maybeSingle();
        return {
          kind: 'budget_warning',
          categorySlug: cat?.slug ?? 'other',
          percentUsed: percent,
        };
      }
    }
  }

  // streak: count distinct days with logs in the past 7 days (incl today)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const { data: recent } = await client
    .from('expenses')
    .select('occurred_at')
    .eq('student_id', args.studentId)
    .eq('status', 'confirmed')
    .gte('occurred_at', sevenDaysAgo.toISOString())
    .is('deleted_at', null);

  const days = new Set<string>(
    (recent ?? []).map((row) => new Date(row.occurred_at).toDateString()),
  );

  if (days.size >= 3) {
    return { kind: 'streak_celebration', days: days.size };
  }

  if (args.coinsEarned > 0) {
    return { kind: 'coin_earned', coins: args.coinsEarned };
  }

  return { kind: 'first_log_today' };
}

function startOfPeriod(period: 'weekly' | 'monthly'): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === 'weekly') {
    const day = d.getDay(); // 0 = Sun
    const diff = (day + 6) % 7; // make Mon the start
    d.setDate(d.getDate() - diff);
  } else {
    d.setDate(1);
  }
  return d;
}
