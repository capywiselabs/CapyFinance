'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

type Role = 'parent' | 'teacher';

export default function SignUpPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [role, setRole] = useState<Role>('parent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, display_name: name } },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        role,
        display_name: name,
        locale: 'zh-HK',
      });
    }
    router.push('/');
    router.refresh();
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <h2 className="text-center text-xl font-bold">{t('signUp')}</h2>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={role === 'parent' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setRole('parent')}
        >
          {t('asParent')}
        </Button>
        <Button
          type="button"
          variant={role === 'teacher' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setRole('teacher')}
        >
          {t('asTeacher')}
        </Button>
      </div>
      <Input
        placeholder={t('displayName')}
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
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
        autoComplete="new-password"
        placeholder={t('password')}
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {t('create')}
      </Button>
    </form>
  );
}
