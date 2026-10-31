/**
 * Karar takibi e-postası. İçerik yazmaz (bildirim önizlemesinde görünmesin) ve
 * her karar için bir kez gider: `notifiedAt` göndermeden önce yazılır, gönderim
 * başarısızsa geri alınır. Böylece yarıda kesilen cron ertesi gün aynı kişiye
 * ikinci kez yazmaz. Günlük hatırlatma cron'undan çağrılır.
 */

import { getKV } from '@/lib/kv';
import { addDays, todayKey } from '@/lib/time';
import { SITE_URL } from '@/lib/site';
import { escapeHtml, sendEmailDetailed } from '@/lib/email';
import { getUser } from '@/lib/auth/users';
import { recordEvent } from '@/lib/admin/metrics';
import { decisionDayKey, decisionOwnerKey, getDecision, saveDecision } from '@/lib/decisions';

function message(name: string | undefined) {
  const hello = name ? `Merhaba ${name},` : 'Merhaba,';
  const link = `${SITE_URL}/yolculugum#kararlar`;
  const text = `${hello}

Bir süre önce verdiğin bir kararı takibe almıştın. Aradan geçen zamanda ne oldu?

Birkaç cümleyle yazmak, bir sonraki kararında sana yol gösterebilir. İstemiyorsan yazmak zorunda değilsin.
${link}

Bu e-postayı bu karar için yalnızca bir kez, sen istediğin için gönderdik.
Mentoriva`;
  const html = `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#14181f;line-height:1.6">
<p>${escapeHtml(hello)}</p>
<p>Bir süre önce verdiğin bir kararı takibe almıştın. Aradan geçen zamanda ne oldu?</p>
<p>Birkaç cümleyle yazmak, bir sonraki kararında sana yol gösterebilir. İstemiyorsan yazmak zorunda değilsin.</p>
<p><a href="${link}" style="color:#0e7c86">Ne olduğunu yaz</a></p>
<p style="color:#667085;font-size:13px">Bu e-postayı bu karar için yalnızca bir kez, sen istediğin için gönderdik.<br>Mentoriva</p>
</div>`;
  return { subject: 'Kararının üzerinden zaman geçti', text, html };
}

/** Bugün (ve dün kaçmışsa) sırası gelen karar e-postaları. Hata fırlatmaz. */
export async function sendDueDecisions(today: string = todayKey()): Promise<{ sent: number; skipped: number }> {
  const kv = getKV();
  let sent = 0;
  let skipped = 0;
  for (const day of [addDays(today, -1), today]) {
    const ids = [...new Set(await kv.lrange<string>(decisionDayKey(day), 0, -1).catch(() => [] as string[]))];
    for (const id of ids) {
      try {
        const owner = await kv.get<string>(decisionOwnerKey(id));
        if (!owner) { skipped++; continue; }
        const [d, user] = await Promise.all([getDecision(owner, id), getUser(owner)]);
        if (!d || d.outcome || d.notifiedAt || !user || !user.isActive) { skipped++; continue; }
        await saveDecision(owner, { ...d, notifiedAt: new Date().toISOString() });
        const res = await sendEmailDetailed({ to: user.email ?? owner, ...message(user.name) });
        if (res.ok) {
          sent++;
          await recordEvent('decision_check_sent');
        } else {
          await saveDecision(owner, d);
          skipped++;
        }
      } catch {
        skipped++;
      }
    }
    await kv.del(decisionDayKey(day));
  }
  return { sent, skipped };
}
