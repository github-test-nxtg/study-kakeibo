import type { Transaction, TransactionInput } from '../types';

/**
 * 保存先を抽象化するインターフェース。
 * UI は必ずこのインターフェース経由でデータを読み書きする。
 *
 * 現在の実装: LocalStorageTransactionRepository（ブラウザ / Artifacts 用）
 * 移行先:     IpcTransactionRepository（Electron レンダラー → preload → main → SQLite）
 *
 * すべて Promise を返すのは、IPC や SQLite が非同期になるため。
 * 今のうちから非同期で書いておけば、UI 側のコードは移行時に変更不要。
 */
export interface TransactionRepository {
  /** 保存先が一度でも初期化されたか（初回起動時にサンプルデータを入れるかの判定用） */
  isInitialized(): Promise<boolean>;
  list(): Promise<Transaction[]>;
  create(input: TransactionInput): Promise<Transaction>;
  update(id: string, input: TransactionInput): Promise<Transaction>;
  remove(id: string): Promise<void>;
  /** 削除の取り消しなど、id や作成日時を保ったまま戻すときに使う */
  restore(item: Transaction): Promise<void>;
  /** サンプルデータ投入・インポート用。既存データはすべて置き換える */
  replaceAll(items: Transaction[]): Promise<void>;
}

export class RepositoryError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'RepositoryError';
  }
}
