'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SnapExpenseForm } from '@/components/forms/SnapExpenseForm';
import { VoiceExpenseForm } from '@/components/forms/VoiceExpenseForm';
import { ManualExpenseForm } from '@/components/forms/ManualExpenseForm';
import { NudgeBanner } from '@/components/capy/NudgeBanner';
import { ExpenseHistory, type ExpenseRow } from './ExpenseHistory';
import type { Nudge } from '@/lib/expenses/nudge';

type Mode = 'menu' | 'snap' | 'voice' | 'manual';

type Result = {
  expenseId: string;
  status: 'pending_review' | 'confirmed';
  amountCents: number;
  categorySlug: string | null;
  merchantText: string;
  coinsEarned: number;
  nudge: Nudge;
};

export function ExpensePageClient({ initialHistory }: { initialHistory: ExpenseRow[] }) {
  const t = useTranslations('expense');
  const [mode, setMode] = useState<Mode>('menu');
  const [history, setHistory] = useState<ExpenseRow[]>(initialHistory);
  const [lastNudge, setLastNudge] = useState<Nudge | null>(null);

  function onLogged(json: unknown) {
    const r = json as Result;
    setHistory((prev) => [
      {
        id: r.expenseId,
        amount_cents: r.amountCents,
        merchant_text: r.merchantText,
        category_slug: r.categorySlug,
        occurred_at: new Date().toISOString(),
        source: 'manual',
        status: r.status,
      },
      ...prev,
    ]);
    setLastNudge(r.nudge ?? { kind: 'coin_earned', coins: r.coinsEarned });
    setMode('menu');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-capy-700">{t('title')}</h1>

      {lastNudge && <NudgeBanner nudge={lastNudge} />}

      <div className="grid grid-cols-1 gap-3">
        {mode === 'menu' && (
          <>
            <Button size="xl" onClick={() => setMode('snap')}>
              {t('snap')}
            </Button>
            <Button size="xl" variant="secondary" onClick={() => setMode('voice')}>
              {t('voice')}
            </Button>
            <Button size="xl" variant="outline" onClick={() => setMode('manual')}>
              {t('manual')}
            </Button>
          </>
        )}
        {mode === 'snap' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('snap')}</CardTitle>
            </CardHeader>
            <CardContent>
              <SnapExpenseForm onLogged={onLogged} />
              <Button variant="ghost" className="mt-2 w-full" onClick={() => setMode('menu')}>
                返去
              </Button>
            </CardContent>
          </Card>
        )}
        {mode === 'voice' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('voice')}</CardTitle>
            </CardHeader>
            <CardContent>
              <VoiceExpenseForm onLogged={onLogged} />
              <Button variant="ghost" className="mt-2 w-full" onClick={() => setMode('menu')}>
                返去
              </Button>
            </CardContent>
          </Card>
        )}
        {mode === 'manual' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('manual')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ManualExpenseForm onLogged={onLogged} />
              <Button variant="ghost" className="mt-2 w-full" onClick={() => setMode('menu')}>
                返去
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {t('history')}
        </h2>
        <ExpenseHistory expenses={history} />
      </section>
    </div>
  );
}
