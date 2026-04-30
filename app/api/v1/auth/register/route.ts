import { NextResponse } from 'next/server';
import { getKV } from '@/lib/kv';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '').trim();
    const name = String(body.name ?? '').trim();

    // Validasyon
    if (!email || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin' }, { status: 400 });
    }
    if (password.length < 4) {
      return NextResponse.json({ error: 'Şifre en az 4 karakter olmalı' }, { status: 400 });
    }
    if (name.length < 2) {
      return NextResponse.json({ error: 'İsim en az 2 karakter olmalı' }, { status: 400 });
    }

    const kv = getKV();

    // Email zaten kayıtlı mı kontrol et
    if (kv) {
      const existing = await kv.get(`user:${email}`);
      if (existing) {
        return NextResponse.json({ error: 'Bu e-posta adresi zaten kayıtlı' }, { status: 409 });
      }
    }

    // 6 haneli doğrulama kodu oluştur
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Geçici kayıt verisi (10 dakika TTL)
    if (kv) {
      await kv.set(`verify:${email}`, JSON.stringify({ email, password, name, code }), { ex: 600 });
    }

    // Resend ile mail gönder
    const resendKey = process.env['RESEND_API_KEY'];
    if (resendKey) {
      try {
        const { Resend } = require('resend');
        const resend = new Resend(resendKey);

        await resend.emails.send({
          from: 'Mentoriva <onboarding@resend.dev>',
          to: email,
          subject: 'Mentoriva - Doğrulama Kodu',
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 30px; background: #0a0e1a; color: #e0e0e0; border-radius: 12px;">
              <h2 style="color: #5ce1e6; margin-bottom: 8px;">Mentoriva</h2>
              <p style="color: #888; font-size: 14px;">Düşünce meclisine hoş geldin.</p>
              <div style="background: #12182a; border: 1px solid #1a2340; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="color: #888; font-size: 13px; margin-bottom: 8px;">Doğrulama kodun:</p>
                <p style="font-size: 32px; font-weight: bold; color: #5ce1e6; letter-spacing: 6px; margin: 0;">${code}</p>
              </div>
              <p style="color: #555; font-size: 12px;">Bu kod 10 dakika geçerlidir. Eğer bu kaydı sen yapmadıysan bu maili görmezden gelebilirsin.</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.error('[Auth] Mail gönderme hatası:', mailErr);
        // Mail gönderilemese bile kodu KV'ye kaydettik, kullanıcıya hata vermeyelim
        // Development'ta console'da kodu görebiliriz
      }
    } else {
      console.log('[Auth] RESEND_API_KEY yok. Doğrulama kodu:', code, 'Email:', email);
    }

    return NextResponse.json({ success: true, message: 'Doğrulama kodu gönderildi' });
  } catch (e) {
    console.error('[Auth Register]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
