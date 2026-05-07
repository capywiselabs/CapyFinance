'use client';

import { motion } from 'framer-motion';

export function CoinBadge({ coins }: { coins: number }) {
  return (
    <motion.div
      key={coins}
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      className="inline-flex items-center gap-1 rounded-full bg-capy-100 px-3 py-1 text-sm font-bold text-capy-700"
    >
      <span aria-hidden>🪙</span>
      <span>{coins.toLocaleString()}</span>
    </motion.div>
  );
}
