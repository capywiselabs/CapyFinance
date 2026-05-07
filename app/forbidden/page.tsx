import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-capy-50 px-6 py-12 text-center">
      <h1 className="text-2xl font-extrabold text-capy-700">無權進入</h1>
      <p className="mt-2 text-muted-foreground">呢個頁面唔係你嘅角色可以睇。</p>
      <Link href="/" className="mt-6 underline">
        返主頁
      </Link>
    </main>
  );
}
