/**
 * Mentor laboratuvarı hakemi — bir mentor cevabını, kullanıcı geri
 * bildiriminden çıkan hatalı davranışlara göre puanlar (2026-10-05).
 * Yalnızca admin laboratuvarında kullanılır; kullanıcıya gösterilmez.
 * Puanlar: 1 = sorun var, 2 = kısmen, 3 = iyi.
 */

import { completeText } from '@/lib/claude/client';
import { extractJson } from '@/lib/journey/schema';
import { getActiveMentor } from '@/lib/mentors/metadata';
import type { MentorId } from '@/types';
import { GRADE_CRITERIA, type Grade } from '@/lib/admin/grade-criteria';

export { GRADE_CRITERIA, type Grade };

const SYSTEM = `You are a strict quality reviewer for Mentoriva, a Turkish app where AI
characters inspired by thinkers (Jung, Nietzsche, Mevlânâ, Marcus Aurelius,
Seneca, Socrates) answer personal questions.

Score ONE answer on each criterion: 1 = clear problem, 2 = partly, 3 = good.
Be strict and specific; a polished but generic answer is not a 3.

Criteria:
${GRADE_CRITERIA.map((c) => `- ${c.id}: ${c.hint}`).join('\n')}

Judge only against what the user actually wrote. Anything the answer states
about the user's past, family, motives or other people that the user did not
say counts against "uydurma" unless it is clearly offered as a tentative
possibility. Invented personal memories of the character (scenes,
conversations, "ben de yıllarca…") also count against "uydurma"; a brief
mention of a well-documented biographical fact (e.g. Seneca's exile or his
consolation letter to his mother, Rumi's loss of Shams) does not.
A closing quotation formatted as "“…”
— Author, Work ref" comes from a
source-verified catalog: do not judge its authenticity, only whether it fits.

Return ONLY JSON: {"scores": {${GRADE_CRITERIA.map((c) => `"${c.id}": 1|2|3`).join(', ')}}, "note": "<one short Turkish sentence naming the most important problem, or what is best if there is none>"}`;

function parseGrade(raw: unknown): Grade | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const s = (o['scores'] ?? {}) as Record<string, unknown>;
  const scores = {} as Grade['scores'];
  for (const c of GRADE_CRITERIA) {
    const v = Number(s[c.id]);
    if (v !== 1 && v !== 2 && v !== 3) return null;
    scores[c.id] = v;
  }
  const note = typeof o['note'] === 'string' ? o['note'].trim().slice(0, 300) : '';
  return { scores, note };
}

/** Hata fırlatmaz; puanlanamazsa null. */
export async function gradeAnswer(question: string, mentorId: MentorId, answer: string): Promise<Grade | null> {
  try {
    const text = await completeText({
      system: SYSTEM,
      user: `<user_message>\n${question}\n</user_message>\n\n<mentor name="${getActiveMentor(mentorId).name}">\n${answer.slice(0, 4000)}\n</mentor>`,
      maxTokens: 500,
      effort: 'medium',
      feature: 'other',
      mock: () => JSON.stringify({ scores: Object.fromEntries(GRADE_CRITERIA.map((c) => [c.id, 3])), note: 'Deneme puanı (sahte yapay zekâ).' }),
    });
    return parseGrade(extractJson(text));
  } catch (e) {
    console.error('[hakem] puanlanamadı:', e instanceof Error ? e.message : 'bilinmeyen hata');
    return null;
  }
}
