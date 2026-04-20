/**
 * useSSEStream — Server-Sent Events fetch tabanlı SSE consumer.
 *
 * EventSource kullanmıyoruz çünkü o sadece GET destekliyor;
 * biz POST + SSE response istiyoruz (fetch + ReadableStream manuel parse).
 */

import { useCallback, useRef, useState } from 'react';

export interface SSEStreamOptions<TEvent> {
  url: string;
  body: unknown;
  onEvent: (event: TEvent) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export function useSSEStream<TEvent>() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const start = useCallback(async (options: SSEStreamOptions<TEvent>): Promise<void> => {
    // Önceki stream varsa iptal et
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsStreaming(true);

    try {
      // Kullanıcı bilgisini header'a ekle (kota kontrolü için)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const session = localStorage.getItem('mentoriva_session');
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed?.username) headers['x-mentoriva-user'] = parsed.username;
        }
      } catch {}

      const response = await fetch(options.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(options.body),
        signal: abortController.signal,
      });

      if (!response.ok) {
        // Rate limit veya validation hatası — JSON
        const errorBody = await response.json().catch(() => null);
        const message =
          errorBody?.error?.message ??
          `İstek başarısız (${response.status})`;
        throw new Error(message);
      }

      if (!response.body) {
        throw new Error('Yanıt gövdesi boş');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE event'leri '\n\n' ile ayrılıyor
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? ''; // son parça yarım olabilir

        for (const raw of events) {
          const line = raw.trim();
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const parsed = JSON.parse(payload) as TEvent;
            options.onEvent(parsed);
          } catch (err) {
            console.error('SSE parse hatası:', err, 'payload:', payload);
          }
        }
      }

      options.onComplete?.();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Normal iptal — sessizce geç
        return;
      }
      const error = err instanceof Error ? err : new Error('Bilinmeyen hata');
      options.onError?.(error);
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, []);

  const stop = useCallback((): void => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  return { start, stop, isStreaming };
}
