import type { Category, CategoryTotal, MonthKey, MonthlySummary, Transaction, TransactionType } from '../types';
import { shiftMonth, toMonthKey } from './dates';

/**
 * 集計ロジックはすべて純粋関数。React にも保存先にも依存しないので、
 * 単体テストしやすく、将来 SQLite の集計 SQL に置き換える場合も比較検証に使える。
 */

export function filterByMonth(items: readonly Transaction[], month: MonthKey): Transaction[] {
  return items.filter((t) => toMonthKey(t.date) === month);
}

export function summarize(items: readonly Transaction[], month: MonthKey): MonthlySummary {
  let income = 0;
  let expense = 0;
  let count = 0;
  for (const t of items) {
    if (toMonthKey(t.date) !== month) continue;
    count++;
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { month, income, expense, balance: income - expense, count };
}

export function monthlyTrend(items: readonly Transaction[], endMonth: MonthKey, months = 6): MonthlySummary[] {
  return Array.from({ length: months }, (_, i) => summarize(items, shiftMonth(endMonth, i - (months - 1))));
}

export function categoryBreakdown(
  items: readonly Transaction[],
  month: MonthKey,
  type: TransactionType,
  lookup: (id: string) => Category,
): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const t of items) {
    if (t.type !== type || toMonthKey(t.date) !== month) continue;
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals.entries()]
    .map(([id, amount]) => ({ category: lookup(id), amount, ratio: sum ? amount / sum : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

/** 全角・半角、大文字・小文字の違いを吸収して比較する */
export function normalizeText(s: string): string {
  return s.normalize('NFKC').toLowerCase().trim();
}

/**
 * キーワード検索。スペース区切りで AND 検索。
 * メモ・カテゴリ名・金額（"1200" や "1,200"）・日付にマッチする。
 */
export function searchTransactions(
  items: readonly Transaction[],
  keyword: string,
  lookup: (id: string) => Category,
): Transaction[] {
  const terms = normalizeText(keyword).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [...items];
  return items.filter((t) => {
    const haystack = normalizeText(
      [t.memo, lookup(t.categoryId).name, String(t.amount), t.amount.toLocaleString('ja-JP'), t.date].join(' '),
    );
    return terms.every((term) => haystack.includes(term));
  });
}

/** 日付の新しい順、同日なら登録の新しい順 */
export function sortByDateDesc(items: readonly Transaction[]): Transaction[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function groupByDate(items: readonly Transaction[]): Array<{ date: string; items: Transaction[] }> {
  const groups: Array<{ date: string; items: Transaction[] }> = [];
  for (const t of items) {
    const last = groups[groups.length - 1];
    if (last && last.date === t.date) last.items.push(t);
    else groups.push({ date: t.date, items: [t] });
  }
  return groups;
}
