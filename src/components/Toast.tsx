import { useEffect } from 'react';

export interface ToastState {
  id: number;
  message: string;
  tone?: 'info' | 'error';
  action?: { label: string; run: () => void };
}

export function Toast({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, toast.action ? 6000 : 3200);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className="toast-region" aria-live="polite">
      {toast && (
        <div key={toast.id} className={`toast ${toast.tone === 'error' ? 'toast--error' : ''}`}>
          <span>{toast.message}</span>
          {toast.action && (
            <button className="toast__action" onClick={() => { toast.action!.run(); onDismiss(); }}>
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
