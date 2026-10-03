/**
 * Kayıt tamamlama — e-posta koduyla (verify) ya da admin onayıyla.
 *
 *   pending:<email>  → bekleyen kayıt (ad, parola özeti, davet, zaman), 7 gün TTL.
 *
 * Doğrulama kodu 10 dakikada düşer; bekleyen kayıt ise admin panelinde 7 gün
 * görünür kalır. Böylece e-posta ulaşmayan biri admin tarafından onaylanabilir.
 */

import { getKV, getMany, scanKeys } from '@/lib/kv';
import { DEFAULT_DAILY_LIMIT, getUser, saveUser, type StoredUser } from '@/lib/auth/users';
import { applyReferral } from '@/lib/auth/referral';
import { recordEvent } from '@/lib/admin/metrics';
import type { PendingRegistration } from '@/lib/auth/codes';

const PENDING_TTL = 60 * 60 * 24 * 7;
const pendingKey = (email: string) => `pending:${email}`;

export interface PendingRecord extends PendingRegistration {
  email: string;
  at: string;
}

export async function savePending(email: string, pending: PendingRegistration): Promise<void> {
  const record: PendingRecord = { ...pending, email, at: new Date().toISOString() };
  await getKV().set(pendingKey(email), record, { ex: PENDING_TTL });
}

export async function getPending(email: string): Promise<PendingRecord | null> {
  const raw = await getKV().get<PendingRecord | string>(pendingKey(email));
  if (!raw) return null;
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as PendingRecord;
}

export async function deletePending(email: string): Promise<void> {
  await getKV().del(pendingKey(email));
}

/** Admin için: bekleyen kayıtlar (parola özeti olmadan), en yeni önce. */
export async function listPending(): Promise<Array<{ email: string; name: string; at: string; referred: boolean }>> {
  const keys = await scanKeys('pending:*');
  const rows = await getMany<PendingRecord | string>(keys);
  return rows
    .map((r) => (r ? ((typeof r === 'string' ? JSON.parse(r) : r) as PendingRecord) : null))
    .filter((r): r is PendingRecord => !!r?.email)
    .map((r) => ({ email: r.email, name: r.name, at: r.at, referred: !!r.ref }))
    .sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * Hesabı oluşturur, davet ödülünü uygular, metrikleri yazar.
 * Zaten varsa null döner (çift kayıt yok).
 */
export async function completeRegistration(
  email: string,
  pending: PendingRegistration,
  how: 'email' | 'admin',
): Promise<{ user: StoredUser; referred: boolean } | null> {
  if (await getUser(email)) return null;
  const now = new Date().toISOString();
  const user: StoredUser = {
    username: email,
    email,
    name: pending.name,
    password: pending.passwordHash,
    dailyLimit: DEFAULT_DAILY_LIMIT,
    questionsUsed: 0,
    isActive: true,
    isVerified: true,
    createdAt: now,
    // Admin onayında kişi henüz giriş yapmadı
    lastSeen: how === 'email' ? now : null,
    notes: how === 'email' ? 'mail ile kayıt' : 'admin onayıyla kayıt',
    ...(pending.consent ? { consent: pending.consent } : {}),
  };
  await saveUser(user);
  await deletePending(email);
  const referred = await applyReferral(pending.ref ?? null, email).catch((e) => {
    console.error('[kayıt] davet ödülü uygulanamadı:', e);
    return false;
  });
  await recordEvent('signup');
  if (referred) await recordEvent('referral');
  return { user, referred };
}
