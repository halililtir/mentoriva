import { NextResponse } from 'next/server';
import { getKV } from '@/lib/kv';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '').trim();
    const name = String(body.name ?? '').trim();

    if (!email || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 });
    }
    if (name.length < 3) {
      return NextResponse.json({ error: 'Kullanıcı adı en az 3 karakter olmalı' }, { status: 400 });
    }

    const kv = getKV();

    // Email zaten kayıtlı mı
    if (kv) {
      const existing = await kv.get(`user:${email}`);
      if (existing) {
        return NextResponse.json({ error: 'Bu e-posta adresi zaten kayıtlı' }, { status: 409 });
      }
    }

    // IP bazlı kayıt limiti (günde 2 hesap)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (kv) {
      const today = new Date().toISOString().slice(0, 10);
      const ipKey = `reg-ip:${ip}:${today}`;
      const regCount = await kv.incr(ipKey);
      if (regCount === 1) await kv.expire(ipKey, 86400);
      if (regCount > 2) {
        return NextResponse.json({ error: 'Bugün çok fazla kayıt denemesi yapıldı. Yarın tekrar deneyin.' }, { status: 429 });
      }
    }

    // 6 haneli doğrulama kodu
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Geçici kayıt (10 dakika TTL)
    if (kv) {
      await kv.set(`verify:${email}`, JSON.stringify({ email, password, name, code }), { ex: 600 });
    }

    // Gmail SMTP ile mail gönder
    const smtpUser = process.env['SMTP_USER'];
    const smtpPass = process.env['SMTP_PASS'];

    if (smtpUser && smtpPass) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"Mentoriva" <${smtpUser}>`,
          to: email,
          subject: 'Mentoriva - Doğrulama Kodu',
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 420px; margin: 0 auto; padding: 32px; background: #0a0e1a; color: #e0e0e0; border-radius: 16px;">
              <h2 style="color: #5ce1e6; margin: 0 0 4px 0; font-size: 20px;">Mentoriva</h2>
              <p style="color: #666; font-size: 13px; margin: 0 0 24px 0;">Düşünce meclisine hoş geldin.</p>
              <div style="background: #12182a; border: 1px solid #1a2340; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                <p style="color: #888; font-size: 13px; margin: 0 0 12px 0;">Doğrulama kodun:</p>
                <p style="font-size: 36px; font-weight: bold; color: #5ce1e6; letter-spacing: 8px; margin: 0;">${code}</p>
              </div>
              <p style="color: #444; font-size: 11px; margin: 0;">Bu kod 10 dakika geçerlidir. Eğer bu kaydı sen yapmadıysan bu maili görmezden gelebilirsin.</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.error('[Auth] Gmail SMTP hatası:', mailErr);
        return NextResponse.json({ error: 'Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.' }, { status: 500 });
      }
    } else {
      console.log('[Auth] SMTP ayarları yok. Doğrulama kodu:', code, 'Email:', email);
    }

    return NextResponse.json({ success: true, message: 'Doğrulama kodu gönderildi' });
  } catch (e) {
    console.error('[Auth Register]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
