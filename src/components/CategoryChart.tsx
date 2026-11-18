import { useState } from 'react';
import type { CategoryTotal, TransactionType } from '../types';
import { formatYen } from '../utils/format';

interface Props {
  data: CategoryTotal[];
  type: TransactionType;
  onTypeChange: (type: TransactionType) => void;
  selectedId: string | null;
  onSelect: (categoryId: string | null) => void;
}

const R = 54;
const STROKE = 20;
const C = 2 * Math.PI * R;
const LEGEND_LIMIT = 5;

/** 外部ライブラリを使わない SVG ドーナツグラフ（Electron でもそのまま動く） */
export function CategoryChart({ data, type, onTypeChange, selectedId, onSelect }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const total = data.reduce((s, d) => s + d.amount, 0);
  const focusId = hoverId ?? selectedId;
  const focused = data.find((d) => d.category.id === focusId);

  let offset = 0;
  const segments = data.map((d) => {
    const len = d.ratio * C;
    const seg = { ...d, len, offset };
    offset += len;
    return seg;
  });

  const topItems = data.slice(0, LEGEND_LIMIT);
  const otherItems = data.slice(LEGEND_LIMIT);
  const otherTotal = otherItems.reduce((s, d) => s + d.amount, 0);
  return (
    <section className="panel" aria-labelledby="category-chart-title">
      <div className="panel__head">
        <h2 id="category-chart-title">カテゴリ別</h2>
        <div className="segmented segmented--small" role="tablist" aria-label="集計する種類">
          {(['expense', 'income'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={type === t} onClick={() => onTypeChange(t)}>
              {t === 'expense' ? '支出' : '収入'}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <p className="empty-note">この月の{type === 'expense' ? '支出' : '収入'}はまだありません。</p>
      ) : (
        <div className="donut-wrap">
          <svg className="donut" viewBox="0 0 160 160" role="img" aria-label={`${type === 'expense' ? '支出' : '収入'}のカテゴリ別内訳`}>
            <circle cx="80" cy="80" r={R} fill="none" stroke="var(--track)" strokeWidth={STROKE} />
            {segments.map((s) => {
              const dim = focusId !== null && focusId !== s.category.id;
              const gap = segments.length > 1 ? Math.min(1.5, s.len / 3) : 0;
              return (
                <circle
                  key={s.category.id}
                  cx="80"
                  cy="80"
                  r={R}
                  fill="none"
                  stroke={s.category.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${Math.max(s.len - gap, 0)} ${C}`}
                  strokeDashoffset={-s.offset}
                  transform="rotate(-90 80 80)"
                  className="donut__seg"
                  style={{ opacity: dim ? 0.25 : 1 }}
                  onMouseEnter={() => setHoverId(s.category.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => onSelect(selectedId === s.category.id ? null : s.category.id)}
                />
              );
            })}
            <text x="80" y="74" textAnchor="middle" className="donut__caption">
              {focused ? focused.category.name : '合計'}
            </text>
            <text x="80" y="94" textAnchor="middle" className="donut__value">
              {formatYen(focused ? focused.amount : total)}
            </text>
          </svg>

          <ul className="legend">
            {topItems.map((d) => (
              <li key={d.category.id}>
                <button
                  className="legend__item"
                  aria-pressed={selectedId === d.category.id}
                  onMouseEnter={() => setHoverId(d.category.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => onSelect(selectedId === d.category.id ? null : d.category.id)}
                  title="クリックで明細を絞り込み"
                >
                  <span className="swatch" style={{ background: d.category.color }} aria-hidden="true" />
                  <span className="legend__name">{d.category.name}</span>
                  <span className="legend__pct">{(d.ratio * 100).toFixed(1)}%</span>
                  <span className="legend__amount">{formatYen(d.amount)}</span>
                </button>
              </li>
            ))}
            {otherItems.length > 0 && <li className="legend__more">他 {otherItems.length} 件 ({formatYen(otherTotal)})</li>}
          </ul>
        </div>
      )}
    </section>
  );
}
