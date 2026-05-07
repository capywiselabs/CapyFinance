import { describe, it, expect } from 'vitest';
import { normalizeMerchantName } from '../../lib/openai/merchantKb';

describe('normalizeMerchantName', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalizeMerchantName('PARKnSHOP!')).toBe('parknshop');
  });
  it('preserves CJK', () => {
    expect(normalizeMerchantName('百佳超級市場')).toBe('百佳超級市場');
  });
  it('collapses whitespace', () => {
    expect(normalizeMerchantName('  7  Eleven  ')).toBe('7 eleven');
  });
});

import { parseAmountToCents, formatHKD } from '../../lib/utils/money';

describe('parseAmountToCents', () => {
  it('parses plain number', () => expect(parseAmountToCents('28.5')).toBe(2850));
  it('strips currency symbols', () => expect(parseAmountToCents('HK$ 1,250.00')).toBe(125000));
  it('strips minus sign', () => expect(parseAmountToCents('-5')).toBe(500));
  it('rejects empty', () => expect(parseAmountToCents('')).toBeNull());
});

describe('formatHKD', () => {
  it('formats cents to HKD', () => {
    expect(formatHKD(8750)).toContain('87.50');
  });
});
