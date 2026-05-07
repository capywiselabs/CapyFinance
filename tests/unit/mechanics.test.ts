import { describe, it, expect } from 'vitest';
import { applyDecay, clamp, xpForLevel } from '../../lib/pet/mechanics';

describe('clamp', () => {
  it('clamps below min', () => {
    expect(clamp(-5)).toBe(0);
  });
  it('clamps above max', () => {
    expect(clamp(150)).toBe(100);
  });
  it('passes value within range', () => {
    expect(clamp(42)).toBe(42);
  });
});

describe('xpForLevel', () => {
  it('returns 0 for level 1', () => {
    expect(xpForLevel(1)).toBe(0);
  });
  it('grows monotonically', () => {
    expect(xpForLevel(2)).toBeGreaterThan(xpForLevel(1));
    expect(xpForLevel(5)).toBeGreaterThan(xpForLevel(4));
  });
});

describe('applyDecay', () => {
  it('returns identity for zero hours', () => {
    const s = { hp: 80, happiness: 80, hunger: 50 };
    expect(applyDecay(s, 0)).toEqual(s);
  });
  it('decays hp & happiness, increases hunger', () => {
    const next = applyDecay({ hp: 80, happiness: 80, hunger: 50 }, 5);
    expect(next.hp).toBe(75);
    expect(next.happiness).toBe(70);
    expect(next.hunger).toBe(65);
  });
  it('clamps to bounds', () => {
    const next = applyDecay({ hp: 1, happiness: 1, hunger: 99 }, 10);
    expect(next.hp).toBe(0);
    expect(next.happiness).toBe(0);
    expect(next.hunger).toBe(100);
  });
});
