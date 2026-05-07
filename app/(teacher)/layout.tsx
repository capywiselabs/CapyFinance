import type { ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { requireRole } from '@/lib/auth/guards';
import { SignOutButton } from '@/components/auth/SignOutButton';

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  await requireRole('teacher');
  return (
    <div className="grid min-h-screen grid-cols-[200px_1fr]">
      <aside className="border-r bg-card p-4">
        <div className="mb-4 text-lg font-bold text-capy-700">悠學豚 · 老師</div>
        <TeacherNav />
        <div className="mt-6"><SignOutButton /></div>
      </aside>
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}

function TeacherNav() {
  const t = useTranslations('nav');
  return (
    <nav className="flex flex-col gap-2 text-sm">
      <Link href="/classes">{t('classes')}</Link>
      <Link href="/curriculum">{t('curriculum')}</Link>
      <Link href="/teacher-reports">{t('reports')}</Link>
    </nav>
  );
}
