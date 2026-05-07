'use client';

import { useTranslations } from 'next-intl';
import { formatHKD } from '@/lib/utils/money';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-hk';
import type { ExpenseSource, ExpenseStatus } from '@/lib/supabase/types';

export type ExpenseRow = {
  id: string;
  amount_cents: number;
  merchant_text: string | null;
  category_slug: string | null;
  occurred_at: string;
  source: ExpenseSource;
  status: ExpenseStatus;
};

dayjs.locale('zh-hk');

export function ExpenseHistory({ expenses }: { expenses: ExpenseRow[] }) {
  const t = useTranslations('expense');
  const tCategory = useTranslations('category');

  if (expenses.length === 0) {
    return <p className="text-sm text-muted-foreground">尚未記帳</p>;
  }

  return (
    <ul className="space-y-2">
      {expenses.map((e) => (
        <li
          key={e.id}
          className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm"
        >
          <div className="min-w-0">
            <div className="truncate font-semibold">{e.merchant_text ?? '—'}</div>
            <div className="text-xs text-muted-foreground">
              {e.category_slug ? tCategory(e.category_slug as never) : t('category')}
              {' · '}
              {dayjs(e.occurred_at).format('MM/DD HH:mm')}
              {e.status === 'pending_review' && ' · 待確認'}
            </div>
          </div>
          <div className="ml-3 text-right font-bold">{formatHKD(e.amount_cents)}</div>
        </li>
      ))}
    </ul>
  );
}
