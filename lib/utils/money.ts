export function formatHKD(cents: number): string {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: 'HKD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function parseAmountToCents(value: string): number | null {
  const cleaned = value.replace(/[,\s]/g, '').replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
