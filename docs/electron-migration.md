# Electron + SQLite への移行メモ

> ここにあるコードは設計の方向性を示すスケッチで、まだ動作確認していません。

## 方針

レンダラー（React）は今のコードをほぼそのまま使い、保存先だけを差し替える。

```
React (renderer)
  └─ TransactionRepository インターフェース
       ├─ LocalStorageTransactionRepository  ← 今（Artifacts / ブラウザ）
       └─ IpcTransactionRepository           ← 移行後
              │ window.kakeiboApi（preload で contextBridge 公開）
              ▼
          main process ── better-sqlite3 ── kakeibo.db（%APPDATA%\kakeibo\）
```

## 変更が必要なファイル

| ファイル | 変更内容 |
|---|---|
| `src/main.tsx` | `new LocalStorageTransactionRepository()` → `new IpcTransactionRepository(window.kakeiboApi)` |
| `src/data/ipcRepository.ts` | 新規。`TransactionRepository` を IPC 呼び出しで実装 |
| `electron/main.ts` | 新規。BrowserWindow 作成、`ipcMain.handle` 登録、DB 初期化 |
| `electron/preload.ts` | 新規。`contextBridge.exposeInMainWorld('kakeiboApi', …)` |
| `electron/db.ts` | 新規。better-sqlite3 で `docs/schema.sql` を実行し CRUD を提供 |
| `src/hooks/useTheme.ts` | `nativeTheme.themeSource` と同期（任意） |
| `build.mjs` | electron-vite などに置き換え |
| `index.template.html` | Google Fonts を同梱フォントに変更し、CSP を設定 |

## スケッチ

```ts
// electron/preload.ts
contextBridge.exposeInMainWorld('kakeiboApi', {
  list: () => ipcRenderer.invoke('tx:list'),
  create: (input) => ipcRenderer.invoke('tx:create', input),
  update: (id, input) => ipcRenderer.invoke('tx:update', id, input),
  remove: (id) => ipcRenderer.invoke('tx:remove', id),
  restore: (item) => ipcRenderer.invoke('tx:restore', item),
  replaceAll: (items) => ipcRenderer.invoke('tx:replaceAll', items),
  isInitialized: () => ipcRenderer.invoke('tx:isInitialized'),
});

// src/data/ipcRepository.ts
export class IpcTransactionRepository implements TransactionRepository {
  constructor(private api: KakeiboApi) {}
  isInitialized() { return this.api.isInitialized(); }
  list() { return this.api.list(); }
  create(input) { return this.api.create(input); }
  // …残りも同様
}

// electron/main.ts（抜粋）
ipcMain.handle('tx:create', (_e, input) => {
  const errors = validateTransaction(input);   // src/domain/validation.ts を共有
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return db.createTransaction(input);
});
```

## 注意点

- `better-sqlite3` はネイティブモジュール。`electron-rebuild`（または electron-builder の `install-app-deps`）が必要。
- メインプロセスでも `validateTransaction` を必ず実行する（レンダラーは信用しない）。
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` を維持する。
- 既存ユーザーのデータ移行: 初回起動時に localStorage の `kakeibo:transactions` を読み、`replaceAll` で SQLite に流し込む。
- 月数が増えて件数が多くなったら、`summarize` などを SQL の `GROUP BY` に置き換え、Repository に `summaryByMonth()` を追加する。純粋関数版はテストの正解データとして残す。
