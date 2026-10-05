/**
 * "İçimde ne var?" — kişinin yazdığına göre sözlükten birkaç duygu adı ve
 * (varsa) metindeki bir yorumu önerir. Öneri kişinin onayına sunulur;
 * sistem "duygunu bildi" iddiasında bulunmaz.
 *
 * Güvenceler:
 * - Yalnızca sözlükteki kimlikler kabul edilir.
 * - "Aklından geçen yorum" kişinin metninde birebir geçmek zorundadır
 *   (model bir düşünce uyduramaz).
 * - Anlatım saklanmaz.
 */

import { completeText } from '@/lib/claude/client';
import { extractJson } from '@/lib/journey/schema';
import { BODY_NOTES, FEELINGS, FEELING_BY_ID, START_PHRASES } from './content';

export interface FeelingSuggestion {
  id: string;
  /** Kişinin sözüne bağlı, olasılık diliyle tek cümle. */
  why: string;
}

export interface SuggestResult {
  suggestions: FeelingSuggestion[];
  /** Kişinin metninden birebir alınmış bir yorum; yoksa boş. */
  thought: string;
}

const SYSTEM = `You help a person on Mentoriva (a Turkish app) find words for what they feel.
They describe what they are going through; you offer a few feeling words from a
fixed vocabulary for them to consider. The goal is that they can express their
experience better, not that you "know" their feelings.

Return 3 to 5 ids from the vocabulary that could fit, each with "why": one short
Turkish sentence, addressed to the person ("sen"), tied to their own words and
phrased as a possibility ("… dediğin için belki …", "… olabilir mi?").
Include pleasant feelings when the text points to them. Mixed feelings are
normal; you may offer words from different groups.

"thought": if the person's text contains an interpretation about what others
think or intend, or a judgment about themselves (for example "beni
önemsemiyorlar", "hep ben yanlış yapıyorum"), copy that phrase EXACTLY as the
person wrote it, a few words long. Otherwise return "". Never paraphrase it and
never invent one.

Rules:
- No diagnosis, no labels about the person, no advice, no causes they did not
  mention. Do not draw conclusions from body sensations.
- Use only ids from the vocabulary. No markdown, no emojis.

Return ONLY JSON: {"suggest": [{"id": "...", "why": "..."}], "thought": "..."}`;

const vocabulary = FEELINGS.map((f) => `- ${f.id}: ${f.name} — ${f.desc}`).join('\n');

function userMessage(text: string, phrases: string[], body: string[]): string {
  const parts = [`<vocabulary>\n${vocabulary}\n</vocabulary>`];
  if (phrases.length) parts.push(`<chosen_phrases>\n${phrases.join('\n')}\n</chosen_phrases>`);
  if (body.length) parts.push(`<body_notes>\n${body.join(', ')}\n</body_notes>`);
  parts.push(`<what_happened>\n${text}\n</what_happened>`);
  return parts.join('\n\n');
}

const clean = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/[*#_`]/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : '';

/** Model çıktısını doğrular. `thought` metinde birebir geçmiyorsa atılır. */
export function parseSuggestion(raw: unknown, text: string): SuggestResult {
  const out: SuggestResult = { suggestions: [], thought: '' };
  if (!raw || typeof raw !== 'object') return out;
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o['suggest'])) {
    for (const item of o['suggest']) {
      if (!item || typeof item !== 'object') continue;
      const id = (item as Record<string, unknown>)['id'];
      if (typeof id !== 'string' || !FEELING_BY_ID.has(id) || out.suggestions.some((s) => s.id === id)) continue;
      out.suggestions.push({ id, why: clean((item as Record<string, unknown>)['why'], 200) });
      if (out.suggestions.length >= 5) break;
    }
  }
  const thought = clean(o['thought'], 160).replace(/^["“']+|["”']+$/g, '');
  const fold = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');
  if (thought && fold(text).includes(fold(thought))) out.thought = thought;
  return out;
}

/** Anlatım yoksa yapay zekâ çağrılmaz: seçilen giriş cümlelerinin ipuçları. */
export function staticSuggestions(phraseIds: string[]): FeelingSuggestion[] {
  const ids: string[] = [];
  for (const p of START_PHRASES) {
    if (!phraseIds.includes(p.id)) continue;
    for (const h of p.hints) if (!ids.includes(h)) ids.push(h);
  }
  return ids.slice(0, 6).map((id) => ({ id, why: '' }));
}

export function sanitizeInputs(rawPhrases: unknown, rawBody: unknown): { phrases: string[]; body: string[]; phraseIds: string[] } {
  const phraseIds = Array.isArray(rawPhrases) ? START_PHRASES.filter((p) => rawPhrases.includes(p.id)).map((p) => p.id as string) : [];
  const phrases = START_PHRASES.filter((p) => phraseIds.includes(p.id)).map((p) => p.text as string);
  const body = Array.isArray(rawBody) ? BODY_NOTES.filter((b) => rawBody.includes(b)).map((b) => b as string) : [];
  return { phrases, body, phraseIds };
}

function mock(phraseIds: string[]): string {
  const s = staticSuggestions(phraseIds);
  const picks = (s.length ? s : [{ id: 'huzursuzluk' }, { id: 'yorgunluk' }, { id: 'kirginlik' }]).slice(0, 3);
  return JSON.stringify({ suggest: picks.map((p) => ({ id: p.id, why: 'Anlattıklarında bunun izi olabilir mi?' })), thought: '' });
}

/** Hata fırlatmaz; üretilemezse yalnızca giriş cümlelerinin ipuçları döner. */
export async function suggestFeelings(text: string, phraseIds: string[], phrases: string[], body: string[]): Promise<SuggestResult> {
  try {
    const out = await completeText({
      system: SYSTEM,
      user: userMessage(text, phrases, body),
      maxTokens: 600,
      feature: 'feelings',
      mock: () => mock(phraseIds),
    });
    const parsed = parseSuggestion(extractJson(out), text);
    if (parsed.suggestions.length) return parsed;
  } catch (e) {
    console.error('[duygu önerisi] üretilemedi:', e instanceof Error ? e.message : 'bilinmeyen hata');
  }
  return { suggestions: staticSuggestions(phraseIds), thought: '' };
}
