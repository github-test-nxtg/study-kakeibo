import { useCallback, useEffect, useState } from 'react';
import type { Transaction, TransactionInput } from '../types';
import type { TransactionRepository } from '../data/repository';
import { createSampleTransactions } from '../data/sampleData';

type Status = 'loading' | 'ready' | 'error';

/**
 * 取引データの状態管理。
 * 「Repository に書き込む → 成功したら React の state を更新」の順で処理するので、
 * 保存に失敗した操作が画面にだけ反映される、ということが起きない。
 */
export function useTransactions(repository: TransactionRepository) {
  const [items, setItems] = useState<Transaction[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // 初回起動時のみサンプルデータを投入する
        if (!(await repository.isInitialized())) {
          await repository.replaceAll(createSampleTransactions());
        }
        const list = await repository.list();
        if (alive) {
          setItems(list);
          setStatus('ready');
        }
      } catch (e) {
        if (alive) {
          setError(toMessage(e));
          setStatus('error');
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [repository]);

  const run = useCallback(async <T,>(op: () => Promise<T>): Promise<T> => {
    try {
      setError(null);
      return await op();
    } catch (e) {
      setError(toMessage(e));
      throw e;
    }
  }, []);

  const add = useCallback(
    (input: TransactionInput) =>
      run(async () => {
        const created = await repository.create(input);
        setItems((prev) => [...prev, created]);
        return created;
      }),
    [repository, run],
  );

  const edit = useCallback(
    (id: string, input: TransactionInput) =>
      run(async () => {
        const updated = await repository.update(id, input);
        setItems((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return updated;
      }),
    [repository, run],
  );

  const remove = useCallback(
    (item: Transaction) =>
      run(async () => {
        await repository.remove(item.id);
        setItems((prev) => prev.filter((t) => t.id !== item.id));
        return item;
      }),
    [repository, run],
  );

  const restore = useCallback(
    (item: Transaction) =>
      run(async () => {
        await repository.restore(item);
        setItems((prev) => [...prev.filter((t) => t.id !== item.id), item]);
      }),
    [repository, run],
  );

  const resetWithSample = useCallback(
    () =>
      run(async () => {
        const sample = createSampleTransactions();
        await repository.replaceAll(sample);
        setItems(sample);
      }),
    [repository, run],
  );

  const clearAll = useCallback(
    () =>
      run(async () => {
        await repository.replaceAll([]);
        setItems([]);
      }),
    [repository, run],
  );

  return { items, status, error, dismissError: () => setError(null), add, edit, remove, restore, resetWithSample, clearAll };
}

function toMessage(e: unknown): string {
  return e instanceof Error ? e.message : '不明なエラーが発生しました';
}
