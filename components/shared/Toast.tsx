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

export function showToast(message: string, type: ToastType = 'info') {
  _show?.(message, type);
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  useEffect(() => { _show = show; return () => { _show = null; }; }, [show]);

  if (toasts.length === 0) return null;

  const colors: Record<ToastType, string> = {
    info: 'bg-brand-500/15 border-brand-500/30 text-brand-300',
    success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    error: 'bg-red-500/15 border-red-500/30 text-red-300',
    warning: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'px-4 py-3 rounded-card border text-sm animate-fade-up pointer-events-auto',
            colors[t.type],
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
