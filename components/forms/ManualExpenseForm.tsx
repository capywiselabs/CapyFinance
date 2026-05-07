'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseAmountToCents } from '@/lib/utils/money';

const Schema = z.object({
  amount: z.string().min(1),
  merchantText: z.string().min(1),
  notes: z.string().optional(),
});

type Values = z.infer<typeof Schema>;

export function ManualExpenseForm({ onLogged }: { onLogged: (result: unknown) => void }) {
  const t = useTranslations('expense');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { amount: '', merchantText: '', notes: '' },
  });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    setError(null);
    const amountCents = parseAmountToCents(values.amount);
    if (!amountCents) {
      setError('amount');
      setSubmitting(false);
      return;
    }
    try {
      const res = await fetch('/api/expenses/manual', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amountCents,
          merchantText: values.merchantText.trim(),
          notes: values.notes?.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      form.reset();
      onLogged(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
      <label className="block text-sm font-medium" htmlFor="merchant">
        {t('merchant')}
      </label>
      <Input
        id="merchant"
        placeholder="ParknShop / 7仔 / MTR …"
        {...form.register('merchantText')}
      />
      <label className="block text-sm font-medium" htmlFor="amount">
        {t('amount')} (HKD)
      </label>
      <Input
        id="amount"
        inputMode="decimal"
        placeholder="例如 28.50"
        {...form.register('amount')}
      />
      <label className="block text-sm font-medium" htmlFor="notes">
        {t('notes')}
      </label>
      <Input id="notes" placeholder={t('notes')} {...form.register('notes')} />
      {error && (
        <p className="text-sm text-destructive">
          {error === 'amount' ? '金額格式唔啱' : error}
        </p>
      )}
      <Button type="submit" size="xl" className="w-full" disabled={submitting}>
        {submitting ? t('saving') : t('save')}
      </Button>
    </form>
  );
}
