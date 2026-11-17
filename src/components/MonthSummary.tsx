import type { MonthlySummary } from '../types';
import { formatSignedYen, formatYen } from '../utils/format';

interface Props {
  summary: MonthlySummary;
  previous: MonthlySummary;
}

/** 月の収支。帳簿の締め方にならって、収支の下に二重線を引く */
export function MonthSummary({ summary, previous }: Props) {
  const diff = previous.expense > 0 ? (summary.expense - previous.expense) / previous.expense : null;
  return (
    <section className="summary" aria-label="今月の収支">
      <dl className="summary__rows">
        <div className="summary__row">
          <dt>収入</dt>
          <dd className="amount amount--income">{formatYen(summary.income)}</dd>
        </div>
        <div className="summary__row">
          <dt>支出</dt>
          <dd className="amount amount--expense">{formatYen(summary.expense)}</dd>
        </div>
        <div className="summary__row summary__row--total">
          <dt>収支</dt>
          <dd className={`amount ${summary.balance < 0 ? 'amount--expense' : ''}`}>{formatSignedYen(summary.balance)}</dd>
        </div>
      </dl>
      <p className="summary__note">
        {summary.count}件の記録
        {diff !== null && (
          <>
            ・支出は前月より
            <strong className={diff > 0 ? 'up' : 'down'}>
              {Math.abs(diff * 100).toFixed(0)}%{diff > 0 ? '多い' : '少ない'}
            </strong>
          </>
        )}
      </p>
    </section>
  );
}
