'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const t = useTranslations('auth');
  const router = useRouter();
  const supabase = createClient();
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push('/sign-in');
        router.refresh();
      }}
    >
      {t('signOut')}
    </Button>
  );
}
