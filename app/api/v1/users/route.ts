/**
 * /api/v1/users — yalnızca admin.
 *
 * GET    → tüm üyeler (parolasız) + bugünkü kullanım, bonus, davet sayısı
 * POST   → yeni üye (doğrulanmış olarak)
 * PUT    → { username, dailyLimit?, isActive?, notes?, password?, resetToday?, addBonus?, grantBadge?, revokeBadge? }
 * DELETE → ?username=… (üyeye bağlı tüm kişisel veriyle birlikte)
 *
 * Her değişiklik admin işlem kaydına yazılır (lib/admin/audit.ts).
 * Kullanıcı girişi/kaydı /api/v1/auth/* altında.
 */

import { NextResponse } from 'next/server';
import { isValidEmail, jsonError, normalizeEmail, readJson, str } from '@/lib/http';
import { isAdmin } from '@/lib/auth/session';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { addBonus } from '@/lib/auth/bonus';
import { getMany } from '@/lib/kv';
import { todayKey } from '@/lib/time';
import { logAdminAction } from '@/lib/admin/audit';
import { BADGE_BY_ID, GRANTABLE, getBadges, giveBadge, removeBadge } from '@/lib/badges';
import {
  DEFAULT_DAILY_LIMIT,
  dailyLimitOf,
  deleteUser,
  getUser,
  listUsers,
  resetUsageToday,
  saveUser,
  withoutPassword,
  type StoredUser,
} from '@/lib/auth/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseLimit(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 1000 ? n : null;
}

/* ---- GET: liste ---- */
export async function GET(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const users = await listUsers();
  const day = todayKey();
  // Kullanıcı başına ayrı istek yerine üç toplu okuma
  const [usage, bonus, refs, badges] = await Promise.all([
    getMany<number | string>(users.map((u) => `usage:${u.username}:${day}`)),
    getMany<number | string>(users.map((u) => `bonus:${u.username}`)),
    getMany<number | string>(users.map((u) => `ref-count:${u.username}`)),
    Promise.all(users.map((u) => getBadges(u.username).catch(() => []))),
  ]);
  const rows = users.map((u, i) => ({
    ...withoutPassword(u),
    dailyLimit: dailyLimitOf(u),
    usedToday: Number(usage[i]) || 0,
    bonus: Number(bonus[i]) || 0,
    referrals: Number(refs[i]) || 0,
    badges: (badges[i] ?? []).map((b) => b.id),
  }));
  return NextResponse.json({ users: rows, total: rows.length }, { headers: { 'Cache-Control': 'no-store' } });
}

/* ---- POST: yeni kullanıcı ---- */
export async function POST(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const body = await readJson(req);
  if (!body) return jsonError(400, 'Geçersiz istek');

  const username = normalizeEmail(body['username']);
  const password = typeof body['password'] === 'string' ? body['password'] : '';
  if (!isValidEmail(username)) return jsonError(400, 'Geçerli bir e-posta gir');
  const pwError = validatePassword(password);
  if (pwError) return jsonError(400, pwError);
  if (await getUser(username)) return jsonError(409, 'Bu kullanıcı zaten var');

  const now = new Date().toISOString();
  const user: StoredUser = {
    username,
    email: username,
    name: str(body['name'], 40) || undefined,
    password: await hashPassword(password),
    dailyLimit: parseLimit(body['dailyLimit']) ?? DEFAULT_DAILY_LIMIT,
    questionsUsed: 0,
    isActive: true,
    isVerified: true,
    createdAt: now,
    lastSeen: null,
    notes: str(body['notes'], 200),
  };
  await saveUser(user);
  await logAdminAction('Üye oluşturuldu', username, `günlük ${user.dailyLimit}`);
  return NextResponse.json({ success: true, user: withoutPassword(user) });
}

/* ---- PUT: güncelle ---- */
export async function PUT(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const body = await readJson(req);
  if (!body) return jsonError(400, 'Geçersiz istek');

  const user = await getUser(normalizeEmail(body['username']));
  if (!user) return jsonError(404, 'Kullanıcı bulunamadı');

  // Önce hepsini doğrula, sonra yaz: yarım kalmış güncelleme olmasın
  let bonusAmount = 0;
  if ('addBonus' in body) {
    const n = Number(body['addBonus']);
    if (!Number.isInteger(n) || n < 1 || n > 500) return jsonError(400, 'Bonus 1–500 arası bir tam sayı olmalı');
    bonusAmount = n;
  }
  const grant = typeof body['grantBadge'] === 'string' ? body['grantBadge'] : null;
  const revoke = typeof body['revokeBadge'] === 'string' ? body['revokeBadge'] : null;
  if (grant && !GRANTABLE.includes(grant)) return jsonError(400, 'Bu işaret elle verilemez');
  if (revoke && !BADGE_BY_ID[revoke]) return jsonError(400, 'Bilinmeyen işaret');

  let newLimit: number | null = null;
  if ('dailyLimit' in body) {
    newLimit = parseLimit(body['dailyLimit']);
    if (newLimit === null) return jsonError(400, 'Günlük limit 0–1000 arası bir tam sayı olmalı');
  }
  let newPassword: string | null = null;
  if ('password' in body) {
    const password = typeof body['password'] === 'string' ? body['password'] : '';
    const pwError = validatePassword(password);
    if (pwError) return jsonError(400, pwError);
    newPassword = await hashPassword(password);
  }

  const changes: string[] = [];
  if (newPassword) { user.password = newPassword; changes.push('şifre değişti'); }
  if (newLimit !== null && newLimit !== dailyLimitOf(user)) {
    changes.push(`günlük limit ${dailyLimitOf(user)} → ${newLimit}`);
    user.dailyLimit = newLimit;
    delete user.questionLimit;
  }
  if ('isActive' in body) {
    const active = Boolean(body['isActive']);
    if (active !== user.isActive) changes.push(active ? 'aktif edildi' : 'donduruldu');
    user.isActive = active;
  }
  if ('notes' in body) {
    const notes = str(body['notes'], 200);
    if (notes !== (user.notes ?? '')) changes.push('not güncellendi');
    user.notes = notes;
  }

  await saveUser(user);
  if (body['resetToday'] === true) { await resetUsageToday(user.username); changes.push('bugünkü kullanım sıfırlandı'); }
  if (bonusAmount) { await addBonus(user.username, bonusAmount); changes.push(`+${bonusAmount} bonus`); }
  if (grant && (await giveBadge(user.username, grant, 'admin'))) changes.push(`işaret verildi: ${BADGE_BY_ID[grant]!.name}`);
  if (revoke && (await removeBadge(user.username, revoke))) changes.push(`işaret geri alındı: ${BADGE_BY_ID[revoke]!.name}`);

  if (changes.length) await logAdminAction('Üye güncellendi', user.username, changes.join(', '));
  return NextResponse.json({ success: true, user: withoutPassword(user), changes });
}

/* ---- DELETE ---- */
export async function DELETE(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const username = normalizeEmail(new URL(req.url).searchParams.get('username'));
  if (!username) return jsonError(400, 'username gerekli');
  if (!(await getUser(username))) return jsonError(404, 'Kullanıcı bulunamadı');
  await deleteUser(username);
  await logAdminAction('Üye silindi', username);
  return NextResponse.json({ success: true });
}
