import { NextResponse } from 'next/server';
import { isValidEmail, jsonError, normalizeEmail, readJson, str } from '@/lib/http';
import { CODE_ERROR_MESSAGES, consumeCode, type PendingRegistration } from '@/lib/auth/codes';
import { DEFAULT_DAILY_LIMIT, getUser, saveUser, toPublicUser, type StoredUser } from '@/lib/auth/users';
import { startUserSession } from '@/lib/auth/session';
import { applyReferral } from '@/lib/auth/referral';
import { recordEvent } from '@/lib/admin/metrics';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return jsonError(400, 'Geçersiz istek');

  const email = normalizeEmail(body['email']);
  const code = str(body['code'], 6);
  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) return jsonError(400, 'E-posta ve 6 haneli kod gerekli');

  const result = await consumeCode<PendingRegistration>('verify', email, code);
  if (!result.ok) return jsonError(400, CODE_ERROR_MESSAGES[result.reason], result.reason);

  if (await getUser(email)) return jsonError(409, 'Bu e-posta zaten kayıtlı. Giriş yapmayı dene.');

  const now = new Date().toISOString();
  const user: StoredUser = {
    username: email,
    email,
    name: result.payload.name,
    password: result.payload.passwordHash,
    dailyLimit: DEFAULT_DAILY_LIMIT,
    questionsUsed: 0,
    isActive: true,
    isVerified: true,
    createdAt: now,
    lastSeen: now,
    notes: 'mail ile kayıt',
  };
  await saveUser(user);
  const referred = await applyReferral(result.payload.ref ?? null, email).catch((e) => {
    console.error('[verify] davet ödülü uygulanamadı:', e);
    return false;
  });

  const res = NextResponse.json({ success: true, referred, user: await toPublicUser(user) });
  await recordEvent('signup');
  if (referred) await recordEvent('referral');
  await startUserSession(res, email);
  return res;
}
