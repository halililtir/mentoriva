/**
 * Admin girişi için e-posta bağlantısı (şifre unutulursa).
 *
 *   POST { send: true }   → yönetici adresine (ADMIN_EMAIL) 15 dakikalık, tek
 *                           kullanımlık bağlantı gönderir. Cevap her durumda
 *                           aynıdır (adres ya da yapılandırma sızmasın).
 *   POST { token }        → bağlantıdaki izni tüketir ve admin oturumu açar.
 *
 * Bağlantı GET ile oturum açmaz: e-posta tarayıcıları bağlantıları önceden
 * açabildiği için izin, /admin sayfası açıldığında POST ile tüketilir.
 */

import { NextResponse } from 'next/server';
import { jsonError, getClientIp, readJson } from '@/lib/http';
import { hit, RATE_LIMITS } from '@/lib/rate-limit';
import { getKV } from '@/lib/kv';
import { digest, newToken } from '@/lib/auth/tokens';
import { startAdminSession } from '@/lib/auth/session';
import { sendEmailDetailed } from '@/lib/email';
import { logAdminAction } from '@/lib/admin/audit';
import { SITE_URL } from '@/lib/site';

export const runtime = 'nodejs';

const TTL = 15 * 60;
const key = (token: string) => `admin-magic:${digest(token)}`;
const SENT = 'Kayıtlı yönetici adresi tanımlıysa giriş bağlantısı gönderildi. E-postanı kontrol et (15 dakika geçerli).';

export async function POST(req: Request) {
  if (!(await hit('admin-magic', getClientIp(req), RATE_LIMITS.ADMIN_LOGIN_IP))) {
    return jsonError(429, 'Çok fazla deneme. 10 dakika sonra tekrar dene.');
  }
  const body = await readJson(req);

  if (typeof body?.['token'] === 'string') {
    const token = body['token'];
    if (!/^[A-Za-z0-9_-]{20,200}$/.test(token)) return jsonError(400, 'Geçersiz bağlantı');
    const kv = getKV();
    if (!(await kv.get(key(token)))) return jsonError(401, 'Bağlantının süresi dolmuş ya da kullanılmış. Yeni bir bağlantı iste.');
    await kv.del(key(token));
    const res = NextResponse.json({ success: true });
    await startAdminSession(res);
    await logAdminAction('admin-login', 'e-posta bağlantısı').catch(() => {});
    return res;
  }

  if (body?.['send'] === true) {
    const to = process.env['ADMIN_EMAIL']?.trim();
    if (to) {
      const token = newToken();
      await getKV().set(key(token), '1', { ex: TTL });
      const link = `${SITE_URL}/admin?giris=${encodeURIComponent(token)}`;
      await sendEmailDetailed({
        to,
        subject: 'Mentoriva admin girişi',
        text: `Admin paneline girmek için bu bağlantıyı aç (15 dakika geçerli, tek kullanımlık):\n${link}\n\nBunu sen istemediysen yok say; bağlantı kendiliğinden geçersiz olur.`,
        html: `<p>Admin paneline girmek için bağlantıyı aç (15 dakika geçerli, tek kullanımlık):</p><p><a href="${link}">Admin paneline gir</a></p><p style="color:#667085;font-size:13px">Bunu sen istemediysen yok say; bağlantı kendiliğinden geçersiz olur.</p>`,
      });
    }
    return NextResponse.json({ success: true, message: SENT });
  }

  return jsonError(400, 'Geçersiz istek');
}
