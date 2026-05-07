import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, locales, type Locale } from './routing';

const COOKIE_NAME = 'CAPY_LOCALE';

function pickLocale(value: string | undefined | null): Locale {
  if (!value) return defaultLocale;
  return (locales as readonly string[]).includes(value) ? (value as Locale) : defaultLocale;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(COOKIE_NAME)?.value;

  let locale: Locale;
  if (fromCookie) {
    locale = pickLocale(fromCookie);
  } else {
    const acceptLanguage = (await headers()).get('accept-language') ?? '';
    const preferred = acceptLanguage.split(',')[0]?.split(';')[0]?.trim() ?? defaultLocale;
    locale = pickLocale(preferred.toLowerCase().startsWith('en') ? 'en' : 'zh-HK');
  }

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: 'Asia/Hong_Kong',
    now: new Date(),
  };
});
