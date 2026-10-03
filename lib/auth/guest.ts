/**
 * Kayıt olmadan deneme hakkı — CİHAZ başına günde 1 soru (en fazla 2 mentor).
 *
 * IP tek başına kullanılmaz: aynı Wi-Fi'deki cihazlar ve mobil operatörlerin
 * ortak (CGNAT) adresleri yüzünden farklı kişiler aynı IP'yi paylaşır. Bu yüzden:
 *   - cihaz: tarayıcıya konan rastgele, httpOnly deneme kimliği (çerez) → günde 1
 *   - IP: çerez silerek tekrar denemeye karşı gevşek üst sınır → günde GUEST_PER_IP
 *   - genel: günlük toplam GUEST_DAILY_CAP (maliyet sigortası)
 *
 *   guest-dev:<gün>:<sha256(cihaz)>   guest-ip:<gün>:<sha256(ip)>   guest-count:<gün>
 * Kimlik ve IP düz saklanmaz; anahtarlar 2 gün sonra silinir.
 */

import { randomBytes } from 'node:crypto';
import { getKV } from '@/lib/kv';
import { todayKey } from '@/lib/time';
import { digest } from '@/lib/auth/tokens';

export const GUEST_COOKIE = 'mentoriva_guest';
export const GUEST_PER_IP = 5;
export const GUEST_DAILY_CAP = 300;
const TTL = 60 * 60 * 48;

const devKey = (device: string, day: string) => `guest-dev:${day}:${digest(`mentoriva-guest-dev:${device}`)}`;
const ipKey = (ip: string, day: string) => `guest-ip:${day}:${digest(`mentoriva-guest:${ip}`)}`;
const countKey = (day: string) => `guest-count:${day}`;

/** Çerezden gelen kimlik geçerli değilse yenisi üretilir (route çerezi yazar). */
export function guestDeviceId(fromCookie: string | null): { id: string; isNew: boolean } {
  if (fromCookie && /^[a-f0-9]{32}$/.test(fromCookie)) return { id: fromCookie, isNew: false };
  return { id: randomBytes(16).toString('hex'), isNew: true };
}

export type GuestReservation =
  | { ok: true; device: string; ip: string; day: string }
  | { ok: false; reason: 'used' | 'ip' | 'cap' };

async function bump(key: string): Promise<number> {
  const kv = getKV();
  const n = await kv.incr(key);
  if (n === 1) await kv.expire(key, TTL);
  return n;
}

export async function reserveGuest(device: string, ip: string): Promise<GuestReservation> {
  const kv = getKV();
  const day = todayKey();
  // Önce cihaz: aynı cihaz ikinci kez denerse diğer sayaçlar artmasın
  if ((await bump(devKey(device, day))) > 1) return { ok: false, reason: 'used' };
  if ((await bump(ipKey(ip, day))) > GUEST_PER_IP) {
    await Promise.all([kv.decr(ipKey(ip, day)), kv.del(devKey(device, day))]);
    return { ok: false, reason: 'ip' };
  }
  if ((await bump(countKey(day))) > GUEST_DAILY_CAP) {
    await Promise.all([kv.decr(countKey(day)), kv.decr(ipKey(ip, day)), kv.del(devKey(device, day))]);
    return { ok: false, reason: 'cap' };
  }
  return { ok: true, device, ip, day };
}

/** Deneme kimliği çerezi (1 yıl). Yalnızca deneme sınırı için; kimseyle eşleştirilmez. */
export function guestCookieHeader(id: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${GUEST_COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}${secure}`;
}

/** Hiçbir mentor cevap üretemediyse deneme hakkı geri verilir. */
export async function releaseGuest(r: { device: string; ip: string; day: string }): Promise<void> {
  const kv = getKV();
  await Promise.all([kv.del(devKey(r.device, r.day)), kv.decr(ipKey(r.ip, r.day)), kv.decr(countKey(r.day))]);
}
