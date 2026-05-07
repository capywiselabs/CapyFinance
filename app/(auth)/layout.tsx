import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-capy-50 px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-capy-300" aria-hidden />
        <h1 className="mt-4 text-2xl font-extrabold text-capy-700">悠學豚 CapyFinance</h1>
        <p className="text-sm text-muted-foreground">邊玩邊學理財</p>
      </div>
      {children}
    </div>
  );
}
