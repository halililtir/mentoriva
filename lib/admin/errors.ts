/**
 * Hata kaydı — sunucu ve tarayıcı hatalarının son 200'ü (`errors:recent`).
 *
 * Harici bir servis (Sentry vb.) olmadan "canlıda bir şey bozuldu mu?"
 * sorusunu admin panelinden cevaplamak için. Mesajlar kaydedilmeden önce
 * temizlenir: e-posta, uzun anahtar/token ve URL sorgu parametreleri silinir.
 * Kullanıcının yazdığı metin (soru, sohbet) bu kayda asla konmaz.
 */

import { getKV } from '@/lib/kv';
import { recordEvent } from '@/lib/admin/metrics';

export interface ErrorEntry {
  source: 'server' | 'client';
  where: string;
  message: string;
  path?: string;
  at: string;
}

const KEY = 'errors:recent';

export function scrub(text: string, max = 300): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '<e-posta>')
    .replace(/sk-[A-Za-z0-9_-]{10,}/g, '<anahtar>')
    .replace(/[A-Za-z0-9_-]{32,}/g, '<gizli>')
    .replace(/\?[^\s"')]+/g, '?…')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Hata fırlatmaz. */
export async function logError(source: ErrorEntry['source'], where: string, error: unknown, path?: string): Promise<void> {
  try {
    const raw = error instanceof Error ? `${error.name}: ${error.message}` : String(error ?? 'bilinmeyen');
    const entry: ErrorEntry = {
      source,
      where: scrub(where, 60),
      message: scrub(raw),
      path: path ? scrub(path, 120) : undefined,
      at: new Date().toISOString(),
    };
    const kv = getKV();
    await kv.lpush(KEY, JSON.stringify(entry));
    await kv.ltrim(KEY, 0, 199);
    await recordEvent(source === 'client' ? 'client_error' : 'server_error');
  } catch (e) {
    console.error('[errors] kaydedilemedi:', e instanceof Error ? e.message : e);
  }
}

export async function readErrors(limit = 100): Promise<ErrorEntry[]> {
  const raw = await getKV().lrange<unknown>(KEY, 0, limit - 1);
  return raw
    .map((r) => {
      try { return (typeof r === 'string' ? JSON.parse(r) : r) as ErrorEntry; } catch { return null; }
    })
    .filter((e): e is ErrorEntry => !!e && typeof e.message === 'string');
}
