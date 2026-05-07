'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function KidJoinPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [familyCode, setFamilyCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/auth/kid-join', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ familyCode, displayName, pin }),
    });
    if (!res.ok) {
      setError(await res.text());
      setBusy(false);
      return;
    }
    router.push('/expenses');
    router.refresh();
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <h2 className="text-center text-xl font-bold">{t('kidJoin')}</h2>
      <Input
        placeholder={t('familyCode')}
        required
        value={familyCode}
        onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
      />
      <Input
        placeholder={t('displayName')}
        required
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <Input
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        placeholder={t('pin')}
        required
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {t('join')}
      </Button>
    </form>
  );
}
