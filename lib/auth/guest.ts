/**
 * Kayıt olmadan deneme hakkı — IP başına günde 1 soru (en fazla 2 mentor).
 *
 *   guest:<gün>:<sha256(ip)>   → kullanıldı işareti (2 gün TTL)
 *   guest-count:<gün>          → günlük toplam deneme (maliyet sigortası)
 *
 * IP düz saklanmaz. Günlük toplam GUEST_DAILY_CAP'i aşarsa deneme o gün kapanır
 * (kötüye kullanımda faturayı sınırlar); üyelik etkilenmez.
 */

import { getKV } from '@/lib/kv';
import { todayKey } from '@/lib/time';
import { digest } from '@/lib/auth/tokens';

export const GUEST_DAILY_CAP = 300;
const TTL = 60 * 60 * 48;

const usedKey = (ip: string, day: string) => `guest:${day}:${digest(`mentoriva-guest:${ip}`)}`;
const countKey = (day: string) => `guest-count:${day}`;

export type GuestReservation = { ok: true; ip: string; day: string } | { ok: false; reason: 'used' | 'cap' };

export async function reserveGuest(ip: string): Promise<GuestReservation> {
  const kv = getKV();
  const day = todayKey();
  // Önce IP (atomik sayaç: ilk istek 1 görür); aynı kişi iki kez denerse genel sayaç artmasın
  const tries = await kv.incr(usedKey(ip, day));
  if (tries === 1) await kv.expire(usedKey(ip, day), TTL);
  if (tries > 1) return { ok: false, reason: 'used' };
  const n = await kv.incr(countKey(day));
  if (n === 1) await kv.expire(countKey(day), TTL);
  if (n > GUEST_DAILY_CAP) {
    await kv.decr(countKey(day));
    await kv.del(usedKey(ip, day));
    return { ok: false, reason: 'cap' };
  }
  return { ok: true, ip, day };
}

/** Hiçbir mentor cevap üretemediyse deneme hakkı geri verilir. */
export async function releaseGuest(r: { ip: string; day: string }): Promise<void> {
  const kv = getKV();
  await kv.del(usedKey(r.ip, r.day));
  await kv.decr(countKey(r.day));
}
