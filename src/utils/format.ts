import type { MonthKey } from '../types';

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' });
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export const formatYen = (n: number) => yen.format(n);
export const formatNumber = (n: number) => n.toLocaleString('ja-JP');

export function formatSignedYen(n: number): string {
  if (n === 0) return formatYen(0);
  return `${n > 0 ? '+' : '−'}${formatYen(Math.abs(n))}`;
}

export function formatMonth(month: MonthKey): { year: string; month: string } {
  const [y, m] = month.split('-');
  return { year: y, month: String(Number(m)) };
}

export function formatDateLabel(date: string): { day: string; weekday: string; isWeekend: 'sat' | 'sun' | null } {
  const [y, m, d] = date.split('-').map(Number);
  const wd = new Date(y, m - 1, d).getDay();
  return {
    day: `${m}月${d}日`,
    weekday: WEEKDAYS[wd],
    isWeekend: wd === 0 ? 'sun' : wd === 6 ? 'sat' : null,
  };
}

/** 短縮表記（グラフの軸用）: 123,000 → 12.3万 */
export function formatCompactYen(n: number): string {
  if (Math.abs(n) >= 10_000) return `${(n / 10_000).toFixed(n % 10_000 === 0 ? 0 : 1)}万`;
  return formatNumber(n);
}
