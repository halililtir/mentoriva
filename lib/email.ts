/**
 * E-posta gönderimi — Resend HTTP API.
 *
 * RESEND_FROM, Resend panelinde doğrulanmış bir alan adından olmalı
 * (ör. "Mentoriva <dogrulama@mentoriva.com.tr>"). Varsayılan `onboarding@resend.dev`
 * Resend'in deneme göndericisidir ve YALNIZCA Resend hesabının sahibine teslim eder;
 * gerçek kullanıcılara kod gitmez.
 *
 * RESEND_API_KEY yoksa geliştirme ortamında içerik konsola yazılır; production'da
 * gönderim başarısız sayılır. Başarısız gönderimler admin "Hatalar" listesine düşer.
 */

import type { CodePurpose } from '@/lib/auth/codes';
import { logError } from '@/lib/admin/errors';
import { SITE_URL } from '@/lib/site';

const DEFAULT_FROM = 'Mentoriva <onboarding@resend.dev>';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export type SendResult = { ok: true } | { ok: false; reason: string };

/** Gönderici adresi (gösterim ve sağlık kontrolü için). */
export function emailFrom(): string {
  return process.env['RESEND_FROM']?.trim() || DEFAULT_FROM;
}

/** Tek bir e-posta gönderir; hata fırlatmaz. */
export async function sendEmailDetailed({ to, subject, text, html }: EmailMessage): Promise<SendResult> {
  const apiKey = process.env['RESEND_API_KEY'];

  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Email] RESEND_API_KEY yok (geliştirme). "${subject}" → ${to}\n${text}`);
      return { ok: true };
    }
    const reason = 'RESEND_API_KEY tanımlı değil';
    await logError('server', 'email', reason);
    return { ok: false, reason };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from: emailFrom(), to: [to], subject, text, html }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string; name?: string } | null;
      const reason = `Resend ${res.status}: ${body?.message ?? body?.name ?? 'bilinmeyen hata'}`;
      console.error('[Email]', reason);
      await logError('server', 'email', reason);
      return { ok: false, reason };
    }
    return { ok: true };
  } catch (e) {
    console.error('[Email] Gönderim hatası:', e);
    await logError('server', 'email', e);
    return { ok: false, reason: 'E-posta servisine ulaşılamadı' };
  }
}

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  return (await sendEmailDetailed(message)).ok;
}

// -----------------------------------------------------------
// Doğrulama ve şifre sıfırlama kodları
// -----------------------------------------------------------

const COPY: Record<CodePurpose, { subject: (code: string) => string; title: string; intro: string; foot: string }> = {
  verify: {
    subject: (code) => `${code} — Mentoriva doğrulama kodun`,
    title: 'Hoş geldin',
    intro: 'Mentoriva hesabını oluşturmak için aşağıdaki kodu kayıt ekranına yaz.',
    foot: 'Bu kaydı sen başlatmadıysan bu e-postayı yok sayabilirsin; hesap oluşturulmaz.',
  },
  reset: {
    subject: (code) => `${code} — Mentoriva şifre sıfırlama kodun`,
    title: 'Şifreni sıfırla',
    intro: 'Yeni şifreni belirlemek için aşağıdaki kodu kullan.',
    foot: 'Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; şifren değişmez.',
  },
};

export async function sendCodeEmail(to: string, code: string, purpose: CodePurpose): Promise<boolean> {
  const c = COPY[purpose];
  return sendEmail({
    to,
    subject: c.subject(code),
    text: `${c.title}\n\n${c.intro}\n\nKodun: ${code}\n\nKod 10 dakika geçerlidir.\n${c.foot}\n\nMentoriva · ${SITE_URL}`,
    html: codeEmailHtml(c.title, c.intro, code, c.foot),
  });
}

/**
 * Tablo tabanlı, satır içi stilli şablon: Gmail, Outlook ve Apple Mail'de
 * aynı görünür; açık ve koyu modda okunur (açık zemin, koyu metin).
 */
function codeEmailHtml(title: string, intro: string, code: string, foot: string): string {
  const digits = code.split('').map((d) => `<td style="padding:0 3px"><div style="width:44px;height:56px;line-height:56px;border-radius:10px;background:#f1f7fa;border:1px solid #d6e6ee;font:600 28px/56px 'Courier New',monospace;color:#0b3b45;text-align:center">${d}</div></td>`).join('');
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light only"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#eef3f6">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">Kodun: ${code} · 10 dakika geçerli</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3f6;padding:32px 12px">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:18px;border:1px solid #dde6ec;overflow:hidden">
      <tr><td style="height:4px;background:linear-gradient(90deg,#00838f,#d4a574)"></td></tr>
      <tr><td style="padding:32px 32px 8px;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif">
        <p style="margin:0;font-size:20px;font-weight:600;color:#14181f;letter-spacing:-0.3px">mentor<span style="color:#00838f">iva</span></p>
        <h1 style="margin:24px 0 8px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;color:#14181f">${title}</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475467">${intro}</p>
      </td></tr>
      <tr><td align="center" style="padding:0 32px">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>${digits}</tr></table>
        <p style="margin:14px 0 0;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;color:#667085">Kod <b>10 dakika</b> geçerlidir.</p>
      </td></tr>
      <tr><td style="padding:28px 32px 32px;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif">
        <p style="margin:0;padding-top:20px;border-top:1px solid #eaeef2;font-size:12px;line-height:1.6;color:#98a2b3">${foot}</p>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:11px;color:#98a2b3">Mentoriva · <a href="${SITE_URL}" style="color:#98a2b3">${SITE_URL.replace(/^https?:\/\//, '')}</a></p>
  </td></tr>
</table>
</body></html>`;
}
