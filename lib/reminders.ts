/**
 * Adım hatırlatması — YALNIZCA kişi isterse, seçtiği küçük adım için birkaç
 * gün sonra tek bir e-posta. Ruh hâlini biliyormuş gibi konuşmaz, tekrar etmez.
 *
 *   reminder:<email>       → { date, stepCreatedAt, days } (tek kayıt)
 *   reminder-day:<tarih>   → o gün gönderilecek e-postaların listesi (40 gün TTL)
 *
 * Gönderim günlük cron'da (`/api/cron/reminders`, 06:00 UTC = 09:00 İstanbul).
 * Adım silinmiş, tamamlanmış ya da değişmişse e-posta gitmez.
 */

import { getKV } from '@/lib/kv';
import { todayKey } from '@/lib/time';
import { SITE_URL } from '@/lib/site';
import { sendEmailDetailed } from '@/lib/email';
import { getUser } from '@/lib/auth/users';
import { getStep } from '@/lib/journey/store';
import { recordEvent } from '@/lib/admin/metrics';

export const REMINDER_DAYS = [3, 7] as const;
export type ReminderDays = (typeof REMINDER_DAYS)[number];

export interface Reminder {
  date: string;
  days: ReminderDays;
  stepCreatedAt: string;
}

const key = (u: string) => `reminder:${u}`;
const dayKey = (d: string) => `reminder-day:${d}`;
export const reminderKey = key;

/** YYYY-MM-DD + n gün (takvim günü). */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const parse = (raw: unknown): Reminder | null => {
  try { return (typeof raw === 'string' ? JSON.parse(raw) : raw) as Reminder | null; } catch { return null; }
};

export async function getReminder(username: string): Promise<Reminder | null> {
  return parse(await getKV().get(key(username)));
}

/** Bekleyen adım yoksa null. */
export async function setReminder(username: string, days: ReminderDays): Promise<Reminder | null> {
  const step = await getStep(username);
  if (!step || step.status !== 'pending') return null;
  const r: Reminder = { date: addDays(todayKey(), days), days, stepCreatedAt: step.createdAt };
  const kv = getKV();
  await kv.set(key(username), JSON.stringify(r), { ex: 40 * 24 * 3600 });
  await kv.lpush(dayKey(r.date), username);
  await kv.expire(dayKey(r.date), 40 * 24 * 3600);
  return r;
}

export async function cancelReminder(username: string): Promise<void> {
  await getKV().del(key(username));
}

function message(name: string | undefined, label: string, days: number) {
  const hello = name ? `Merhaba ${name},` : 'Merhaba,';
  const link = `${SITE_URL}/yolculugum#adim`;
  const text = `${hello}

${days} gün önce kendine küçük bir adım seçmiştin: "${label}".

Nasıl geçtiğini Yolculuğum sayfasında işaretleyebilirsin. Olmadıysa da sorun değil; adımı değiştirebilir ya da bırakabilirsin.
${link}

Bu e-postayı yalnızca bir kez, sen istediğin için gönderdik.
Mentoriva`;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  const html = `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#14181f;line-height:1.6">
<p>${esc(hello)}</p>
<p>${days} gün önce kendine küçük bir adım seçmiştin: <b>${esc(label)}</b>.</p>
<p>Nasıl geçtiğini Yolculuğum sayfasında işaretleyebilirsin. Olmadıysa da sorun değil; adımı değiştirebilir ya da bırakabilirsin.</p>
<p><a href="${link}" style="color:#0e7c86">Adımıma bak</a></p>
<p style="color:#667085;font-size:13px">Bu e-postayı yalnızca bir kez, sen istediğin için gönderdik.<br>Mentoriva</p>
</div>`;
  return { subject: 'Seçtiğin küçük adım', text, html };
}

/** Bugün (ve dün kaçmışsa) gönderilecek hatırlatmaları gönderir. Hata fırlatmaz. */
export async function sendDueReminders(today: string = todayKey()): Promise<{ sent: number; skipped: number }> {
  const kv = getKV();
  let sent = 0;
  let skipped = 0;
  for (const day of [addDays(today, -1), today]) {
    const users = [...new Set(await kv.lrange<string>(dayKey(day), 0, -1).catch(() => [] as string[]))];
    for (const u of users) {
      try {
        const r = await getReminder(u);
        if (!r || r.date > today) { skipped++; continue; }
        const [step, user] = await Promise.all([getStep(u), getUser(u)]);
        await kv.del(key(u));
        if (!step || step.status !== 'pending' || step.createdAt !== r.stepCreatedAt || !user || !user.isActive) { skipped++; continue; }
        const m = message(user.name, step.label, r.days);
        const res = await sendEmailDetailed({ to: user.email ?? u, ...m });
        if (res.ok) { sent++; await recordEvent('reminder_sent'); } else skipped++;
      } catch {
        skipped++;
      }
    }
    await kv.del(dayKey(day));
  }
  return { sent, skipped };
}
