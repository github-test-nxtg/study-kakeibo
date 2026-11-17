# CLAUDE.md — 家計簿アプリ

## 概要
React 18 + TypeScript の家計簿アプリ試作品。将来 Electron + SQLite で Windows デスクトップアプリにする。

## コマンド
- `npm install`（初回のみ E2E 用ブラウザも `npx playwright install chromium`）
- `npm run build` … dist/index.html（CSS/JS インラインの単一ファイル）を生成
- `npm run dev` … 変更を監視して dist/index.html を再生成
- `npm run typecheck` … tsc --noEmit
- `npm test` … src/domain と sampleData の単体テスト（node:test）
- `npm run check` … 型チェック＋単体テスト＋ビルド（数秒）
- `npm run test:e2e` … 画面操作テスト（Playwright、tests/e2e）
- `docker compose run --rm e2e` … 上記すべて。作業の最後に必ず実行する

## 自動チェック
- `.claude/settings.json` の Stop フックが、応答の終わりに `npm run check` を自動実行する。
  失敗するとエラー内容が返ってくるので、テストを書き換えて通すのではなく、原因のコードを直す。
- 画面の挙動を変えたら tests/e2e/kakeibo.spec.ts も更新し、`npm run test:all` を通す。
- E2E テストの要素指定は、ラベル・ロール・アクセシブルネームを使う（CSS クラスに頼らない）。

## 設計ルール（必ず守る）
1. **UI は保存先を知らない。** データの読み書きは `TransactionRepository`（src/data/repository.ts）経由のみ。localStorage や IPC を直接呼ばない。
2. **集計・検索・バリデーションは src/domain の純粋関数。** React の hooks を import しない。新しい集計を追加したらテストも追加する。
3. **Repository のメソッドはすべて async。** 同期実装でも Promise を返す（IPC 化のため）。
4. **金額は円単位の整数、日付は 'YYYY-MM-DD' 文字列。** Date オブジェクトや小数を保存しない。
5. **状態の更新順序:** Repository への保存が成功してから React state を更新する（hooks/useTransactions.ts）。
6. 外部 UI ライブラリ・グラフライブラリは入れない（グラフは SVG 手書き）。追加する場合は相談する。
7. 色はすべて src/styles.css の CSS 変数を使う。ライト/ダーク両方の値を定義する。

## ディレクトリ
- src/types … ドメイン型
- src/domain … 純粋関数（集計・日付・検索・バリデーション・カテゴリ定義）
- src/data … Repository インターフェースと実装、サンプルデータ
- src/hooks … useTransactions（データ）、useTheme（テーマ）
- src/components … 表示コンポーネント
- docs/schema.sql … SQLite スキーマ案
- docs/electron-migration.md … 移行計画

## 次のタスク候補
docs/electron-migration.md の「変更が必要なファイル」を上から順に実装する。
