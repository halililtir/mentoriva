/**
 * Karar takibi — YALNIZCA kişi isterse. Karar vermek çalışmasının sonunda
 * kişi ne karar verdiğini yazar; seçtiği süre sonunda tek bir e-posta gelir ve
 * Yolculuğum'da "ne oldu?" sorusuna cevap verir. Yapay zekâya gönderilmez.
 *
 *   decisions:<email>       → hash: id → karar (alan başına atomik yazım)
 *   decision-day:<tarih>    → o gün e-posta gidecek karar kimlikleri (100 gün TTL)
 *   decision-owner:<id>     → kararın sahibi; kuyrukta e-posta adresi tutulmaz,
 *                             karar ya da hesap silinince bu anahtar da silinir
 *
 * Gönderim `lib/decisions-mail.ts`. `deleteUser` → `deleteUserDecisions`.
 */

import { randomBytes } from 'node:crypto';
import { getKV } from '@/lib/kv';
import { addDays, todayKey } from '@/lib/time';
import { DECISION_DAYS, DECISION_LIMITS, MAX_DECISIONS, type DecisionDays, type SavedDecision } from '@/lib/decisions-public';

export { DECISION_DAYS, DECISION_LIMITS, MAX_DECISIONS, type DecisionDays, type SavedDecision };

const QUEUE_TTL = 100 * 24 * 3600;
const key = (u: string) => `decisions:${u}`;
export const decisionDayKey = (d: string) => `decision-day:${d}`;
export const decisionOwnerKey = (id: string) => `decision-owner:${id}`;

const parse = (raw: unknown): SavedDecision | null => {
  try { return (typeof raw === 'string' ? JSON.parse(raw) : raw) as SavedDecision | null; } catch { return null; }
};

export async function listDecisions(username: string): Promise<SavedDecision[]> {
  const all = (await getKV().hgetall<Record<string, unknown>>(key(username))) ?? {};
  return Object.values(all)
    .map(parse)
    .filter((d): d is SavedDecision => !!d)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getDecision(username: string, id: string): Promise<SavedDecision | null> {
  return (await listDecisions(username)).find((d) => d.id === id) ?? null;
}

export const saveDecision = (username: string, d: SavedDecision) => getKV().hset(key(username), { [d.id]: JSON.stringify(d) });

export async function addDecision(
  username: string,
  input: { title: string; choice: string; why: string; days: DecisionDays },
): Promise<SavedDecision | 'full'> {
  if ((await listDecisions(username)).length >= MAX_DECISIONS) return 'full';
  const d: SavedDecision = {
    id: randomBytes(6).toString('hex'),
    title: input.title.slice(0, DECISION_LIMITS.title),
    choice: input.choice.slice(0, DECISION_LIMITS.choice),
    why: input.why.slice(0, DECISION_LIMITS.why),
    createdAt: new Date().toISOString(),
    checkDate: addDays(todayKey(), input.days),
  };
  await saveDecision(username, d);
  const kv = getKV();
  await kv.set(decisionOwnerKey(d.id), username, { ex: QUEUE_TTL });
  await kv.lpush(decisionDayKey(d.checkDate), d.id);
  await kv.expire(decisionDayKey(d.checkDate), QUEUE_TTL);
  return d;
}

export async function setDecisionOutcome(username: string, id: string, outcome: string): Promise<SavedDecision | null> {
  const d = await getDecision(username, id);
  if (!d) return null;
  d.outcome = outcome.slice(0, DECISION_LIMITS.outcome);
  d.outcomeAt = new Date().toISOString();
  await saveDecision(username, d);
  return d;
}

export async function deleteDecision(username: string, id: string): Promise<boolean> {
  const kv = getKV();
  const removed = await kv.hdel(key(username), id);
  await kv.del(decisionOwnerKey(id));
  return removed > 0;
}

/** Hesap silinirken: kararlar ve kuyruktaki sahip kayıtları. */
export async function deleteUserDecisions(username: string): Promise<void> {
  const kv = getKV();
  const ids = (await listDecisions(username)).map((d) => decisionOwnerKey(d.id));
  await kv.del(key(username), ...ids);
}
