'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import type { Nudge } from '@/lib/expenses/nudge';

export function NudgeBanner({ nudge }: { nudge: Nudge | null }) {
  const tNudge = useTranslations('nudge');
  const tCategory = useTranslations('category');

  if (!nudge) return null;

  let text = '';
  let tone: 'celebrate' | 'warning' = 'celebrate';
  switch (nudge.kind) {
    case 'budget_warning':
      tone = 'warning';
      text = tNudge('budgetWarning', {
        category: tCategory(nudge.categorySlug as never),
        percent: nudge.percentUsed,
      });
      break;
    case 'streak_celebration':
      text = tNudge('streak', { days: nudge.days });
      break;
    case 'first_log_today':
      text = tNudge('firstLogToday');
      break;
    case 'coin_earned':
      text = tNudge('coinEarned', { coins: nudge.coins });
      break;
  }

  return (
    <AnimatePresence>
      <motion.div
        key={text}
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ opacity: 0 }}
        className={
          'rounded-2xl px-4 py-3 text-sm font-medium ' +
          (tone === 'warning'
            ? 'bg-amber-100 text-amber-900'
            : 'bg-emerald-100 text-emerald-900')
        }
      >
        {text}
      </motion.div>
    </AnimatePresence>
  );
}
