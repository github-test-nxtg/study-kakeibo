/**
 * ドメイン型定義。UI・保存先のどちらにも依存しない。
 * SQLite のテーブル定義はこの型と1対1で対応させる（docs/schema.sql 参照）。
 */
export type TransactionType = 'income' | 'expense';

/** 'YYYY-MM-DD' 形式の日付文字列（タイムゾーンのずれを避けるため Date 型は保存しない） */
export type ISODate = string;
/** 'YYYY-MM' 形式の月キー */
export type MonthKey = string;

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: ISODate;
  categoryId: string;
  /** 円単位の整数。小数は扱わない */
  amount: number;
  memo: string;
  createdAt: string;
  updatedAt: string;
}

/** 登録・編集フォームから渡される入力値 */
export type TransactionInput = Pick<Transaction, 'type' | 'date' | 'categoryId' | 'amount' | 'memo'>;

export interface MonthlySummary {
  month: MonthKey;
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export interface CategoryTotal {
  category: Category;
  amount: number;
  ratio: number;
}

export type ThemeMode = 'system' | 'light' | 'dark';
