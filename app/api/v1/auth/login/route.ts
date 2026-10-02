import { NextResponse } from 'next/server';
import { getClientIp, jsonError, normalizeEmail, readJson } from '@/lib/http';
import { hitAll, RATE_LIMITS } from '@/lib/rate-limit';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { getUser, saveUser, toPublicUser } from '@/lib/auth/users';
import { startUserSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return jsonError(400, 'Geçersiz istek');

  const email = normalizeEmail(body['email']);
  const password = typeof body['password'] === 'string' ? body['password'] : '';
  if (!email || !password) return jsonError(400, 'E-posta ve şifre gerekli');

  const allowed = await hitAll([
    ['login-ip', getClientIp(req), RATE_LIMITS.LOGIN_IP],
    ['login-email', email, RATE_LIMITS.LOGIN_EMAIL],
  ]);
  if (!allowed) return jsonError(429, 'Çok fazla giriş denemesi. Birkaç dakika sonra tekrar dene.');

  const user = await getUser(email);
  // Eski kayıtlar şifreyi trim'lenmiş ve düz metin saklıyordu; onlar için trim'li hali de denenir.
  let check = await verifyPassword(password, user?.password);
  if (!check.ok && check.needsRehash) check = await verifyPassword(password.trim(), user?.password);
  if (!user || !check.ok) return jsonError(401, 'E-posta veya şifre hatalı');
  if (!user.isActive) return jsonError(403, 'Hesabın şu an pasif. Destek için info@mentoriva.com.tr');

  if (check.needsRehash) user.password = await hashPassword(password);
  user.lastSeen = new Date().toISOString();
  await saveUser(user);

  const res = NextResponse.json({ success: true, user: await toPublicUser(user) });
  await startUserSession(res, user.username);
  return res;
}
