/**
 * /api/admin/pending — doğrulama bekleyen kayıtlar (yalnızca admin çerezi).
 *   GET  → { pending: [{ email, name, at, referred }] }
 *   POST { email, action: 'approve' | 'delete' }
 *        approve → hesabı açar (kişi kayıtta belirlediği şifreyle giriş yapar)
 *        delete  → bekleyen kaydı siler
 */

import { NextResponse } from 'next/server';
import { isValidEmail, jsonError, normalizeEmail, readJson } from '@/lib/http';
import { isAdmin } from '@/lib/auth/session';
import { completeRegistration, deletePending, getPending, listPending } from '@/lib/auth/registration';
import { logAdminAction } from '@/lib/admin/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  return NextResponse.json({ pending: await listPending() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const body = await readJson(req);
  const email = normalizeEmail(body?.['email']);
  const action = body?.['action'];
  if (!isValidEmail(email) || (action !== 'approve' && action !== 'delete')) return jsonError(400, 'Geçersiz istek');

  if (action === 'delete') {
    await deletePending(email);
    await logAdminAction('Bekleyen kayıt silindi', email);
    return NextResponse.json({ success: true });
  }

  const pending = await getPending(email);
  if (!pending) return jsonError(404, 'Bekleyen kayıt bulunamadı (süresi dolmuş olabilir)');
  const done = await completeRegistration(email, pending, 'admin');
  if (!done) {
    await deletePending(email);
    return jsonError(409, 'Bu e-posta zaten kayıtlı');
  }
  await logAdminAction('Kayıt elle onaylandı', email);
  return NextResponse.json({ success: true });
}
