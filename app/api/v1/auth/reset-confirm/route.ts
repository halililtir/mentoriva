import { NextResponse } from 'next/server';
import { isValidEmail, jsonError, normalizeEmail, readJson, str } from '@/lib/http';
import { CODE_ERROR_MESSAGES, consumeCode } from '@/lib/auth/codes';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { getUser, saveUser, toPublicUser } from '@/lib/auth/users';
import { startUserSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return jsonError(400, 'Geçersiz istek');

  const email = normalizeEmail(body['email']);
  const code = str(body['code'], 6);
  const password = typeof body['password'] === 'string' ? body['password'] : '';
  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) return jsonError(400, 'E-posta ve 6 haneli kod gerekli');
  const pwError = validatePassword(password);
  if (pwError) return jsonError(400, pwError);

  const result = await consumeCode<null>('reset', email, code);
  if (!result.ok) return jsonError(400, CODE_ERROR_MESSAGES[result.reason], result.reason);

  const user = await getUser(email);
  if (!user || !user.isActive) return jsonError(400, CODE_ERROR_MESSAGES.expired);

  user.password = await hashPassword(password);
  user.lastSeen = new Date().toISOString();
  await saveUser(user);

  const res = NextResponse.json({ success: true, user: await toPublicUser(user) });
  await startUserSession(res, email);
  return res;
}
