import type { Category, Transaction } from '../types';
import { groupByDate } from '../domain/summary';
import { formatDateLabel, formatSignedYen, formatYen } from '../utils/format';

interface Props {
  items: Transaction[];
  lookup: (id: string) => Category;
  showYear: boolean;
  onEdit: (t: Transaction) => void;
  emptyMessage: string;
  onAdd: () => void;
}

export function TransactionList({ items, lookup, showYear, onEdit, emptyMessage, onAdd }: Props) {
  if (items.length === 0) {
    return (
      <div className="ledger-empty">
        <p>{emptyMessage}</p>
        <button className="text-btn" onClick={onAdd}>新しく記入する</button>
      </div>
    );
  }

  return (
    <ol className="ledger">
      {groupByDate(items).map((g) => {
        const label = formatDateLabel(g.date);
        const net = g.items.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
        return (
          <li key={g.date} className="ledger__day">
            <div className="ledger__date">
              <span>
                {showYear && <span className="ledger__year">{g.date.slice(0, 4)}年</span>}
                {label.day}
                <span className={`weekday ${label.isWeekend ? `weekday--${label.isWeekend}` : ''}`}>（{label.weekday}）</span>
              </span>
              <span className={`ledger__net ${net < 0 ? 'is-minus' : 'is-plus'}`}>{formatSignedYen(net)}</span>
            </div>
            <ul>
              {g.items.map((t) => {
                const c = lookup(t.categoryId);
                return (
                  <li key={t.id}>
                    <button className="entry" onClick={() => onEdit(t)} aria-label={`${c.name} ${formatYen(t.amount)} ${t.memo} を編集`}>
                      <span className="entry__icon" style={{ ['--cat' as string]: c.color }} aria-hidden="true">{c.icon}</span>
                      <span className="entry__body">
                        <span className="entry__cat">{c.name}</span>
                        {t.memo && <span className="entry__memo">{t.memo}</span>}
                      </span>
                      <span className={`entry__amount amount amount--${t.type}`}>
                        {t.type === 'income' ? '+' : '−'}{formatYen(t.amount)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
