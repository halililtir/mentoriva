/**
 * useSSEStream — fetch tabanlı Server-Sent Events tüketicisi.
 *
 * EventSource kullanmıyoruz çünkü o sadece GET destekliyor;
 * biz POST + SSE response istiyoruz (fetch + ReadableStream manuel parse).
 * Kimlik doğrulama httpOnly oturum çereziyle otomatik gider.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiErrorCode } from '@/types';

export class StreamError extends Error {
  constructor(message: string, readonly status: number, readonly code?: ApiErrorCode) {
    super(message);
    this.name = 'StreamError';
  }
}

export interface SSEStreamOptions<TEvent> {
  url: string;
  body: unknown;
  onEvent: (event: TEvent) => void;
  onError?: (error: StreamError) => void;
  onComplete?: () => void;
}

/** Mentor görünümlerinin sayfadan aldığı ortak geri çağrılar. */
export interface MentorStreamHandlers {
  onQuota: (remaining: number) => void;
  onAuthRequired: () => void;
  /** Misafir denemesi reddedildiyse sunucunun nedeni (GUEST_USED) gelir. */
  onQuotaExceeded: (reason?: string) => void;
}

export function useSSEStream<TEvent>() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Bileşen kaldırılınca açık akışı kapat. Kapatma bir tick ertelenir:
  // React Strict Mode geliştirmede bileşeni söküp hemen geri takar; o sahte
  // söküm akışı iptal etmesin diye yeniden takılıp takılmadığına bakılır.
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      setTimeout(() => {
        if (!mountedRef.current) abortControllerRef.current?.abort();
      }, 0);
    };
  }, []);

  const start = useCallback(async (options: SSEStreamOptions<TEvent>): Promise<void> => {
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsStreaming(true);

    try {
      const response = await fetch(options.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options.body),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error?.message ?? `İstek başarısız (${response.status})`;
        throw new StreamError(message, response.status, errorBody?.error?.code);
      }
      if (!response.body) throw new StreamError('Yanıt gövdesi boş', 500);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE event'leri '\n\n' ile ayrılıyor; son parça yarım olabilir
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const raw of events) {
          const line = raw.trim();
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            options.onEvent(JSON.parse(payload) as TEvent);
          } catch (err) {
            console.error('SSE parse hatası:', err);
          }
        }
      }

      options.onComplete?.();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const error =
        err instanceof StreamError ? err : new StreamError('Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.', 0);
      options.onError?.(error);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
        setIsStreaming(false);
      }
    }
  }, []);

  const stop = useCallback((): void => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  return { start, stop, isStreaming };
}

/** HTTP hata kodlarını sayfa seviyesindeki eylemlere yönlendirir. true → ele alındı. */
export function routeStreamError(error: StreamError, handlers: MentorStreamHandlers): boolean {
  if (error.status === 401) {
    handlers.onAuthRequired();
    return true;
  }
  if (error.code === 'QUOTA_EXCEEDED' || error.code === 'GUEST_USED') {
    handlers.onQuotaExceeded(error.code === 'GUEST_USED' ? error.message : undefined);
    return true;
  }
  return false;
}
