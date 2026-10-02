/**
 * Davet sistemi — arkadaşını getiren ve gelen kullanıcıya bonus soru hakkı.
 *
 *   ref-code:<CODE>   → davet edenin e-postası (süresiz)
 *   ref-count:<email> → ödül verilmiş davet sayısı
 *   bonus:<email>     → kullanılmamış bonus soru hakkı (süresiz, günlük hak bitince harcanır)
 *
 * Kötüye kullanıma karşı: kendi kendini davet edemez, yeni hesap e-posta
 * doğrulaması gerektirir ve bir kişi en fazla MAX_REWARDED_REFERRALS davetten
 * ödül alır.
 */

import { randomBytes } from 'node:crypto';
import { getKV } from '@/lib/kv';
import { getUser, saveUser, type StoredUser } from '@/lib/auth/users';
import { addBonus } from '@/lib/auth/bonus';

export const REFERRER_BONUS = 5;
export const NEW_USER_BONUS = 2;
export const MAX_REWARDED_REFERRALS = 10;

// Karışabilecek harfler (0/O, 1/I/L) çıkarıldı
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function newCode(): string {
  const bytes = randomBytes(8);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function normalizeReferralCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z2-9]{8}$/.test(code) ? code : null;
}

/** Kullanıcının davet kodunu döner; yoksa üretip kaydeder. */
export async function getOrCreateReferralCode(user: StoredUser): Promise<string> {
  if (user.referralCode) return user.referralCode;
  const kv = getKV();
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    if (await kv.get(`ref-code:${code}`)) continue;
    await kv.set(`ref-code:${code}`, user.username);
    const fresh = (await getUser(user.username)) ?? user;
    fresh.referralCode = code;
    await saveUser(fresh);
    return code;
  }
  throw new Error('Davet kodu üretilemedi');
}

export async function getRewardedReferralCount(username: string): Promise<number> {
  return Number(await getKV().get(`ref-count:${username}`)) || 0;
}

/**
 * Yeni doğrulanmış hesap için davet ödülünü uygular.
 * @returns ödül verildiyse true
 */
export async function applyReferral(code: string | null, newUsername: string): Promise<boolean> {
  if (!code) return false;
  const kv = getKV();
  const referrer = await kv.get<string>(`ref-code:${code}`);
  if (!referrer || String(referrer) === newUsername) return false;

  const referrerUser = await getUser(String(referrer));
  if (!referrerUser?.isActive) return false;

  const count = await kv.incr(`ref-count:${referrer}`);
  if (count > MAX_REWARDED_REFERRALS) {
    await kv.decr(`ref-count:${referrer}`);
    // Sınır doldu; yeni gelen kullanıcı yine de hoş geldin bonusunu alır
    await addBonus(newUsername, NEW_USER_BONUS);
    return false;
  }
  await addBonus(String(referrer), REFERRER_BONUS);
  await addBonus(newUsername, NEW_USER_BONUS);

  const fresh = await getUser(newUsername);
  if (fresh) {
    fresh.referredBy = String(referrer);
    await saveUser(fresh);
  }
  return true;
}
