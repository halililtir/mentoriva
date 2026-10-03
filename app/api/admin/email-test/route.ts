/**
 * POST /api/admin/email-test { to } — e-posta ayarlarını denemek için örnek
 * doğrulama e-postası gönderir (yalnızca admin çerezi). Gerçek bir kod üretmez.
 */

import { NextResponse } from 'next/server';
import { isValidEmail, jsonError, normalizeEmail, readJson } from '@/lib/http';
import { isAdmin } from '@/lib/auth/session';
import { emailFrom, sendEmailDetailed } from '@/lib/email';
import { logAdminAction } from '@/lib/admin/audit';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const body = await readJson(req);
  const to = normalizeEmail(body?.['to']);
  if (!isValidEmail(to)) return jsonError(400, 'Geçerli bir e-posta gir');

  const result = await sendEmailDetailed({
    to,
    subject: 'Mentoriva — deneme e-postası',
    text: 'Bu bir deneme e-postasıdır. Bunu görüyorsan Mentoriva e-posta ayarları çalışıyor.',
    html: '<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:480px;margin:24px auto;padding:24px;border:1px solid #dde6ec;border-radius:16px"><p style="margin:0;font-size:20px;font-weight:600">mentor<span style="color:#00838f">iva</span></p><p style="margin:16px 0 0;color:#475467;font-size:15px;line-height:1.6">Bu bir deneme e-postasıdır. Bunu görüyorsan e-posta ayarları çalışıyor. ✓</p></div>',
  });
  await logAdminAction('Deneme e-postası', to, result.ok ? 'gönderildi' : result.reason);
  if (!result.ok) return jsonError(502, result.reason);
  return NextResponse.json({ success: true, from: emailFrom() });
}
