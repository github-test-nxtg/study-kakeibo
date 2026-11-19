import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Transaction, TransactionInput, TransactionType } from './types';
import type { TransactionRepository } from './data/repository';
import { DEFAULT_CATEGORIES, createCategoryLookup } from './domain/categories';
import { currentMonth, shiftMonth, todayISO, toMonthKey } from './domain/dates';
import { categoryBreakdown, filterByMonth, monthlyTrend, normalizeText, searchTransactions, sortByDateDesc, summarize } from './domain/summary';
import { useTransactions } from './hooks/useTransactions';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { MonthSummary } from './components/MonthSummary';
import { CategoryChart } from './components/CategoryChart';
import { TrendChart } from './components/TrendChart';
import { LedgerToolbar, type TypeFilter } from './components/LedgerToolbar';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { Toast, type ToastState } from './components/Toast';

interface Props {
  /** 保存先は外から注入する。Electron 版ではここに IPC 経由の実装を渡すだけ */
  repository: TransactionRepository;
}

type Editing = { mode: 'new' } | { mode: 'edit'; item: Transaction } | null;

export function App({ repository }: Props) {
  const tx = useTransactions(repository);
  const theme = useTheme();
  const categories = DEFAULT_CATEGORIES;
  const lookup = useMemo(() => createCategoryLookup(categories), [categories]);

  // ---- 画面の状態（保存しない UI 状態） ----
  const [month, setMonth] = useState(currentMonth());
  const [keyword, setKeyword] = useState('');
  const [allPeriods, setAllPeriods] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sortOrder, setSortOrder] = useState<'date' | 'amount'>('date');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [chartType, setChartType] = useState<TransactionType>('expense');
  const [editing, setEditing] = useState<Editing>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const notify = useCallback((t: Omit<ToastState, 'id'>) => setToast({ ...t, id: Date.now() }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  // ---- 派生データ（すべて純粋関数で計算） ----
  const summary = useMemo(() => summarize(tx.items, month), [tx.items, month]);
  const previous = useMemo(() => summarize(tx.items, shiftMonth(month, -1)), [tx.items, month]);
  const trend = useMemo(() => monthlyTrend(tx.items, month, 6), [tx.items, month]);
  const breakdown = useMemo(() => categoryBreakdown(tx.items, month, chartType, lookup), [tx.items, month, chartType, lookup]);

  const visible = useMemo(() => {
    let list = allPeriods ? tx.items : filterByMonth(tx.items, month);
    if (typeFilter !== 'all') list = list.filter((t) => t.type === typeFilter);
    if (categoryFilter) list = list.filter((t) => t.categoryId === categoryFilter);
    const dataDateDesc = sortByDateDesc(searchTransactions(list, keyword, lookup));
    return (sortOrder === 'date' ? dataDateDesc : dataDateDesc.sort((a, b) => b.amount - a.amount));
  }, [tx.items, allPeriods, month, typeFilter, sortOrder, categoryFilter, keyword, lookup]);

  const visibleTotal = useMemo(
    () => visible.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0),
    [visible],
  );

  // ---- キーボードショートカット（デスクトップアプリを意識） ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (editing || target.closest('input, textarea, select, [contenteditable]')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditing({ mode: 'new' });
      } else if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'ArrowLeft') {
        setMonth((m) => shiftMonth(m, -1));
      } else if (e.key === 'ArrowRight') {
        setMonth((m) => shiftMonth(m, 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing]);

  useEffect(() => {
    if (tx.error) notify({ message: tx.error, tone: 'error' });
  }, [tx.error, notify]);

  // ---- 操作 ----
  const isThisMonth = month === currentMonth();
  const defaultDate = isThisMonth ? todayISO() : `${month}-01`;

  const handleSubmit = async (input: TransactionInput) => {
    if (editing?.mode === 'edit') {
      await tx.edit(editing.item.id, input);
      notify({ message: '変更を保存しました' });
    } else {
      await tx.add(input);
      notify({ message: `${lookup(input.categoryId).name}を記入しました` });
    }
    if (toMonthKey(input.date) !== month && !allPeriods) setMonth(toMonthKey(input.date));
    setEditing(null);
  };

  const handleDelete = async (item: Transaction) => {
    await tx.remove(item);
    setEditing(null);
    notify({
      message: `${lookup(item.categoryId).name}の記録を削除しました`,
      action: { label: '元に戻す', run: () => void tx.restore(item) },
    });
  };

  const selectedCategory = categoryFilter ? lookup(categoryFilter) : null;
  const searching = normalizeText(keyword) !== '';

  if (tx.status === 'loading') {
    return <div className="boot">読み込み中…</div>;
  }

  return (
    <div className="app">
      <Header
        month={month}
        isCurrentMonth={isThisMonth}
        onPrev={() => setMonth((m) => shiftMonth(m, -1))}
        onNext={() => setMonth((m) => shiftMonth(m, 1))}
        onToday={() => setMonth(currentMonth())}
        themeMode={theme.mode}
        onCycleTheme={theme.cycle}
        onResetSample={() => tx.resetWithSample().then(() => notify({ message: 'サンプルデータを読み込みました' }))}
        onClearAll={() => tx.clearAll().then(() => notify({ message: 'すべての記録を削除しました' }))}
      />

      <main className="layout">
        <aside className="overview">
          <MonthSummary summary={summary} previous={previous} />
          <CategoryChart
            data={breakdown}
            type={chartType}
            onTypeChange={(t) => {
              setChartType(t);
              setCategoryFilter(null);
            }}
            selectedId={categoryFilter}
            onSelect={setCategoryFilter}
          />
          <TrendChart data={trend} selected={month} onSelect={setMonth} />
        </aside>

        <section className="ledger-panel" aria-label="明細">
          <LedgerToolbar
            ref={searchRef}
            keyword={keyword}
            onKeywordChange={setKeyword}
            allPeriods={allPeriods}
            onAllPeriodsChange={setAllPeriods}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            categoryFilter={selectedCategory}
            onClearCategory={() => setCategoryFilter(null)}
            onAdd={() => setEditing({ mode: 'new' })}
          />
          <p className="ledger-meta">
            {allPeriods ? '全期間' : `${Number(month.slice(5))}月`}の明細 {visible.length}件
            {(searching || typeFilter !== 'all' || categoryFilter) && visible.length > 0 && (
              <>　合計 <strong>{visibleTotal >= 0 ? '+' : '−'}{Math.abs(visibleTotal).toLocaleString('ja-JP')}円</strong></>
            )}
            <button
              className="text-btn"
              onClick={() => setSortOrder(sortOrder === 'date' ? 'amount' : 'date')}>{sortOrder === 'date' ? '金額順にする' : '日付順にする'}
            </button>
          </p>
          <TransactionList
            items={visible}
            lookup={lookup}
            showYear={allPeriods}
            onEdit={(item) => setEditing({ mode: 'edit', item })}
            onAdd={() => setEditing({ mode: 'new' })}
            emptyMessage={
              searching
                ? `「${keyword}」に一致する記録はありません。「全期間から探す」をオンにすると過去の月も探せます。`
                : tx.items.length === 0
                  ? 'まだ記録がありません。最初の収入か支出を記入しましょう。'
                  : 'この月の記録はありません。'
            }
          />
        </section>
      </main>

      {editing && (
        <TransactionForm
          initial={editing.mode === 'edit' ? editing.item : null}
          defaultDate={defaultDate}
          categories={categories}
          onSubmit={handleSubmit}
          onDelete={editing.mode === 'edit' ? () => handleDelete(editing.item) : undefined}
          onClose={() => setEditing(null)}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
