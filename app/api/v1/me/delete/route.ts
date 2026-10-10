/**
 * POST /api/v1/me/delete — kullanıcı kendi hesabını ve ona bağlı bütün
 * kişisel verileri siler. Şifresini yeniden ister; işlem geri alınamaz.
 * Request: { password }
 */

import { NextResponse } from 'next/server';
import { endUserSession, getSessionUser } from '@/lib/auth/session';
import { verifyPassword } from '@/lib/auth/password';
import { deleteUser } from '@/lib/auth/users';
import { hit } from '@/lib/rate-limit';
import { RATE_LIMITS } from '@/lib/features';
import { jsonError, readJson } from '@/lib/http';
import { recordEvent } from '@/lib/admin/metrics';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  if (!(await hit('login-email', user.username, RATE_LIMITS.LOGIN_EMAIL))) {
    return jsonError(429, 'Çok fazla deneme. Birkaç dakika sonra tekrar dene.');
  }
  const body = await readJson(req);
  const password = typeof body?.['password'] === 'string' ? body['password'] : '';
  let check = await verifyPassword(password, user.password);
  if (!check.ok && check.needsRehash) check = await verifyPassword(password.trim(), user.password);
  if (!check.ok) return jsonError(401, 'Şifre hatalı');

  await deleteUser(user.username);
  await recordEvent('account_deleted');
  const res = NextResponse.json({ success: true });
  await endUserSession(req, res);
  return res;
}
