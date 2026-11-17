# 家計簿（試作品）

収入・支出の記録、月別集計、カテゴリ別グラフ、検索、ダークモードに対応した家計簿アプリの試作品です。
React + TypeScript で書かれており、ビルドすると単一の HTML ファイルになります（バックエンド不要）。

```
npm install
npm run build   # → dist/index.html をブラウザで開く
npm test             # 単体テスト
npm run test:all     # 型チェック・単体テスト・ビルド・画面操作テスト
```

Docker の場合は `docker compose up app`（ビルドと単体テスト）、
`docker compose run --rm e2e`（画面操作テストまで全部）。

キーボード: `N` 新規記入 / `/` 検索 / `←` `→` 月の移動 / `Ctrl+Enter` 保存 / `Esc` 閉じる

設計の詳細は CLAUDE.md、Windows アプリ化の計画は docs/electron-migration.md を参照してください。
