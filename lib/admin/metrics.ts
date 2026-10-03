/**
 * Admin metrikleri — günlük olay sayaçları.
 *
 * Redis anahtarları:
 *   stats:day:<YYYY-MM-DD>:<olay>   → o gün kaç kez olduğu (INCR, 120 gün TTL)
 *
 * Kişisel veri tutulmaz: yalnızca sayılar. Yazma "en iyi çaba"dır; Redis hatası
 * kullanıcı akışını asla bozmaz.
 */

import { getKV, getMany } from '@/lib/kv';
import { todayKey } from '@/lib/time';

export const EVENTS = {
  question: 'Soru',
  chat: 'Sohbet mesajı',
  signup: 'Yeni üye',
  journey: 'Yolculuk',
  share: 'Paylaşım kartı',
  referral: 'Davetle üye',
  feedback: 'Geri bildirim',
  crisis: 'Kriz filtresi',
  mentor_error: 'Mentor hatası',
  server_error: 'Sunucu hatası',
  client_error: 'Tarayıcı hatası',
} as const;

export type EventName = keyof typeof EVENTS;

const TTL_SECONDS = 60 * 60 * 24 * 120;
const dayKey = (day: string, event: string) => `stats:day:${day}:${event}`;

/** Bir olayı bugünün sayacına ekler. Hata fırlatmaz. */
export async function recordEvent(event: EventName, by = 1): Promise<void> {
  try {
    const kv = getKV();
    const key = dayKey(todayKey(), event);
    const n = await kv.incrby(key, by);
    if (n === by) await kv.expire(key, TTL_SECONDS);
  } catch (e) {
    console.error('[metrics] yazılamadı:', event, e instanceof Error ? e.message : e);
  }
}

/** Bugünden geriye `days` günlük tarih listesi (eskiden yeniye). */
export function lastDays(days: number, now = new Date()): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(todayKey(new Date(now.getTime() - i * 86_400_000)));
  return out;
}

/** Her olay için günlük seri: { question: [3, 0, 5, …], … } */
export async function getSeries(dates: string[], events: readonly string[] = Object.keys(EVENTS)): Promise<Record<string, number[]>> {
  const keys = events.flatMap((e) => dates.map((d) => dayKey(d, e)));
  const values = await getMany<number | string>(keys);
  const out: Record<string, number[]> = {};
  events.forEach((e, ei) => {
    out[e] = dates.map((_, di) => Number(values[ei * dates.length + di]) || 0);
  });
  return out;
}
