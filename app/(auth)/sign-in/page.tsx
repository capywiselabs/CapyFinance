'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <h2 className="text-center text-xl font-bold">{t('signIn')}</h2>
      <Input
        type="email"
        autoComplete="email"
        placeholder={t('email')}
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        autoComplete="current-password"
        placeholder={t('password')}
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {t('signIn')}
      </Button>
      <div className="flex justify-between text-sm">
        <Link href="/sign-up" className="text-capy-700 underline">
          {t('signUp')}
        </Link>
        <Link href="/kid-join" className="text-capy-700 underline">
          {t('kidJoin')}
        </Link>
      </div>
    </form>
  );
}
