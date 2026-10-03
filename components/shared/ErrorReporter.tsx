'use client';

import { useEffect } from 'react';

/** Sayfa başına en fazla bu kadar hata gönderilir (döngüye giren hatalar sunucuyu yormasın). */
const MAX_PER_PAGE = 5;

export function reportClientError(where: string, error: unknown): void {
  try {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error ?? '');
    if (!message || /ResizeObserver loop|Script error\.?$/.test(message)) return; // zararsız tarayıcı gürültüsü
    const w = window as typeof window & { __mentorivaErrCount?: number };
    w.__mentorivaErrCount = (w.__mentorivaErrCount ?? 0) + 1;
    if (w.__mentorivaErrCount > MAX_PER_PAGE) return;
    void fetch('/api/v1/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ where, message, path: location.pathname }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // raporlama asla yeni hata üretmemeli
  }
}

/** Yakalanmamış tarayıcı hatalarını admin panelindeki "Hatalar" listesine yollar. */
export function ErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => reportClientError('window', e.error ?? e.message);
    const onRejection = (e: PromiseRejectionEvent) => reportClientError('promise', e.reason);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}
