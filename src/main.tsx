import { createRoot } from 'react-dom/client';
import { App } from './App';
import { LocalStorageTransactionRepository } from './data/localStorageRepository';

/**
 * エントリーポイント。保存先の実装を決めるのはここだけ。
 * Electron 版では次のように差し替える:
 *   const repository = new IpcTransactionRepository(window.kakeiboApi);
 */
const repository = new LocalStorageTransactionRepository();

createRoot(document.getElementById('root')!).render(<App repository={repository} />);
