import type { Category, TransactionType } from '../types';

/**
 * 初期カテゴリ。今は定数だが、将来カテゴリ編集機能を入れるときは
 * CategoryRepository を作って SQLite の categories テーブルに移す。
 */
export const DEFAULT_CATEGORIES: readonly Category[] = [
  { id: 'food', name: '食費', type: 'expense', color: '#D9822B', icon: '🍚' },
  { id: 'daily', name: '日用品', type: 'expense', color: '#B8A03A', icon: '🧻' },
  { id: 'housing', name: '住居', type: 'expense', color: '#4C5FA8', icon: '🏠' },
  { id: 'utility', name: '水道光熱', type: 'expense', color: '#2E8FA3', icon: '💡' },
  { id: 'telecom', name: '通信', type: 'expense', color: '#7A5BB0', icon: '📱' },
  { id: 'transport', name: '交通', type: 'expense', color: '#3A7BC8', icon: '🚃' },
  { id: 'leisure', name: '趣味・娯楽', type: 'expense', color: '#C2577F', icon: '🎬' },
  { id: 'medical', name: '医療', type: 'expense', color: '#B84A4A', icon: '🏥' },
  { id: 'clothing', name: '衣服', type: 'expense', color: '#3C9A86', icon: '👕' },
  { id: 'other-expense', name: 'その他', type: 'expense', color: '#8A94A3', icon: '📦' },
  { id: 'salary', name: '給与', type: 'income', color: '#2F8A5F', icon: '💼' },
  { id: 'bonus', name: '賞与', type: 'income', color: '#5AA469', icon: '🎁' },
  { id: 'side-job', name: '副業', type: 'income', color: '#3D9C8F', icon: '💻' },
  { id: 'other-income', name: 'その他収入', type: 'income', color: '#7FA05A', icon: '🪙' },
];

const UNKNOWN: Category = { id: 'unknown', name: '未分類', type: 'expense', color: '#8A94A3', icon: '❔' };

export function categoriesOf(type: TransactionType, list: readonly Category[] = DEFAULT_CATEGORIES): Category[] {
  return list.filter((c) => c.type === type);
}

export function createCategoryLookup(list: readonly Category[] = DEFAULT_CATEGORIES) {
  const map = new Map(list.map((c) => [c.id, c]));
  return (id: string): Category => map.get(id) ?? UNKNOWN;
}
