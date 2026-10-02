/**
 * Yapay zekâdan gelen yolculuk JSON'larını doğrular ve güvenli hale getirir.
 * Model bazen fazladan alan, eksik alan ya da kod bloğu döndürebilir; burada
 * yalnızca beklenen alanlar, sınırlı uzunlukta ve geçerli kimliklerle kabul edilir.
 */

import { MENTOR_IDS, type MentorId } from '@/types';
import { MAP_FIELDS, QUESTION_COUNT, SMALL_STEP_IDS, type MapKey, type SmallStepId } from './content';

/** Sorular ile sonuç arasında taşınan imzalı izin (1 saat). */
export interface JourneyTokenPayload {
  jid: string;
  u: string;
  sp: string;
  story: string;
  questions: string[];
}

export interface JourneyQuestion {
  q: string;
}

export interface JourneyResult {
  windows: {
    psychological: string;
    mentor: { mentorId: MentorId; text: string };
    reflection: string;
  };
  map: Record<MapKey, string>;
  mentors: {
    support: { mentorId: MentorId; reason: string };
    growth: { mentorId: MentorId; reason: string };
  };
  steps: Array<{ id: SmallStepId; detail: string }>;
  /** Kullanıcının mentora sorabileceği, düzenlenebilir taslak soru. */
  followUpQuestion: string;
}

export type ParsedOrCrisis<T> = { ok: true; value: T } | { ok: false; crisis: true } | { ok: false; crisis: false };

const clean = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/[*#_`]/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : '';

const isMentor = (v: unknown): v is MentorId => typeof v === 'string' && (MENTOR_IDS as readonly string[]).includes(v);

/** Model çıktısından ilk JSON nesnesini çıkarır (kod bloğu ya da ön metin olsa bile). */
export function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function parseQuestions(raw: unknown): ParsedOrCrisis<JourneyQuestion[]> {
  if (!raw || typeof raw !== 'object') return { ok: false, crisis: false };
  const obj = raw as Record<string, unknown>;
  if (obj['crisis'] === true) return { ok: false, crisis: true };
  const list = Array.isArray(obj['questions']) ? obj['questions'] : [];
  const questions = list
    .map((q) => clean(typeof q === 'string' ? q : (q as Record<string, unknown>)?.['q'], 200))
    .filter((q) => q.length >= 8)
    .slice(0, QUESTION_COUNT)
    .map((q) => ({ q }));
  return questions.length === QUESTION_COUNT ? { ok: true, value: questions } : { ok: false, crisis: false };
}

export function parseResult(raw: unknown): ParsedOrCrisis<JourneyResult> {
  if (!raw || typeof raw !== 'object') return { ok: false, crisis: false };
  const o = raw as Record<string, unknown>;
  if (o['crisis'] === true) return { ok: false, crisis: true };

  const w = (o['windows'] ?? {}) as Record<string, unknown>;
  const wm = (w['mentor'] ?? {}) as Record<string, unknown>;
  const m = (o['map'] ?? {}) as Record<string, unknown>;
  const ms = (o['mentors'] ?? {}) as Record<string, unknown>;
  const sup = (ms['support'] ?? {}) as Record<string, unknown>;
  const gro = (ms['growth'] ?? {}) as Record<string, unknown>;

  const map = Object.fromEntries(MAP_FIELDS.map(({ key }) => [key, clean(m[key], 220)])) as Record<MapKey, string>;

  const seen = new Set<string>();
  const steps = (Array.isArray(o['steps']) ? o['steps'] : [])
    .map((s) => s as Record<string, unknown>)
    .filter((s) => typeof s['id'] === 'string' && (SMALL_STEP_IDS as string[]).includes(s['id']) && !seen.has(s['id']) && seen.add(s['id']))
    .map((s) => ({ id: s['id'] as SmallStepId, detail: clean(s['detail'], 220) }))
    .slice(0, 3);

  const result: JourneyResult = {
    windows: {
      psychological: clean(w['psychological'], 600),
      mentor: { mentorId: isMentor(wm['mentorId']) ? wm['mentorId'] : 'marcus', text: clean(wm['text'], 600) },
      reflection: clean(w['reflection'], 300),
    },
    map,
    mentors: {
      support: { mentorId: isMentor(sup['mentorId']) ? sup['mentorId'] : 'mevlana', reason: clean(sup['reason'], 200) },
      growth: { mentorId: isMentor(gro['mentorId']) ? gro['mentorId'] : 'marcus', reason: clean(gro['reason'], 200) },
    },
    steps,
    followUpQuestion: clean(o['followUpQuestion'], 300),
  };

  const complete =
    result.windows.psychological &&
    result.windows.mentor.text &&
    result.windows.reflection &&
    MAP_FIELDS.every(({ key }) => result.map[key]) &&
    result.steps.length >= 1 &&
    result.followUpQuestion.length >= 10;

  return complete ? { ok: true, value: result } : { ok: false, crisis: false };
}
