/**
 * E-posta gönderimi — Resend HTTP API.
 *
 * RESEND_FROM, Resend panelinde doğrulanmış bir alan adından olmalı
 * (ör. "Mentoriva <noreply@mentoriva.com.tr>"). Varsayılan `onboarding@resend.dev`
 * Resend'in deneme göndericisidir ve yalnızca hesap sahibinin adresine teslim eder.
 *
 * RESEND_API_KEY yoksa geliştirme ortamında kod konsola yazılır; production'da
 * gönderim başarısız sayılır.
 */

import type { CodePurpose } from '@/lib/auth/codes';

const DEFAULT_FROM = 'Mentoriva <onboarding@resend.dev>';

const COPY: Record<CodePurpose, { subject: string; intro: string }> = {
  verify: { subject: 'Mentoriva — Doğrulama kodun', intro: 'Mentoriva’ya hoş geldin. Hesabını doğrulamak için kodun:' },
  reset: { subject: 'Mentoriva — Şifre sıfırlama kodun', intro: 'Şifreni sıfırlamak için kodun:' },
};

export async function sendCodeEmail(to: string, code: string, purpose: CodePurpose): Promise<boolean> {
  const apiKey = process.env['RESEND_API_KEY'];
  const { subject, intro } = COPY[purpose];

  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Email] RESEND_API_KEY yok (geliştirme). ${purpose} kodu → ${to}: ${code}`);
      return true;
    }
    console.error('[Email] RESEND_API_KEY tanımlı değil');
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: process.env['RESEND_FROM']?.trim() || DEFAULT_FROM,
        to: [to],
        subject,
        text: `${intro} ${code}\n\nKod 10 dakika geçerlidir. Bu isteği sen yapmadıysan e-postayı yok sayabilirsin.`,
        html: codeEmailHtml(intro, code),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[Email] Resend hatası:', res.status, body.slice(0, 300));
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Email] Gönderim hatası:', e);
    return false;
  }
}

function codeEmailHtml(intro: string, code: string): string {
  return `
  <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:440px;margin:0 auto;padding:32px;background:#070b14;color:#e6e8ee;border-radius:16px">
    <p style="margin:0 0 4px;font-size:20px;font-weight:600;color:#f0f2f5">mentor<span style="color:#00bcd4">iva</span></p>
    <p style="margin:0 0 24px;color:#8a92a4;font-size:13px">${intro}</p>
    <div style="background:#0f1528;border:1px solid #1c2440;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
      <p style="margin:0;font-size:34px;font-weight:700;color:#33d4dc;letter-spacing:8px">${code}</p>
    </div>
    <p style="margin:0;color:#4a5165;font-size:11px">Kod 10 dakika geçerlidir. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.</p>
  </div>`;
}
