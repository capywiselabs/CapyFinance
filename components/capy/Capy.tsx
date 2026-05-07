'use client';

import { motion } from 'framer-motion';

export function Capy({ size = 160, mood = 'happy' }: { size?: number; mood?: 'happy' | 'sad' | 'sleepy' }) {
  const eyeOffsetY = mood === 'sad' ? 4 : mood === 'sleepy' ? 6 : 0;
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Capybara mascot"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ellipse cx="100" cy="160" rx="80" ry="14" fill="#0000001a" />
      <ellipse cx="100" cy="120" rx="78" ry="56" fill="#A05E20" />
      <ellipse cx="100" cy="80" rx="58" ry="50" fill="#A05E20" />
      <ellipse cx="100" cy="100" rx="42" ry="28" fill="#C8782A" />
      <circle cx="58" cy="60" r="12" fill="#7A461A" />
      <circle cx="142" cy="60" r="12" fill="#7A461A" />
      <circle cx={80} cy={70 + eyeOffsetY} r="6" fill="#1A0F08" />
      <circle cx={120} cy={70 + eyeOffsetY} r="6" fill="#1A0F08" />
      <circle cx={82} cy={68 + eyeOffsetY} r="2" fill="#fff" />
      <circle cx={122} cy={68 + eyeOffsetY} r="2" fill="#fff" />
      <ellipse cx="100" cy="92" rx="8" ry="5" fill="#552F12" />
      {mood === 'happy' ? (
        <path d="M85 105 Q100 118 115 105" stroke="#1A0F08" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : mood === 'sad' ? (
        <path d="M85 112 Q100 100 115 112" stroke="#1A0F08" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M88 108 L112 108" stroke="#1A0F08" strokeWidth="3" strokeLinecap="round" />
      )}
    </motion.svg>
  );
}
