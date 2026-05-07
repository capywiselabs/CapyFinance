import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentProfile, homeForRole } from '@/lib/auth/guards';
import { Button } from '@/components/ui/button';
import { Capy } from '@/components/capy/Capy';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const profile = await getCurrentProfile();
  if (profile) redirect(homeForRole(profile.role));

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-capy-50 px-6 py-12 text-center">
      <Capy size={200} />
      <h1 className="mt-6 text-3xl font-extrabold text-capy-700">悠學豚 CapyFinance</h1>
      <p className="mt-2 text-muted-foreground">邊玩邊學理財,陪小朋友養成記帳習慣</p>
      <div className="mt-8 flex w-full flex-col gap-3">
        <Button asChild size="xl">
          <Link href="/sign-in">登入</Link>
        </Button>
        <Button asChild size="xl" variant="outline">
          <Link href="/sign-up">註冊家長 / 老師</Link>
        </Button>
        <Button asChild size="xl" variant="ghost">
          <Link href="/kid-join">小朋友加入</Link>
        </Button>
      </div>
    </main>
  );
}
