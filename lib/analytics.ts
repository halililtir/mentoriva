/**
 * Ölçüm — Vercel Web Analytics (çerezsiz, kişisel veri toplamaz).
 *
 * Paket kurmadan Vercel'in kendi betiği kullanılır: app/layout.tsx production'da
 * /_vercel/insights/script.js yükler. Vercel panelinde Analytics açık olmalıdır.
 * Olay verisine kişisel bilgi (e-posta, soru metni) KONMAZ.
 */

type EventData = Record<string, string | number | boolean | null>;

declare global {
  interface Window {
    va?: (event: 'beforeSend' | 'event' | 'pageview', properties?: unknown) => void;
    vaq?: unknown[];
  }
}

export function track(name: string, data?: EventData): void {
  if (typeof window === 'undefined') return;
  try {
    window.va?.('event', { name, data });
  } catch {
    // Ölçüm hiçbir zaman uygulamayı bozmamalı
  }
}

/** Betik yüklenmeden önce gelen olaylar kuyruğa alınır (Vercel'in resmi başlatma kodu). */
export const ANALYTICS_INIT = 'window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};';
