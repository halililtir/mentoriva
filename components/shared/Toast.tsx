'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let _show: ((message: string, type?: ToastType) => void) | null = null;
let _seq = 0;

export function showToast(message: string, type: ToastType = 'info') {
  _show?.(message, type);
}

const STYLES: Record<ToastType, { dot: string; ring: string }> = {
  info: { dot: 'bg-brand-400', ring: 'border-brand-500/25' },
  success: { dot: 'bg-emerald-400', ring: 'border-emerald-500/25' },
  error: { dot: 'bg-red-400', ring: 'border-red-500/30' },
  warning: { dot: 'bg-amber-400', ring: 'border-amber-500/30' },
};

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++_seq;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    _show = show;
    return () => { _show = null; };
  }, [show]);

  return (
    <div className="pointer-events-none fixed left-1/2 top-20 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn('glass pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/85 animate-fade-down', STYLES[t.type].ring)}
        >
          <span className={cn('h-2 w-2 flex-shrink-0 rounded-full', STYLES[t.type].dot)} />
          {t.message}
        </div>
      ))}
    </div>
  );
}
