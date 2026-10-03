import { NextResponse } from 'next/server';
import { getClientIp, isValidEmail, jsonError, normalizeEmail, readJson, str } from '@/lib/http';
import { hitAll, RATE_LIMITS } from '@/lib/rate-limit';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { issueCode, type PendingRegistration } from '@/lib/auth/codes';
import { getUser } from '@/lib/auth/users';
import { sendCodeEmail } from '@/lib/email';
import { normalizeReferralCode } from '@/lib/auth/referral';
import { savePending } from '@/lib/auth/registration';
import { LEGAL_VERSION, MIN_AGE } from '@/lib/legal';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return jsonError(400, 'Geçersiz istek');

  const email = normalizeEmail(body['email']);
  const password = typeof body['password'] === 'string' ? body['password'] : '';
  const name = str(body['name'], 40);

  if (!isValidEmail(email)) return jsonError(400, 'Geçerli bir e-posta adresi gir');
  if (name.length < 2) return jsonError(400, 'Adın en az 2 karakter olmalı');
  const pwError = validatePassword(password);
  if (pwError) return jsonError(400, pwError);
  // Onaylar formda ayrı ayrı alınır; sunucu da denetler ve kayda yazar
  if (body['adult'] !== true || body['terms'] !== true) {
    return jsonError(400, `Mentoriva'yı kullanmak için ${MIN_AGE} yaşından büyük olmalı ve Kullanım Şartları'nı kabul etmelisin.`);
  }
  if (body['transfer'] !== true) {
    return jsonError(400, 'Cevapların üretilebilmesi için yurt dışı aktarım onayı gerekli.');
  }

  const allowed = await hitAll([
    ['code-ip', getClientIp(req), RATE_LIMITS.CODE_SEND_IP],
    ['code-email', email, RATE_LIMITS.CODE_SEND_EMAIL],
  ]);
  if (!allowed) return jsonError(429, 'Çok fazla deneme yaptın. Birkaç dakika sonra tekrar dene.');

  if (await getUser(email)) return jsonError(409, 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı dene.');

  const pending: PendingRegistration = {
    name,
    passwordHash: await hashPassword(password),
    ref: normalizeReferralCode(body['ref']),
    consent: { version: LEGAL_VERSION, adult: true, terms: true, transfer: true, at: new Date().toISOString() },
  };
  const code = await issueCode('verify', email, pending);
  // E-posta ulaşmazsa admin panelinden onaylanabilsin diye 7 gün saklanır
  await savePending(email, pending);

  if (!(await sendCodeEmail(email, code, 'verify'))) {
    return jsonError(502, 'Doğrulama kodu şu an gönderilemedi. Birkaç dakika sonra tekrar dene; sorun sürerse bize yaz, hesabını elle açalım.');
  }
  return NextResponse.json({ success: true });
}
