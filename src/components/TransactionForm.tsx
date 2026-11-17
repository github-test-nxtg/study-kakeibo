import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { Category, Transaction, TransactionInput, TransactionType } from '../types';
import { categoriesOf } from '../domain/categories';
import { MAX_MEMO_LENGTH, parseAmount, validateTransaction, type ValidationErrors } from '../domain/validation';
import { formatYen } from '../utils/format';

interface Props {
  /** 編集時は既存の取引、新規時は null */
  initial: Transaction | null;
  defaultDate: string;
  categories: readonly Category[];
  memoSuggestions: (categoryId: string) => string[];
  onSubmit: (input: TransactionInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

export function TransactionForm({ initial, defaultDate, categories, memoSuggestions, onSubmit, onDelete, onClose }: Props) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense');
  const [date, setDate] = useState(initial?.date ?? defaultDate);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categoriesOf('expense', categories)[0]?.id ?? '');
  const [amountText, setAmountText] = useState(initial ? String(initial.amount) : '');
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => categoriesOf(type, categories), [type, categories]);
  const amount = parseAmount(amountText);
  const suggestions = useMemo(() => memoSuggestions(categoryId), [memoSuggestions, categoryId]);

  useEffect(() => {
    amountRef.current?.focus();
    const prev = document.activeElement as HTMLElement | null;
    return () => prev?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const switchType = (t: TransactionType) => {
    setType(t);
    if (!categoriesOf(t, categories).some((c) => c.id === categoryId)) {
      setCategoryId(categoriesOf(t, categories)[0]?.id ?? '');
    }
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const input: TransactionInput = { type, date, categoryId, amount, memo };
    const errs = validateTransaction(input);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (errs.amount) amountRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSubmit(input);
    } catch {
      setSaving(false);
    }
  };

  // Tab キーでダイアログの外にフォーカスが出ないようにする
  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void submit();
      return;
    }
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const nodes = dialogRef.current.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])');
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`dialog dialog--${type}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-title"
        ref={dialogRef}
        onKeyDown={trapFocus}
      >
        <form onSubmit={submit} noValidate>
          <div className="dialog__head">
            <h2 id="form-title">{initial ? '記録を編集' : '新しく記入'}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="閉じる">×</button>
          </div>

          <div className="segmented segmented--wide" role="radiogroup" aria-label="種類">
            {(['expense', 'income'] as const).map((t) => (
              <button type="button" key={t} role="radio" aria-checked={type === t} className={`seg-${t}`} onClick={() => switchType(t)}>
                {t === 'expense' ? '支出' : '収入'}
              </button>
            ))}
          </div>

          <div className="field field--amount">
            <label htmlFor="f-amount">金額</label>
            <div className="amount-input">
              <span aria-hidden="true">¥</span>
              <input
                id="f-amount"
                ref={amountRef}
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                onBlur={() => Number.isFinite(amount) && setAmountText(String(amount))}
                aria-invalid={!!errors.amount}
                aria-describedby="f-amount-help"
              />
            </div>
            <p id="f-amount-help" className={errors.amount ? 'field__error' : 'field__help'}>
              {errors.amount ?? (Number.isFinite(amount) && amount > 0 ? formatYen(amount) : '全角数字やカンマ付きでも入力できます')}
            </p>
          </div>

          <fieldset className="field">
            <legend>カテゴリ</legend>
            <div className="cat-grid">
              {options.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className="cat-chip"
                  aria-pressed={categoryId === c.id}
                  style={{ ['--cat' as string]: c.color }}
                  onClick={() => setCategoryId(c.id)}
                >
                  <span aria-hidden="true">{c.icon}</span>
                  {c.name}
                </button>
              ))}
            </div>
            {errors.categoryId && <p className="field__error">{errors.categoryId}</p>}
          </fieldset>

          <div className="field-row">
            <div className="field">
              <label htmlFor="f-date">日付</label>
              <input id="f-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={!!errors.date} />
              {errors.date && <p className="field__error">{errors.date}</p>}
            </div>
            <div className="field field--grow">
              <label htmlFor="f-memo">メモ</label>
              <input
                id="f-memo"
                list="memo-suggestions"
                maxLength={MAX_MEMO_LENGTH}
                placeholder="例：スーパー"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
              <datalist id="memo-suggestions">
                {suggestions.map((s) => <option key={s} value={s} />)}
              </datalist>
              {errors.memo && <p className="field__error">{errors.memo}</p>}
            </div>
          </div>

          <div className="dialog__actions">
            {onDelete && (
              <button type="button" className="danger-btn" onClick={() => { setSaving(true); onDelete().catch(() => setSaving(false)); }} disabled={saving}>
                削除
              </button>
            )}
            <span className="dialog__hint">Ctrl + Enter で保存</span>
            <button type="button" className="ghost-btn" onClick={onClose}>キャンセル</button>
            <button type="submit" className="primary-btn" disabled={saving}>
              {initial ? '変更を保存' : '記入する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
