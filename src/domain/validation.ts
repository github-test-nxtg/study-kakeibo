import type { TransactionInput } from '../types';
import { isValidISODate } from './dates';

export const MAX_AMOUNT = 999_999_999;
export const MAX_MEMO_LENGTH = 200;

export type ValidationErrors = Partial<Record<keyof TransactionInput, string>>;

/** フォーム・Repository の両方で使う入力チェック（Electron 移行後はメインプロセス側でも同じ関数を使う） */
export function validateTransaction(input: TransactionInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (input.type !== 'income' && input.type !== 'expense') errors.type = '種類を選んでください';
  if (!isValidISODate(input.date)) errors.date = '日付を正しく入力してください';
  if (!input.categoryId) errors.categoryId = 'カテゴリを選んでください';
  if (!Number.isInteger(input.amount) || input.amount <= 0) errors.amount = '1円以上の整数で入力してください';
  else if (input.amount > MAX_AMOUNT) errors.amount = '金額が大きすぎます';
  if (input.memo.length > MAX_MEMO_LENGTH) errors.memo = `メモは${MAX_MEMO_LENGTH}文字以内にしてください`;
  return errors;
}

/** "1,200" "１２００" "¥1200" などを整数に変換する。変換できなければ NaN */
export function parseAmount(raw: string): number {
  const cleaned = raw.normalize('NFKC').replace(/[,¥円\s]/g, '');
  if (!/^\d+$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}
