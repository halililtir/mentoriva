import { NextResponse } from 'next/server';
import { getClientIp, isValidEmail, jsonError, normalizeEmail, readJson } from '@/lib/http';
import { hitAll, RATE_LIMITS } from '@/lib/rate-limit';
import { issueCode } from '@/lib/auth/codes';
import { getUser } from '@/lib/auth/users';
import { sendCodeEmail } from '@/lib/email';

export const runtime = 'nodejs';

/**
 * Hesap var olsun ya da olmasın aynı yanıt döner — bir e-postanın kayıtlı
 * olup olmadığı bu uçtan öğrenilemez.
 */
export async function POST(req: Request) {
  const body = await readJson(req);
  const email = normalizeEmail(body?.['email']);
  if (!isValidEmail(email)) return jsonError(400, 'Geçerli bir e-posta adresi gir');

  const allowed = await hitAll([
    ['code-ip', getClientIp(req), RATE_LIMITS.CODE_SEND_IP],
    ['code-email', email, RATE_LIMITS.CODE_SEND_EMAIL],
  ]);
  if (!allowed) return jsonError(429, 'Çok fazla deneme yaptın. Birkaç dakika sonra tekrar dene.');

  const user = await getUser(email);
  if (user?.isActive) {
    const code = await issueCode('reset', email, null);
    await sendCodeEmail(email, code, 'reset');
  }
  return NextResponse.json({ success: true });
}
