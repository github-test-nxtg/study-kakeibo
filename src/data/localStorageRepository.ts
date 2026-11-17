import type { Transaction, TransactionInput } from '../types';
import { validateTransaction } from '../domain/validation';
import { createId } from '../utils/id';
import { RepositoryError, type TransactionRepository } from './repository';

const STORAGE_KEY = 'kakeibo:transactions';
const SCHEMA_VERSION = 1;

interface StoredPayload {
  version: number;
  items: Transaction[];
}

/** localStorage が使えない環境（プライベートモード等）ではメモリ上に保持する */
function createStorage() {
  let memory: string | null = null;
  let persistent = true;
  try {
    const probe = '__kakeibo_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
  } catch {
    persistent = false;
  }
  return {
    persistent,
    read(): string | null {
      if (!persistent) return memory;
      try {
        return window.localStorage.getItem(STORAGE_KEY);
      } catch {
        return memory;
      }
    },
    write(value: string) {
      memory = value;
      if (!persistent) return;
      try {
        window.localStorage.setItem(STORAGE_KEY, value);
      } catch (e) {
        throw new RepositoryError('ブラウザの保存領域に書き込めませんでした。容量を確認してください。', e);
      }
    },
  };
}

/**
 * localStorage に JSON で保存する Repository。
 * SQLite 版と同じ振る舞い（バリデーション、updatedAt 更新、存在しない id はエラー）にしてある。
 */
export class LocalStorageTransactionRepository implements TransactionRepository {
  private readonly storage = createStorage();

  get isPersistent(): boolean {
    return this.storage.persistent;
  }

  private load(): Transaction[] {
    const raw = this.storage.read();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as StoredPayload;
      // 将来スキーマを変えたときはここでマイグレーションする
      if (parsed.version !== SCHEMA_VERSION || !Array.isArray(parsed.items)) return [];
      return parsed.items;
    } catch {
      return [];
    }
  }

  private save(items: Transaction[]) {
    const payload: StoredPayload = { version: SCHEMA_VERSION, items };
    this.storage.write(JSON.stringify(payload));
  }

  async isInitialized() {
    return this.storage.read() !== null;
  }

  async list() {
    return this.load();
  }

  async create(input: TransactionInput) {
    assertValid(input);
    const now = new Date().toISOString();
    const item: Transaction = { ...input, memo: input.memo.trim(), id: createId(), createdAt: now, updatedAt: now };
    this.save([...this.load(), item]);
    return item;
  }

  async update(id: string, input: TransactionInput) {
    assertValid(input);
    const items = this.load();
    const index = items.findIndex((t) => t.id === id);
    if (index < 0) throw new RepositoryError('対象のデータが見つかりません');
    const updated: Transaction = { ...items[index], ...input, memo: input.memo.trim(), updatedAt: new Date().toISOString() };
    items[index] = updated;
    this.save(items);
    return updated;
  }

  async remove(id: string) {
    this.save(this.load().filter((t) => t.id !== id));
  }

  async restore(item: Transaction) {
    this.save([...this.load().filter((t) => t.id !== item.id), item]);
  }

  async replaceAll(items: Transaction[]) {
    this.save(items);
  }
}

function assertValid(input: TransactionInput) {
  const errors = validateTransaction(input);
  const first = Object.values(errors)[0];
  if (first) throw new RepositoryError(first);
}
