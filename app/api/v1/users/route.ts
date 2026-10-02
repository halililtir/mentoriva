/**
 * /api/v1/users — yalnızca admin.
 *
 * Kullanıcı girişi/kaydı artık /api/v1/auth/* altında.
 */

import { NextResponse } from 'next/server';
import { isValidEmail, jsonError, normalizeEmail, readJson, str } from '@/lib/http';
import { isAdmin } from '@/lib/auth/session';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import {
  DEFAULT_DAILY_LIMIT,
  dailyLimitOf,
  deleteUser,
  getUsedToday,
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
  const rows = await Promise.all(
    users.map(async (u) => ({
      ...withoutPassword(u),
      dailyLimit: dailyLimitOf(u),
      usedToday: await getUsedToday(u.username),
    })),
  );
  return NextResponse.json({ users: rows, total: rows.length });
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
  return NextResponse.json({ success: true, user: withoutPassword(user) });
}

/* ---- PUT: güncelle ---- */
export async function PUT(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const body = await readJson(req);
  if (!body) return jsonError(400, 'Geçersiz istek');

  const user = await getUser(normalizeEmail(body['username']));
  if (!user) return jsonError(404, 'Kullanıcı bulunamadı');

  if ('password' in body) {
    const password = typeof body['password'] === 'string' ? body['password'] : '';
    const pwError = validatePassword(password);
    if (pwError) return jsonError(400, pwError);
    user.password = await hashPassword(password);
  }
  if ('dailyLimit' in body) {
    const limit = parseLimit(body['dailyLimit']);
    if (limit === null) return jsonError(400, 'Günlük limit 0–1000 arası bir tam sayı olmalı');
    user.dailyLimit = limit;
    delete user.questionLimit;
  }
  if ('isActive' in body) user.isActive = Boolean(body['isActive']);
  if ('notes' in body) user.notes = str(body['notes'], 200);

  await saveUser(user);
  if (body['resetToday'] === true) await resetUsageToday(user.username);

  return NextResponse.json({ success: true, user: withoutPassword(user) });
}

/* ---- DELETE ---- */
export async function DELETE(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const username = normalizeEmail(new URL(req.url).searchParams.get('username'));
  if (!username) return jsonError(400, 'username gerekli');
  await deleteUser(username);
  return NextResponse.json({ success: true });
}
