/**
 * Erken erişim listesinin depolanması — yalnızca sunucu. Kurallar: lib/mentors/access.ts.
 *
 * Redis `access:early-mentors` = { early: MentorId[], known: MentorId[] }.
 * `known`, admin listeyi kaydettiğinde var olan mentorlardır. Sonradan eklenen
 * bir mentor (known'da yok) koddaki EARLY_ACCESS_MENTORS'taysa kilitli başlar;
 * böylece önceden kaydedilmiş bir liste yeni mentoru yanlışlıkla herkese açmaz.
 * Eski biçim (düz dizi) de okunur.
 */

import { getKV } from '@/lib/kv';
import { EARLY_ACCESS_MENTORS } from '@/lib/mentors/metadata';
import { MENTOR_IDS, type MentorId } from '@/types';

const KEY = 'access:early-mentors';

const ids = (v: unknown): MentorId[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is MentorId => MENTOR_IDS.includes(x as MentorId)))] : [];

/** Kayıtlı değerden güncel listeyi çıkarır (saf; test edilebilir). */
export function resolveEarly(raw: unknown): MentorId[] {
  if (raw === null || raw === undefined) return [...EARLY_ACCESS_MENTORS];
  let early: MentorId[];
  let known: MentorId[];
  if (Array.isArray(raw)) {
    // Eski biçim: kaydedildiğinde koddaki erken erişim listesi dışındakiler biliniyordu
    early = ids(raw);
    known = MENTOR_IDS.filter((id) => !EARLY_ACCESS_MENTORS.includes(id));
  } else if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    early = ids(o['early']);
    known = ids(o['known']);
  } else {
    return [...EARLY_ACCESS_MENTORS];
  }
  const fresh = EARLY_ACCESS_MENTORS.filter((id) => !known.includes(id));
  return [...new Set([...early, ...fresh])];
}

/** Sunucu: güncel erken erişim listesi. KV okunamazsa koddaki varsayılan. */
export async function getEarlyMentors(): Promise<MentorId[]> {
  try {
    const raw = await getKV().get<unknown>(KEY);
    return resolveEarly(typeof raw === 'string' ? JSON.parse(raw) : raw);
  } catch {
    return [...EARLY_ACCESS_MENTORS];
  }
}

/** Sunucu (admin): listeyi kaydeder. En az bir mentor herkese açık kalmalı. */
export async function setEarlyMentors(input: unknown): Promise<MentorId[] | null> {
  const list = ids(input);
  if (list.length >= MENTOR_IDS.length) return null;
  await getKV().set(KEY, JSON.stringify({ early: list, known: [...MENTOR_IDS] }));
  return list;
}
