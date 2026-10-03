/**
 * Sunucu tarafı oturumlar.
 *
 * Tarayıcıda yalnızca httpOnly bir çerez durur (JavaScript okuyamaz).
 * Redis'te token'ın SHA-256 özeti tutulur; çerez çalınsa bile depo
 * sızıntısından oturum üretilemez.
 *
 *   session:<sha256(token)>        → kullanıcı adı (TTL 30 gün)
 *   admin-session:<sha256(token)>  → '1'           (TTL 12 saat)
 */

import type { NextResponse } from 'next/server';
import { getKV } from '@/lib/kv';
import { digest, newToken } from '@/lib/auth/tokens';
import { getUser, type StoredUser } from '@/lib/auth/users';

export const USER_COOKIE = 'mentoriva_session';
export const ADMIN_COOKIE = 'mentoriva_admin';

const USER_TTL = 60 * 60 * 24 * 30;
const ADMIN_TTL = 60 * 60 * 12;

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

// -----------------------------------------------------------
// Kullanıcı oturumu
// -----------------------------------------------------------

export async function startUserSession(res: NextResponse, username: string): Promise<void> {
  const token = newToken();
  await getKV().set(`session:${digest(token)}`, username, { ex: USER_TTL });
  res.cookies.set(USER_COOKIE, token, cookieOptions(USER_TTL));
}

export async function endUserSession(request: Request, res: NextResponse): Promise<void> {
  const token = readCookie(request, USER_COOKIE);
  if (token) await getKV().del(`session:${digest(token)}`);
  res.cookies.set(USER_COOKIE, '', cookieOptions(0));
}

/** Geçerli, aktif kullanıcıyı döner; yoksa null. */
export async function getSessionUser(request: Request): Promise<StoredUser | null> {
  const token = readCookie(request, USER_COOKIE);
  if (!token) return null;
  const username = await getKV().get<string>(`session:${digest(token)}`);
  if (!username) return null;
  const user = await getUser(String(username));
  return user && user.isActive ? user : null;
}

// -----------------------------------------------------------
// Admin oturumu
// -----------------------------------------------------------

export async function startAdminSession(res: NextResponse): Promise<void> {
  const token = newToken();
  await getKV().set(`admin-session:${digest(token)}`, '1', { ex: ADMIN_TTL });
  res.cookies.set(ADMIN_COOKIE, token, cookieOptions(ADMIN_TTL));
}

export async function endAdminSession(request: Request, res: NextResponse): Promise<void> {
  const token = readCookie(request, ADMIN_COOKIE);
  if (token) await getKV().del(`admin-session:${digest(token)}`);
  res.cookies.set(ADMIN_COOKIE, '', cookieOptions(0));
}

export async function isAdmin(request: Request): Promise<boolean> {
  const token = readCookie(request, ADMIN_COOKIE);
  if (!token) return false;
  return (await getKV().get(`admin-session:${digest(token)}`)) !== null;
}
