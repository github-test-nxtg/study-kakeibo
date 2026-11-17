import { useEffect, useRef, useState } from 'react';
import type { MonthKey, ThemeMode } from '../types';
import { formatMonth } from '../utils/format';

interface Props {
  month: MonthKey;
  isCurrentMonth: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  themeMode: ThemeMode;
  onCycleTheme: () => void;
  onResetSample: () => void;
  onClearAll: () => void;
}

const THEME_LABEL: Record<ThemeMode, { icon: string; text: string }> = {
  system: { icon: '◐', text: 'システム' },
  light: { icon: '☀', text: 'ライト' },
  dark: { icon: '☾', text: 'ダーク' },
};

export function Header(props: Props) {
  const { year, month } = formatMonth(props.month);
  const theme = THEME_LABEL[props.themeMode];
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="brand-mark" aria-hidden="true">簿</span>
        <span>家計簿</span>
      </div>

      <nav className="month-nav" aria-label="表示する月">
        <button className="icon-btn" onClick={props.onPrev} aria-label="前の月">‹</button>
        <h1 className="month-nav__label">
          <span className="month-nav__year">{year}年</span>
          <span className="month-nav__month">{month}月</span>
        </h1>
        <button className="icon-btn" onClick={props.onNext} aria-label="次の月">›</button>
        {!props.isCurrentMonth && (
          <button className="text-btn" onClick={props.onToday}>今月へ</button>
        )}
      </nav>

      <div className="topbar__actions">
        <button className="ghost-btn" onClick={props.onCycleTheme} title={`表示テーマ：${theme.text}（クリックで切り替え）`} aria-label={`表示テーマ：${theme.text}`}>
          <span aria-hidden="true">{theme.icon}</span> <span className="theme-label">{theme.text}</span>
        </button>
        <DataMenu onResetSample={props.onResetSample} onClearAll={props.onClearAll} />
      </div>
    </header>
  );
}

function DataMenu({ onResetSample, onClearAll }: { onResetSample: () => void; onClearAll: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setConfirmClear(false);
  }, [open]);

  return (
    <div className="menu" ref={ref}>
      <button className="ghost-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        データ ▾
      </button>
      {open && (
        <div className="menu__panel" role="menu">
          <button role="menuitem" onClick={() => { onResetSample(); setOpen(false); }}>
            サンプルデータに戻す
            <small>今のデータを置き換えて、直近6か月分の記録を入れます</small>
          </button>
          {confirmClear ? (
            <button role="menuitem" className="danger" onClick={() => { onClearAll(); setOpen(false); }}>
              本当にすべて削除する
              <small>この操作は取り消せません</small>
            </button>
          ) : (
            <button role="menuitem" onClick={() => setConfirmClear(true)}>
              すべての記録を削除
              <small>空の状態から使い始めます</small>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
