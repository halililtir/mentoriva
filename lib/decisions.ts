/**
 * Karar takibi — YALNIZCA kişi isterse. Karar vermek çalışmasının sonunda
 * kişi ne karar verdiğini yazar; seçtiği süre sonunda tek bir e-posta gelir ve
 * Yolculuğum'da "ne oldu?" sorusuna cevap verir. Yapay zekâya gönderilmez.
 *
 *   decisions:<email>      → en fazla MAX_DECISIONS karar (JSON)
 *   decision-day:<tarih>   → o gün e-posta gidecekler (`<id>:<email>`, 100 gün TTL)
 *
 * E-postada kararın içeriği yazmaz (bildirim önizlemesinde görünmesin).
 * Gönderim günlük hatırlatma cron'unda. `deleteUser` siler, dışa aktarmaya girer.
 */

import { randomBytes } from 'node:crypto';
import { getKV } from '@/lib/kv';
import { todayKey } from '@/lib/time';
import { SITE_URL } from '@/lib/site';
import { sendEmailDetailed } from '@/lib/email';
import { getUser } from '@/lib/auth/users';
import { recordEvent } from '@/lib/admin/metrics';
import { addDays } from '@/lib/reminders';
import { DECISION_DAYS, DECISION_LIMITS, MAX_DECISIONS, type DecisionDays, type SavedDecision } from '@/lib/decisions-public';

export { DECISION_DAYS, DECISION_LIMITS, MAX_DECISIONS, type DecisionDays, type SavedDecision };

const key = (u: string) => `decisions:${u}`;
const dayKey = (d: string) => `decision-day:${d}`;
export const decisionsKey = key;

export async function listDecisions(username: string): Promise<SavedDecision[]> {
  const raw = await getKV().get<unknown>(key(username));
  try {
    const list = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(list) ? (list as SavedDecision[]) : [];
  } catch {
    return [];
  }
}

const save = (username: string, list: SavedDecision[]) => getKV().set(key(username), JSON.stringify(list));

export async function addDecision(
  username: string,
  input: { title: string; choice: string; why: string; days: DecisionDays },
): Promise<SavedDecision | 'full'> {
  const list = await listDecisions(username);
  if (list.length >= MAX_DECISIONS) return 'full';
  const d: SavedDecision = {
    id: randomBytes(6).toString('hex'),
    title: input.title.slice(0, DECISION_LIMITS.title),
    choice: input.choice.slice(0, DECISION_LIMITS.choice),
    why: input.why.slice(0, DECISION_LIMITS.why),
    createdAt: new Date().toISOString(),
    checkDate: addDays(todayKey(), input.days),
  };
  await save(username, [d, ...list]);
  const kv = getKV();
  await kv.lpush(dayKey(d.checkDate), `${d.id}:${username}`);
  await kv.expire(dayKey(d.checkDate), 100 * 24 * 3600);
  return d;
}

export async function setDecisionOutcome(username: string, id: string, outcome: string): Promise<SavedDecision | null> {
  const list = await listDecisions(username);
  const d = list.find((x) => x.id === id);
  if (!d) return null;
  d.outcome = outcome.slice(0, DECISION_LIMITS.outcome);
  d.outcomeAt = new Date().toISOString();
  await save(username, list);
  return d;
}

export async function deleteDecision(username: string, id: string): Promise<boolean> {
  const list = await listDecisions(username);
  const next = list.filter((x) => x.id !== id);
  if (next.length === list.length) return false;
  await save(username, next);
  return true;
}

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
<p>${hello.replace(/[&<>"]/g, '')}</p>
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
    const entries = [...new Set(await kv.lrange<string>(dayKey(day), 0, -1).catch(() => [] as string[]))];
    for (const entry of entries) {
      try {
        const cut = entry.indexOf(':');
        const id = entry.slice(0, cut);
        const u = entry.slice(cut + 1);
        const [list, user] = await Promise.all([listDecisions(u), getUser(u)]);
        const d = list.find((x) => x.id === id);
        if (!d || d.outcome || !user || !user.isActive) { skipped++; continue; }
        const res = await sendEmailDetailed({ to: user.email ?? u, ...message(user.name) });
        if (res.ok) { sent++; await recordEvent('decision_check_sent'); } else skipped++;
      } catch {
        skipped++;
      }
    }
    await kv.del(dayKey(day));
  }
  return { sent, skipped };
}
