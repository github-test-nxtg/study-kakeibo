-- Electron + SQLite 移行時のスキーマ案（src/types/index.ts と1対1で対応）
CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color      TEXT NOT NULL,
  icon       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date        TEXT NOT NULL,                       -- 'YYYY-MM-DD'
  category_id TEXT NOT NULL REFERENCES categories(id),
  amount      INTEGER NOT NULL CHECK (amount > 0), -- 円単位の整数
  memo        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

-- スキーマのバージョン管理（PRAGMA user_version を使う方法でもよい）
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
