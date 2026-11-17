import { useEffect, useState } from 'react';
import type { ThemeMode } from '../types';

const KEY = 'kakeibo:theme';

function readMode(): ThemeMode {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* 保存領域が使えない場合はシステム設定に従う */
  }
  return 'system';
}

/**
 * テーマ切り替え。CSS 側は :root[data-theme] と prefers-color-scheme で色を切り替える。
 * Electron では nativeTheme.themeSource と同期させるとタイトルバーも追従する。
 */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(readMode);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'system') delete root.dataset.theme;
    else root.dataset.theme = mode;
    try {
      window.localStorage.setItem(KEY, mode);
    } catch {
      /* noop */
    }
  }, [mode]);

  const cycle = () => setMode((m) => (m === 'system' ? 'light' : m === 'light' ? 'dark' : 'system'));
  return { mode, setMode, cycle };
}
