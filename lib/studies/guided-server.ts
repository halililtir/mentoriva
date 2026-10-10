/** Rehberli çalışma uçlarının ortak doğrulama ve izin yardımcıları. */

import { signJson, verifyJson } from '@/lib/signing';
import { GUIDED_BY_ID, STUDY_ANSWER_MAX, STUDY_MAX_QUESTIONS, type GuidedStudy, type StudyTurn } from './guided-content';

export interface StudyToken {
  id: string;
  s: string;
  u: string;
}

const PURPOSE = 'study';
const TTL_MS = 2 * 60 * 60 * 1000;

export const signStudy = (p: StudyToken) => signJson(PURPOSE, p, TTL_MS);

/** İzni doğrular: imza, süre, kullanıcı ve çalışma kimliği. */
export async function verifyStudy(token: unknown, username: string): Promise<{ payload: StudyToken; study: GuidedStudy } | null> {
  if (typeof token !== 'string' || token.length > 2000) return null;
  const payload = await verifyJson<StudyToken>(PURPOSE, token);
  const study = payload ? GUIDED_BY_ID.get(payload.s) : undefined;
  if (!payload || !study || payload.u !== username) return null;
  return { payload, study };
}

/** İstemciden gelen soru-cevapları sınırlar; açılış + en fazla STUDY_MAX_QUESTIONS. */
export function sanitizeTurns(raw: unknown): StudyTurn[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > STUDY_MAX_QUESTIONS + 1) return null;
  const turns: StudyTurn[] = [];
  for (const t of raw) {
    if (!t || typeof t !== 'object') return null;
    const q = (t as Record<string, unknown>)['q'];
    const a = (t as Record<string, unknown>)['a'];
    if (typeof q !== 'string' || typeof a !== 'string' || !q.trim() || !a.trim()) return null;
    if (a.length > STUDY_ANSWER_MAX || q.length > 300) return null;
    turns.push({ q: q.trim(), a: a.trim() });
  }
  return turns;
}
