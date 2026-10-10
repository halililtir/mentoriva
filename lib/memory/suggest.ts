/**
 * Sohbetten hatırlanacak not ÖNERİSİ. Yalnızca kişinin kendi mesajları
 * okunur; öneri kişiye gösterilir, düzenlenir ve onaylanmadan kaydedilmez.
 */

import { completeText } from '@/lib/claude/client';
import { extractJson } from '@/lib/journey/schema';
import { NOTE_MAX, cleanNote } from './notes';

const SYSTEM = `You help a person on Mentoriva (a Turkish app) decide what, if anything, they
want the mentors to remember in future conversations. You read ONLY the person's
own messages from one conversation and propose at most two short notes.

A good note is something the person explicitly said and that would help in a
later conversation: their situation, a goal, a decision they made, a preference
about how they want to be spoken to (e.g. "Uzun cevaplar yerine kısa ve net
cevapları tercih ediyorum.").

Rules:
- Only what they actually said. No interpretation, diagnosis, labels, motives,
  causes or feelings they did not name. No details about other people beyond
  what is needed (no names).
- First person, plain Turkish, one sentence, at most 25 words each.
- If nothing is worth remembering, return an empty list. Do not force it.

Return ONLY JSON: {"notes": ["...", "..."]}`;

export const SUGGEST_MAX_MESSAGES = 12;

export function parseNoteSuggestions(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object') return [];
  const list = (raw as Record<string, unknown>)['notes'];
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((n) => cleanNote(n).replace(/^["“]+|["”]+$/g, '')).filter((n) => n.length >= 8))].slice(0, 2);
}

/** Hata fırlatmaz; üretilemezse boş liste. */
export async function suggestNotes(userMessages: string[]): Promise<string[]> {
  const text = userMessages
    .slice(-SUGGEST_MAX_MESSAGES)
    .map((m, i) => `<message n="${i + 1}">\n${m.slice(0, 2000)}\n</message>`)
    .join('\n');
  try {
    const out = await completeText({
      system: SYSTEM,
      user: text,
      maxTokens: 300,
      feature: 'memory',
      mock: () => JSON.stringify({ notes: [userMessages[0]?.slice(0, NOTE_MAX - 20) ?? ''] }),
    });
    return parseNoteSuggestions(extractJson(out));
  } catch (e) {
    console.error('[not önerisi] üretilemedi:', e instanceof Error ? e.message : 'bilinmeyen hata');
    return [];
  }
}
