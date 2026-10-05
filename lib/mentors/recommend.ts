/**
 * "Meselemi yazayım, sen öner" — kişinin anlattığı meseleye göre hangi
 * mentorların bakışının yararlı olacağını kısa gerekçeyle önerir.
 *
 * Yalnızca öneri üretir; meseleye cevap vermez, tanı koymaz. Metin saklanmaz,
 * metriklere yazılmaz. Seçilebilecek mentorlar (erken erişim, misafir sınırı)
 * sunucuda belirlenir ve modelin dışındaki kimlikler atılır.
 */

import { completeText } from '@/lib/claude/client';
import { extractJson } from '@/lib/journey/schema';
import { getActiveMentor } from '@/lib/mentors/metadata';
import { MENTOR_IDS, type MentorId } from '@/types';

import type { MentorPick } from './recommend-public';

export { RECOMMEND_TEXT_MAX, RECOMMEND_TEXT_MIN, type MentorPick } from './recommend-public';

const SYSTEM = `You help people on Mentoriva, a Turkish app, choose which thinkers to ask.
Each mentor is an AI character inspired by a real thinker's documented ideas.
You receive the person's matter and the list of mentors they can choose.

Choose the mentors whose way of thinking would genuinely help with THIS matter:
usually two, one if a single lens clearly fits best, three only if the matter
truly has several sides. Prefer mentors whose views would differ usefully over
mentors who would say the same thing.

For each pick write "why": one sentence in natural Turkish, addressed to the
person ("sen"), naming what this mentor would look at in their matter, tied to
what they actually wrote (for example: "Seneca, zamanının nereye aktığına ve
neyin senin elinde olduğuna bakar."). At most 25 words.

Rules:
- Do not answer the matter, give advice, diagnose or label the person.
- Do not add details, causes or feelings the person did not mention.
- Use only the mentor ids given. No markdown, no emojis, no quotations.
- If the text is not a personal matter (e.g. a test or nonsense), still pick
  the mentors that fit best and keep "why" general.

Return ONLY JSON: {"picks": [{"id": "<mentor id>", "why": "..."}]}`;

function userMessage(text: string, allowed: readonly MentorId[]): string {
  const list = allowed
    .map((id) => {
      const m = getActiveMentor(id);
      return `- ${id} (${m.shortName}, ${m.tradition ?? ''}): ${m.bestFor ?? ''} ${m.voice ?? ''}`.trim();
    })
    .join('\n');
  return `<mentors>\n${list}\n</mentors>\n\n<matter>\n${text}\n</matter>`;
}

const clean = (v: unknown, max = 220): string =>
  typeof v === 'string' ? v.replace(/[*#_`"“”]/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : '';

/** Model çıktısını doğrular: yalnızca izinli, tekrarsız kimlikler; en fazla `max`. */
export function parsePicks(raw: unknown, allowed: readonly MentorId[], max: number): MentorPick[] {
  if (!raw || typeof raw !== 'object') return [];
  const list = (raw as Record<string, unknown>)['picks'];
  if (!Array.isArray(list)) return [];
  const out: MentorPick[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const id = o['id'];
    if (typeof id !== 'string' || !MENTOR_IDS.includes(id as MentorId) || !allowed.includes(id as MentorId)) continue;
    if (out.some((p) => p.id === id)) continue;
    const why = clean(o['why']);
    if (!why) continue;
    out.push({ id: id as MentorId, why });
    if (out.length >= max) break;
  }
  return out;
}

function mock(allowed: readonly MentorId[]): string {
  const [a, b] = allowed;
  return JSON.stringify({
    picks: [
      a && { id: a, why: `${getActiveMentor(a).shortName}, bu meselenin altında neyin yattığını seninle birlikte arar.` },
      b && { id: b, why: `${getActiveMentor(b).shortName}, bugün elinde olan adıma bakar.` },
    ].filter(Boolean),
  });
}

/** Hata fırlatmaz; üretilemezse boş liste. */
export async function recommendMentors(text: string, allowed: readonly MentorId[], max: number): Promise<MentorPick[]> {
  if (allowed.length === 0) return [];
  try {
    const out = await completeText({
      system: SYSTEM,
      user: userMessage(text, allowed),
      maxTokens: 500,
      feature: 'recommend',
      mock: () => mock(allowed),
    });
    return parsePicks(extractJson(out), allowed, max);
  } catch (e) {
    console.error('[öneri] üretilemedi:', e instanceof Error ? e.message : 'bilinmeyen hata');
    return [];
  }
}
