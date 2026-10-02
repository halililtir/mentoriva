/**
 * Bonus soru hakları — `bonus:<email>` (süresiz). Günlük hak bitince harcanır.
 * Davet sisteminden (lib/auth/referral.ts) ve admin panelinden gelir.
 */

import { getKV } from '@/lib/kv';

const key = (username: string) => `bonus:${username}`;

export async function getBonus(username: string): Promise<number> {
  return Math.max(0, Number(await getKV().get(key(username))) || 0);
}

export async function addBonus(username: string, amount: number): Promise<void> {
  await getKV().incrby(key(username), amount);
}

/** Bir bonus hakkı harcar; yoksa false. Atomik: önce düşer, eksiye inerse geri alır. */
export async function spendBonus(username: string): Promise<boolean> {
  const kv = getKV();
  const left = await kv.decr(key(username));
  if (left >= 0) return true;
  await kv.incr(key(username));
  return false;
}

export async function refundBonus(username: string): Promise<void> {
  await getKV().incr(key(username));
}
