import { NextResponse } from 'next/server';
import { isValidEmail, jsonError, normalizeEmail, readJson, str } from '@/lib/http';
import { CODE_ERROR_MESSAGES, consumeCode, type PendingRegistration } from '@/lib/auth/codes';
import { toPublicUser } from '@/lib/auth/users';
import { startUserSession } from '@/lib/auth/session';
import { completeRegistration } from '@/lib/auth/registration';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return jsonError(400, 'Geçersiz istek');

  const email = normalizeEmail(body['email']);
  const code = str(body['code'], 6);
  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) return jsonError(400, 'E-posta ve 6 haneli kod gerekli');

  const result = await consumeCode<PendingRegistration>('verify', email, code);
  if (!result.ok) return jsonError(400, CODE_ERROR_MESSAGES[result.reason], result.reason);

  const done = await completeRegistration(email, result.payload, 'email');
  if (!done) return jsonError(409, 'Bu e-posta zaten kayıtlı. Giriş yapmayı dene.');

  const res = NextResponse.json({ success: true, referred: done.referred, user: await toPublicUser(done.user) });
  await startUserSession(res, email);
  return res;
}
