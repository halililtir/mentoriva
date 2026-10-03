/**
 * Admin işlem kaydı — panelden yapılan her değişiklik (limit, bonus, dondurma,
 * silme…) "admin-log" listesine yazılır; son 300 kayıt tutulur.
 * Kim/ne zaman/ne yapıldı sorusunun cevabı; geri alma için ipucu verir.
 */

import { getKV } from '@/lib/kv';

export interface AdminLogEntry {
  action: string;
  target: string;
  detail?: string;
  at: string;
}

const KEY = 'admin-log';

export async function logAdminAction(action: string, target: string, detail?: string): Promise<void> {
  try {
    const kv = getKV();
    const entry: AdminLogEntry = { action, target, detail, at: new Date().toISOString() };
    await kv.lpush(KEY, JSON.stringify(entry));
    await kv.ltrim(KEY, 0, 299);
  } catch (e) {
    console.error('[admin-log] yazılamadı:', e instanceof Error ? e.message : e);
  }
}

export async function readAdminLog(limit = 100): Promise<AdminLogEntry[]> {
  const raw = await getKV().lrange<unknown>(KEY, 0, limit - 1);
  return raw
    .map((r) => {
      try { return (typeof r === 'string' ? JSON.parse(r) : r) as AdminLogEntry; } catch { return null; }
    })
    .filter((e): e is AdminLogEntry => !!e && typeof e.action === 'string');
}
