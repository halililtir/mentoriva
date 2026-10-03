/**
 * İşaretler (rozetler) — kişiye özeldir, kimseyle karşılaştırılmaz.
 *
 * İlke: miktarı değil derinliği ve çeşitliliği ödüllendir; seri (streak)
 * baskısı kurma. Bu bir düşünme aracı; "daha çok soru sor" teşviki yanlış olur.
 *
 * İki tür:
 *  - auto:  kullanıma göre kendiliğinden kazanılır (awardBadges)
 *  - grant: yalnızca admin verir (Kurucu Üye, Destekçi, Katkı Veren)
 *
 * Redis:
 *   badges:<email>    hash  { <rozet>: { at, by } }         (HSETNX → iki kez verilmez)
 *   progress:<email>  hash  { "m:<mentor>": 1, "d:<YYYY-MM-DD>": 1 }  (hangi mentorlar, hangi günler)
 *   badges-seen:<email>     görülmüş rozet kimlikleri (yeni rozet bildirimi için)
 */

import { getKV } from '@/lib/kv';
import { todayKey } from '@/lib/time';
import { MENTOR_IDS, type MentorId } from '@/types';

export { BADGES, BADGE_BY_ID, GRANTABLE, FOUNDER_DAILY_BONUS } from '@/lib/badges-public';
export type { BadgeDef, BadgeKind } from '@/lib/badges-public';
import { BADGE_BY_ID } from '@/lib/badges-public';

const badgesKey = (u: string) => `badges:${u}`;
const progressKey = (u: string) => `progress:${u}`;
const seenKey = (u: string) => `badges-seen:${u}`;

export interface EarnedBadge {
  id: string;
  at: string;
  by: 'auto' | 'admin';
}

export async function getBadges(username: string): Promise<EarnedBadge[]> {
  const raw = (await getKV().hgetall<Record<string, unknown>>(badgesKey(username))) ?? {};
  return Object.entries(raw)
    .map(([id, v]) => {
      const val = (typeof v === 'string' ? safeParse(v) : v) as { at?: string; by?: 'auto' | 'admin' } | null;
      return BADGE_BY_ID[id] ? { id, at: val?.at ?? '', by: val?.by ?? 'auto' } : null;
    })
    .filter((b): b is EarnedBadge => b !== null)
    .sort((a, b) => a.at.localeCompare(b.at));
}

export async function hasBadge(username: string, id: string): Promise<boolean> {
  return (await getBadges(username)).some((b) => b.id === id);
}

function safeParse(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

/** Rozeti verir; zaten varsa false. Atomik (HSETNX). */
export async function giveBadge(username: string, id: string, by: 'auto' | 'admin'): Promise<boolean> {
  if (!BADGE_BY_ID[id]) return false;
  const added = await getKV().hsetnx(badgesKey(username), id, JSON.stringify({ at: new Date().toISOString(), by }));
  return added === 1;
}

export async function removeBadge(username: string, id: string): Promise<boolean> {
  return (await getKV().hdel(badgesKey(username), id)) > 0;
}

export async function deleteBadgeData(username: string): Promise<void> {
  await getKV().del(badgesKey(username), progressKey(username), seenKey(username));
}

// -----------------------------------------------------------
// Otomatik kazanım
// -----------------------------------------------------------

export type BadgeEvent =
  | { type: 'answered'; mentorIds: MentorId[] }
  | { type: 'chat'; mentorId: MentorId; userMessages: number }
  | { type: 'journey' }
  | { type: 'referral' }
  | { type: 'share' };

/**
 * Olayı işler, hak edilen otomatik rozetleri verir; yeni kazanılanların
 * kimliklerini döner. Hata fırlatmaz (rozet, asıl akışı asla bozmamalı).
 */
export async function awardBadges(username: string, event: BadgeEvent): Promise<string[]> {
  try {
    const kv = getKV();
    const earned: string[] = [];
    const give = async (id: string) => { if (await giveBadge(username, id, 'auto')) earned.push(id); };

    if (event.type === 'answered' || event.type === 'chat') {
      const ids = event.type === 'answered' ? event.mentorIds : [event.mentorId];
      await kv.hset(progressKey(username), {
        ...Object.fromEntries(ids.map((m) => [`m:${m}`, 1])),
        [`d:${todayKey()}`]: 1,
      });
      const progress = (await kv.hgetall<Record<string, unknown>>(progressKey(username))) ?? {};
      const fields = Object.keys(progress);

      if (event.type === 'answered') await give('ilk-adim');
      if (MENTOR_IDS.every((m) => fields.includes(`m:${m}`))) await give('cok-sesli');
      if (fields.filter((f) => f.startsWith('d:')).length >= 7) await give('dusunme-aliskanligi');
      if (event.type === 'chat' && event.userMessages >= 5) await give('derinlesen');
    }
    if (event.type === 'journey') await give('ice-bakis');
    if (event.type === 'referral') await give('kopru');
    if (event.type === 'share') await give('paylasan');
    return earned;
  } catch (e) {
    console.error('[badges] verilemedi:', e instanceof Error ? e.message : e);
    return [];
  }
}

// -----------------------------------------------------------
// "Yeni rozet" bildirimi
// -----------------------------------------------------------

/** Kullanıcının henüz görmediği rozetler (kazanılma sırasına göre). */
export async function unseenBadges(username: string): Promise<EarnedBadge[]> {
  const [all, seen] = await Promise.all([getBadges(username), getKV().get<string[] | string>(seenKey(username))]);
  const seenIds = new Set(Array.isArray(seen) ? seen : typeof seen === 'string' ? ((safeParse(seen) as string[] | null) ?? []) : []);
  return all.filter((b) => !seenIds.has(b.id));
}

export async function markBadgesSeen(username: string): Promise<void> {
  const all = await getBadges(username);
  await getKV().set(seenKey(username), JSON.stringify(all.map((b) => b.id)));
}
