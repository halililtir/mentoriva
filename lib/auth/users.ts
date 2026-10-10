/**
 * Kullanıcı deposu ve günlük soru kotası.
 *
 * Redis anahtarları:
 *   user:<email>                 → StoredUser (JSON)
 *   usage:<email>:<YYYY-MM-DD>   → o gün kullanılan soru sayısı (atomik INCR)
 *
 * Kota ayrı bir sayaçta tutulur; böylece paralel istekler kullanıcı kaydını
 * ezmeden doğru sayılır ve gün değişince sayaç kendiliğinden sıfırlanır.
 */

import { getKV, getMany, scanKeys } from '@/lib/kv';
import { todayKey } from '@/lib/time';
import { DEFAULT_DAILY_LIMIT, LEGACY_DEFAULT_LIMIT } from '@/lib/auth/limits';
import { getBonus, refundBonus, spendBonus } from '@/lib/auth/bonus';
import { FOUNDER_DAILY_BONUS, deleteBadgeData, getPerks, hasBadge, type PerkId } from '@/lib/badges';
import { deleteAllChats } from '@/lib/chats';
import type { ConsentRecord } from '@/lib/legal';

export { DEFAULT_DAILY_LIMIT };
const USAGE_TTL_SECONDS = 60 * 60 * 48;

export interface StoredUser {
  username: string; // e-posta (küçük harf) — anahtar
  email?: string;
  name?: string;
  password: string; // scrypt hash (eski kayıtlarda düz metin olabilir)
  dailyLimit?: number;
  /** Günlük limiti admin elle verdi; varsayılan değişse de korunur. */
  limitByAdmin?: boolean;
  /** Eski alan — dailyLimit yoksa günlük limit olarak okunur. */
  questionLimit?: number;
  /** Ömür boyu toplam soru (istatistik). */
  questionsUsed?: number;
  isActive: boolean;
  isVerified?: boolean;
  createdAt: string;
  lastSeen: string | null;
  notes?: string;
  /** Davet linkindeki kod (lib/auth/referral.ts). */
  referralCode?: string;
  /** Bu kullanıcıyı davet eden kişinin e-postası. */
  referredBy?: string;
  /** Kayıtta verilen onaylar (yaş, şartlar, yurt dışı aktarım; lib/legal.ts). */
  consent?: ConsentRecord;
  // Eski sürümden kalan, artık okunmayan alanlar
  dailyUsed?: number;
  dailyResetDate?: string;
}

export interface PublicUser {
  username: string;
  name: string;
  dailyLimit: number;
  usedToday: number;
  /** Kullanılmamış bonus hakları (davetlerden). */
  bonus: number;
  /** Bugün kullanılabilecek toplam: günlük kalan + bonus. */
  remaining: number;
  /** Ömür boyu sorulan soru (yeni üye karşılaması için). */
  questionsUsed: number;
  /** İşaretlerin açtığı ayrıcalıklar (lib/badges-public.ts → PERKS). */
  perks: PerkId[];
}

const userKey = (username: string) => `user:${username}`;
const usageKey = (username: string, day = todayKey()) => `usage:${username}:${day}`;

export function dailyLimitOf(user: StoredUser): number {
  const stored = user.dailyLimit ?? user.questionLimit;
  // Kayıtta otomatik yazılmış eski varsayılan (5) → yeni varsayılan; admin'in verdiği korunur
  if (stored === undefined || (stored === LEGACY_DEFAULT_LIMIT && !user.limitByAdmin)) return DEFAULT_DAILY_LIMIT;
  const limit = Number(stored);
  return Number.isFinite(limit) && limit >= 0 ? limit : DEFAULT_DAILY_LIMIT;
}

/** Günlük limit + rozet ayrıcalıkları (Kurucu Üye: +1). Kota hesabında bunu kullan. */
export async function effectiveDailyLimit(user: StoredUser): Promise<number> {
  const base = dailyLimitOf(user);
  const perks = await getPerks(user.username).catch(() => [] as PerkId[]);
  return perks.includes('gunluk-arti-bir') ? base + FOUNDER_DAILY_BONUS : base;
}

export async function getUser(username: string): Promise<StoredUser | null> {
  if (!username) return null;
  const raw = await getKV().get<StoredUser | string>(userKey(username));
  if (!raw) return null;
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as StoredUser;
}

export async function saveUser(user: StoredUser): Promise<void> {
  await getKV().set(userKey(user.username), user);
}

/** Kullanıcıyı ve ona bağlı tüm kişisel verileri siler. */
export async function deleteUser(username: string): Promise<void> {
  await getKV().del(
    userKey(username),
    usageKey(username),
    `bonus:${username}`,
    `answers:${username}`,
    `journey-step:${username}`,
    `journeys:${username}`,
    `cards:${username}`,
    `memory:${username}`,
  );
  await deleteBadgeData(username);
  await deleteAllChats(username);
}

export async function listUsers(): Promise<StoredUser[]> {
  const keys = await scanKeys('user:*');
  const users = await getMany<StoredUser | string>(keys);
  return users
    .filter((u): u is StoredUser | string => !!u)
    .map((u) => (typeof u === 'string' ? JSON.parse(u) : u) as StoredUser)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function getUsedToday(username: string): Promise<number> {
  return Number(await getKV().get(usageKey(username))) || 0;
}

export async function resetUsageToday(username: string): Promise<void> {
  await getKV().del(usageKey(username));
}

export async function toPublicUser(user: StoredUser): Promise<PublicUser> {
  const [dailyLimit, usedToday, bonus, perks] = await Promise.all([
    effectiveDailyLimit(user),
    getUsedToday(user.username),
    getBonus(user.username),
    getPerks(user.username).catch(() => [] as PerkId[]),
  ]);
  return {
    username: user.username,
    name: user.name || user.username.split('@')[0] || user.username,
    dailyLimit,
    usedToday,
    bonus,
    remaining: Math.max(0, dailyLimit - usedToday) + bonus,
    questionsUsed: user.questionsUsed ?? 0,
    perks,
  };
}

/** Admin listesinde parola alanı asla dönmez. */
export function withoutPassword(user: StoredUser): Omit<StoredUser, 'password'> {
  const rest: Partial<StoredUser> = { ...user };
  delete rest.password;
  return rest as Omit<StoredUser, 'password'>;
}

export interface Reservation {
  /** Bu işlemden sonra kalan toplam hak (günlük + bonus). */
  remaining: number;
  /** Hak bonus havuzundan mı düşüldü? (iade için) */
  fromBonus: boolean;
}

/**
 * Bir soru hakkı ayırır: önce günlük haktan, o bittiyse bonus haklardan.
 * Hiç hak yoksa `null`. Cevap üretilemezse `releaseQuestion` ile iade edilmeli.
 */
export async function reserveQuestion(user: StoredUser): Promise<Reservation | null> {
  const kv = getKV();
  const key = usageKey(user.username);
  const limit = await effectiveDailyLimit(user);

  const used = await kv.incr(key);
  if (used === 1) await kv.expire(key, USAGE_TTL_SECONDS);

  if (used <= limit) {
    return { remaining: Math.max(0, limit - used) + (await getBonus(user.username)), fromBonus: false };
  }
  await kv.decr(key);

  if (await spendBonus(user.username)) {
    return { remaining: await getBonus(user.username), fromBonus: true };
  }
  return null;
}

export async function releaseQuestion(user: StoredUser, reservation: Reservation): Promise<void> {
  if (reservation.fromBonus) {
    await refundBonus(user.username);
    return;
  }
  const kv = getKV();
  const key = usageKey(user.username);
  const after = await kv.decr(key);
  if (after < 0) await kv.del(key);
}

/** Başarılı cevaptan sonra toplam sayaç ve lastSeen güncellenir. */
export async function recordQuestion(username: string): Promise<void> {
  const fresh = await getUser(username);
  if (!fresh) return;
  fresh.questionsUsed = (fresh.questionsUsed ?? 0) + 1;
  fresh.lastSeen = new Date().toISOString();
  await saveUser(fresh);
}
