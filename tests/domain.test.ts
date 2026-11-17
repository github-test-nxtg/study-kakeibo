import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Transaction } from '../src/types';
import { createCategoryLookup } from '../src/domain/categories';
import { shiftMonth, isValidISODate } from '../src/domain/dates';
import { categoryBreakdown, monthlyTrend, searchTransactions, summarize } from '../src/domain/summary';
import { parseAmount, validateTransaction } from '../src/domain/validation';
import { createSampleTransactions } from '../src/data/sampleData';

const lookup = createCategoryLookup();
const t = (p: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(36), type: 'expense', date: '2026-11-03', categoryId: 'food', amount: 1000, memo: '',
  createdAt: '2026-11-03T00:00:00Z', updatedAt: '2026-11-03T00:00:00Z', ...p,
});

test('summarize: 月ごとの収入・支出・収支', () => {
  const items = [t({ type: 'income', categoryId: 'salary', amount: 300000 }), t({ amount: 1200 }), t({ amount: 800, date: '2026-10-31' })];
  assert.deepEqual(summarize(items, '2026-11'), { month: '2026-11', income: 300000, expense: 1200, balance: 298800, count: 2 });
});

test('shiftMonth: 年をまたぐ', () => {
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
});

test('monthlyTrend: 指定月を末尾に6か月', () => {
  const r = monthlyTrend([], '2026-03', 6);
  assert.deepEqual(r.map((m) => m.month), ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03']);
});

test('categoryBreakdown: 金額の大きい順・比率合計1', () => {
  const items = [t({ amount: 3000 }), t({ categoryId: 'transport', amount: 1000 }), t({ amount: 1000 })];
  const r = categoryBreakdown(items, '2026-11', 'expense', lookup);
  assert.equal(r[0].category.id, 'food');
  assert.equal(r[0].amount, 4000);
  assert.equal(r.reduce((s, x) => s + x.ratio, 0), 1);
});

test('searchTransactions: メモ・カテゴリ名・金額・全角・AND検索', () => {
  const items = [t({ memo: 'スーパー', amount: 1200 }), t({ categoryId: 'transport', memo: 'バス', amount: 230 })];
  assert.equal(searchTransactions(items, 'ｽｰﾊﾟｰ', lookup).length, 1);
  assert.equal(searchTransactions(items, '交通', lookup).length, 1);
  assert.equal(searchTransactions(items, '1,200', lookup).length, 1);
  assert.equal(searchTransactions(items, '食費 スーパー', lookup).length, 1);
  assert.equal(searchTransactions(items, '食費 バス', lookup).length, 0);
});

test('validation と parseAmount', () => {
  assert.equal(parseAmount('１，２００'), 1200);
  assert.equal(parseAmount('¥3,000円'), 3000);
  assert.ok(Number.isNaN(parseAmount('12.5')));
  assert.ok(!isValidISODate('2026-02-30'));
  const errs = validateTransaction({ type: 'expense', date: '2026-02-30', categoryId: '', amount: 0, memo: '' });
  assert.deepEqual(Object.keys(errs).sort(), ['amount', 'categoryId', 'date']);
});

test('サンプルデータ: 未来日付なし・すべて妥当', () => {
  const now = new Date(2026, 10, 16);
  const items = createSampleTransactions(4, now);
  assert.ok(items.length > 50);
  assert.ok(items.every((x) => x.date <= '2026-11-16'));
  assert.ok(items.every((x) => Object.keys(validateTransaction(x)).length === 0));
  assert.deepEqual(createSampleTransactions(4, now), items, '同じ日付なら同じデータになる');
});
