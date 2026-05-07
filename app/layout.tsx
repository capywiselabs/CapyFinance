import type { Metadata, Viewport } from 'next';
import { Noto_Sans_HK } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Providers } from '@/components/providers';
import './globals.css';

const noto = Noto_Sans_HK({
  subsets: ['latin'],
  variable: '--font-noto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '悠學豚 CapyFinance',
  description: 'A gamified financial-literacy PWA for HK primary students',
  applicationName: 'CapyFinance',
  appleWebApp: {
    capable: true,
    title: 'CapyFinance',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#F4B860',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={noto.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
