/**
 * Kendine Yolculuk — kullanıcının AÇIKÇA kaydettiği veriler.
 *
 * Yolculuk sırasında yazılan anlatım ve cevaplar hiçbir yerde saklanmaz.
 * Yalnızca kullanıcı "kaydet" dediğinde:
 *   journey-step:<email>  → seçilen küçük adım (tek kayıt)
 *   journeys:<email>      → kaydedilen geçici haritalar (en fazla 20)
 * Bu anahtarlar admin panelinde gösterilmez; kullanıcı istediğinde silinir.
 */

import { getKV } from '@/lib/kv';
import { MAP_FIELDS, SMALL_STEPS, type MapKey, type SmallStepId } from './content';
import type { MentorId } from '@/types';

/** "ozel": rehberli çalışmada kişinin kendi cümlesiyle seçtiği adım. */
export type StepId = SmallStepId | 'ozel';

export interface SavedStep {
  stepId: StepId;
  label: string;
  detail: string;
  topic: string;
  mentorId: MentorId;
  createdAt: string;
  status: 'pending' | 'done' | 'skipped';
}

export interface SavedJourney {
  id: string;
  createdAt: string;
  startingPoint: string;
  map: Record<MapKey, string>;
  supportMentor: MentorId;
  growthMentor: MentorId;
}

const MAX_SAVED = 20;
const stepKey = (u: string) => `journey-step:${u}`;
const listKey = (u: string) => `journeys:${u}`;

const parse = <T>(raw: unknown): T | null => {
  if (!raw) return null;
  try { return (typeof raw === 'string' ? JSON.parse(raw) : raw) as T; } catch { return null; }
};

export async function getStep(username: string): Promise<SavedStep | null> {
  return parse<SavedStep>(await getKV().get(stepKey(username)));
}

export async function saveStep(
  username: string,
  step: Omit<SavedStep, 'createdAt' | 'status' | 'label'> & { customLabel?: string },
): Promise<SavedStep> {
  const { customLabel, ...rest } = step;
  const label = rest.stepId === 'ozel' ? (customLabel ?? '').slice(0, 160) : SMALL_STEPS[rest.stepId];
  const full: SavedStep = { ...rest, label, createdAt: new Date().toISOString(), status: 'pending' };
  await getKV().set(stepKey(username), full);
  return full;
}

export async function updateStepStatus(username: string, status: SavedStep['status']): Promise<SavedStep | null> {
  const step = await getStep(username);
  if (!step) return null;
  step.status = status;
  await getKV().set(stepKey(username), step);
  return step;
}

export async function deleteStep(username: string): Promise<void> {
  await getKV().del(stepKey(username));
}

export async function listJourneys(username: string): Promise<SavedJourney[]> {
  const raw = await getKV().lrange<unknown>(listKey(username), 0, MAX_SAVED - 1);
  return raw.map((r) => parse<SavedJourney>(r)).filter((j): j is SavedJourney => !!j);
}

export async function saveJourney(username: string, journey: SavedJourney): Promise<void> {
  const kv = getKV();
  await kv.lpush(listKey(username), JSON.stringify(journey));
  await kv.ltrim(listKey(username), 0, MAX_SAVED - 1);
}

export async function deleteJourney(username: string, id: string): Promise<void> {
  const kept = (await listJourneys(username)).filter((j) => j.id !== id);
  const kv = getKV();
  await kv.del(listKey(username));
  // lpush başa ekler; sırayı korumak için sondan başa yaz
  for (const j of [...kept].reverse()) await kv.lpush(listKey(username), JSON.stringify(j));
}

/** Kullanıcının tüm yolculuk verisini siler (yolculuk sayfası ve hesap silme). */
export async function deleteAllJourneyData(username: string): Promise<void> {
  await getKV().del(stepKey(username), listKey(username));
}

/** İstemciden gelen haritayı alan alan sınırlayarak temizler. */
export function sanitizeMap(raw: unknown): Record<MapKey, string> | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  const out = Object.fromEntries(
    MAP_FIELDS.map(({ key }) => [key, typeof m[key] === 'string' ? (m[key] as string).trim().slice(0, 220) : '']),
  ) as Record<MapKey, string>;
  return MAP_FIELDS.some(({ key }) => out[key]) ? out : null;
}
