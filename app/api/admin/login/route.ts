import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { getClientIp, jsonError, readJson } from '@/lib/http';
import { hit, RATE_LIMITS } from '@/lib/rate-limit';
import { startAdminSession } from '@/lib/auth/session';
import { digest } from '@/lib/auth/tokens';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secret = process.env['ADMIN_SECRET']?.trim();
  if (!secret || secret.length < 12) {
    return jsonError(503, 'Admin paneli yapılandırılmamış (ADMIN_SECRET en az 12 karakter olmalı).');
  }

  if (!(await hit('admin-login', getClientIp(request), RATE_LIMITS.ADMIN_LOGIN_IP))) {
    return jsonError(429, 'Çok fazla deneme. 10 dakika sonra tekrar dene.');
  }

  const body = await readJson(request);
  const password = typeof body?.['password'] === 'string' ? body['password'].trim() : '';

  // Sabit uzunluklu özetleri karşılaştır — uzunluk bilgisi sızmaz.
  const ok = timingSafeEqual(Buffer.from(digest(password)), Buffer.from(digest(secret)));
  if (!password || !ok) return jsonError(401, 'Yanlış anahtar');

  const res = NextResponse.json({ success: true });
  await startAdminSession(res);
  return res;
}
