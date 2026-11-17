import type { MonthKey, MonthlySummary } from '../types';
import { formatCompactYen, formatMonth, formatYen } from '../utils/format';

interface Props {
  data: MonthlySummary[];
  selected: MonthKey;
  onSelect: (month: MonthKey) => void;
}

const W = 320;
const H = 170;
const PAD = { top: 14, right: 6, bottom: 26, left: 40 };

/** 直近6か月の収入・支出の棒グラフ。棒をクリックするとその月に移動する */
export function TrendChart({ data, selected, onSelect }: Props) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const niceMax = niceCeil(max);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const groupW = innerW / data.length;
  const barW = Math.min(14, groupW / 3.2);
  const y = (v: number) => PAD.top + innerH - (v / niceMax) * innerH;
  const ticks = [0, 0.5, 1].map((r) => r * niceMax);

  return (
    <section className="panel" aria-labelledby="trend-title">
      <div className="panel__head">
        <h2 id="trend-title">月別の推移</h2>
        <div className="key">
          <span><i className="key__dot key__dot--income" />収入</span>
          <span><i className="key__dot key__dot--expense" />支出</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="trend" role="img" aria-label="直近6か月の収入と支出">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="trend__grid" />
            <text x={PAD.left - 6} y={y(t) + 3} textAnchor="end" className="trend__axis">{formatCompactYen(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = PAD.left + groupW * i + groupW / 2;
          const isSel = d.month === selected;
          return (
            <g key={d.month} className="trend__group" onClick={() => onSelect(d.month)} role="button" aria-label={`${formatMonth(d.month).month}月を表示`}>
              <title>{`${formatMonth(d.month).month}月　収入 ${formatYen(d.income)} / 支出 ${formatYen(d.expense)}`}</title>
              {isSel && <rect x={cx - groupW / 2 + 2} y={PAD.top - 6} width={groupW - 4} height={innerH + 6} rx="6" className="trend__sel" />}
              <rect x={cx - barW - 1} y={y(d.income)} width={barW} height={Math.max(0, y(0) - y(d.income))} rx="2" className="trend__bar trend__bar--income" />
              <rect x={cx + 1} y={y(d.expense)} width={barW} height={Math.max(0, y(0) - y(d.expense))} rx="2" className="trend__bar trend__bar--expense" />
              <rect x={cx - groupW / 2} y={PAD.top} width={groupW} height={innerH + PAD.bottom} fill="transparent" />
              <text x={cx} y={H - 8} textAnchor="middle" className={`trend__label ${isSel ? 'is-selected' : ''}`}>
                {formatMonth(d.month).month}月
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

function niceCeil(v: number): number {
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * exp;
}
