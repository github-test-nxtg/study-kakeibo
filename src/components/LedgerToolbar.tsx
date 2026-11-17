import { forwardRef } from 'react';
import type { Category } from '../types';

export type TypeFilter = 'all' | 'income' | 'expense';

interface Props {
  keyword: string;
  onKeywordChange: (v: string) => void;
  allPeriods: boolean;
  onAllPeriodsChange: (v: boolean) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (v: TypeFilter) => void;
  categoryFilter: Category | null;
  onClearCategory: () => void;
  onAdd: () => void;
}

export const LedgerToolbar = forwardRef<HTMLInputElement, Props>(function LedgerToolbar(p, searchRef) {
  return (
    <div className="toolbar">
      <div className="toolbar__row">
        <label className="search">
          <span className="visually-hidden">キーワード検索</span>
          <svg viewBox="0 0 20 20" aria-hidden="true" className="search__icon">
            <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M14 14l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={searchRef}
            type="search"
            placeholder="メモ・カテゴリ・金額で検索（/ キー）"
            value={p.keyword}
            onChange={(e) => p.onKeywordChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && p.onKeywordChange('')}
          />
        </label>
        <button className="primary-btn" onClick={p.onAdd} title="N キーでも開けます">
          <span aria-hidden="true">＋</span> 記入する
        </button>
      </div>
      <div className="toolbar__row toolbar__row--filters">
        <div className="segmented" role="radiogroup" aria-label="種類で絞り込み">
          {([['all', 'すべて'], ['expense', '支出'], ['income', '収入']] as const).map(([v, label]) => (
            <button key={v} role="radio" aria-checked={p.typeFilter === v} onClick={() => p.onTypeFilterChange(v)}>
              {label}
            </button>
          ))}
        </div>
        <label className="check">
          <input type="checkbox" checked={p.allPeriods} onChange={(e) => p.onAllPeriodsChange(e.target.checked)} />
          全期間から探す
        </label>
        {p.categoryFilter && (
          <button className="chip" onClick={p.onClearCategory} aria-label={`${p.categoryFilter.name}の絞り込みを解除`}>
            <span className="swatch" style={{ background: p.categoryFilter.color }} aria-hidden="true" />
            {p.categoryFilter.name}
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
    </div>
  );
});
