import type { ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { requireRole } from '@/lib/auth/guards';
import { SignOutButton } from '@/components/auth/SignOutButton';

export default async function ParentLayout({ children }: { children: ReactNode }) {
  await requireRole('parent');
  return (
    <div className="mx-auto max-w-4xl bg-background min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="text-lg font-bold text-capy-700">悠學豚 · 家長</span>
        <ParentNav />
      </header>
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}

function ParentNav() {
  const t = useTranslations('nav');
  return (
    <nav className="flex gap-4 text-sm">
      <Link href="/dashboard">{t('dashboard')}</Link>
      <Link href="/approvals">{t('approvals')}</Link>
      <Link href="/reports">{t('reports')}</Link>
      <Link href="/family">{t('family')}</Link>
      <div className="ml-2"><SignOutButton /></div>
    </nav>
  );
}
