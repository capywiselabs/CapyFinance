'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Camera, Home, ListChecks, ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const items = [
  { href: '/pet', icon: Home, key: 'pet' as const },
  { href: '/tasks', icon: ListChecks, key: 'tasks' as const },
  { href: '/expenses', icon: Camera, key: 'snap' as const },
  { href: '/shop', icon: ShoppingBag, key: 'shop' as const },
  { href: '/me', icon: User, key: 'me' as const },
];

export function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-center justify-around p-2">
        {items.map(({ href, icon: Icon, key }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'tap-target flex flex-col items-center justify-center gap-1 rounded-2xl px-3 text-xs font-medium',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className={cn('h-6 w-6', active && 'text-primary')} aria-hidden />
                <span>{t(key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
