/**
 * Erken erişim listesinin depolanması — yalnızca sunucu. Kurallar: lib/mentors/access.ts.
 * Redis `access:early-mentors`; hiç ayarlanmadıysa koddaki EARLY_ACCESS_MENTORS.
 */

import { getKV } from '@/lib/kv';
import { EARLY_ACCESS_MENTORS } from '@/lib/mentors/metadata';
import { MENTOR_IDS, type MentorId } from '@/types';

const KEY = 'access:early-mentors';

const clean = (v: unknown): MentorId[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is MentorId => MENTOR_IDS.includes(x as MentorId)))] : [...EARLY_ACCESS_MENTORS];

/** Sunucu: güncel erken erişim listesi. KV okunamazsa koddaki varsayılan. */
export async function getEarlyMentors(): Promise<MentorId[]> {
  try {
    const raw = await getKV().get<unknown>(KEY);
    if (raw === null || raw === undefined) return [...EARLY_ACCESS_MENTORS];
    return clean(typeof raw === 'string' ? JSON.parse(raw) : raw);
  } catch {
    return [...EARLY_ACCESS_MENTORS];
  }
}

/** Sunucu (admin): listeyi kaydeder. En az bir mentor herkese açık kalmalı. */
export async function setEarlyMentors(ids: unknown): Promise<MentorId[] | null> {
  const list = clean(ids);
  if (list.length >= MENTOR_IDS.length) return null;
  await getKV().set(KEY, JSON.stringify(list));
  return list;
}
