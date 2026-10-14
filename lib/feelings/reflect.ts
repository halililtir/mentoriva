/**
 * "İçimde ne var?" sonu: kişiye gerçek bir karşılık (2026-10-14).
 *
 * Önce kart ve "Kaydet" çıkıyordu; kişi beş adım anlatıp karşılığında hiçbir
 * şey almadığı için hayal kırıklığına uğruyordu. Artık Mentoriva:
 *   - anlattıklarında neyi fark ettiğini söyler (`heard`),
 *   - duygunun ne anlatıyor olabileceğini ve bunun anlaşılır olduğunu (`meaning`),
 *   - şimdi yapılabilecek bir iki somut şey önerir (`tryNow`),
 *   - uygun bir mentordan DOĞRULANMIŞ bir söz seçer (`quoteId`; metni model yazmaz).
 * Kişi hakkında söylenmeyen neden/geçmiş uydurmaz; tanı koymaz.
 */

import { completeText } from '@/lib/claude/client';
import { extractJson } from '@/lib/journey/schema';
import { VERIFIED_QUOTES } from '@/lib/mentors/quotes';
import { MENTOR_IDS, type MentorId } from '@/types';

export interface FeelingsInput {
  situation: string;
  feelings: string[];
  thought: string;
  matters: string[];
  note: string;
}

export interface FeelingsReflection {
  heard: string;
  meaning: string;
  tryNow: string[];
  /** Seçilen doğrulanmış söz (varsa). */
  quote: { mentorId: MentorId; text: string; source: string } | null;
  /** Mentorla devam için önerilen mentor. */
  mentorId: MentorId | null;
}

const catalog = Object.entries(VERIFIED_QUOTES)
  .flatMap(([mentor, { quotes }]) => quotes.map((q) => `- ${q.id} (${mentor}): ${q.themes.join(', ')} — ${q.text}`))
  .join('\n');

const SYSTEM = `You are Mentoriva, a warm and perceptive companion in a Turkish app. The person
has just finished a short exercise to put what they feel into words. They
deserve something real in return, not a form.

Write, in warm, natural, concrete Turkish addressed to "sen":
- "heard": 2-3 sentences showing you truly understood: name what you notice in
  what they wrote (a connection between their feeling and what matters to
  them, the weight of the situation, a strength). Specific to them.
- "meaning": 2-3 sentences on what this feeling may be telling them, and that
  it makes sense to feel this way. You may speak with warmth and conviction
  about feelings in general; about THIS person say "belki" once if needed.
- "tryNow": 1-2 small, concrete things they could do today or this week, that
  follow from what matters to them (e.g. a sentence to tell themselves, a short
  conversation, a moment of rest). Each at most 30 words. Not generic
  self-care slogans.
- "quoteId": the id of ONE verified quote from the catalog below whose meaning
  truly speaks to their situation, or "" if none fits well. Prefer a quote from
  the same mentor you suggest below when one fits. Never write a quote yourself.
- "mentor": the id of the mentor (jung, nietzsche, mevlana, marcus, seneca)
  whose way of thinking would help most if they want to continue.

Rules: Do not invent their history, causes or other people's motives; no
diagnosis or labels; no childhood or parents unless they mentioned them. Do not
tell them to see a professional unless they describe a crisis. No markdown, no
emojis.

Catalog (id (mentor): themes — text):
${catalog}

Return ONLY JSON: {"heard": "...", "meaning": "...", "tryNow": ["..."], "quoteId": "...", "mentor": "..."}`;

function userMessage(i: FeelingsInput): string {
  return [
    i.situation && `<situation>\n${i.situation}\n</situation>`,
    i.feelings.length && `<feelings>${i.feelings.join(', ')}</feelings>`,
    i.thought && `<thought_they_noticed>${i.thought}</thought_they_noticed>`,
    (i.matters.length || i.note) && `<what_matters>${[...i.matters, i.note].filter(Boolean).join(', ')}</what_matters>`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

const clean = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/[*#_`]/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : '';

export function parseReflection(raw: unknown): FeelingsReflection | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const heard = clean(o['heard'], 600);
  const meaning = clean(o['meaning'], 600);
  if (!heard || !meaning) return null;
  const tryNow = Array.isArray(o['tryNow']) ? o['tryNow'].map((x) => clean(x, 360)).filter(Boolean).slice(0, 2) : [];
  let quote: FeelingsReflection['quote'] = null;
  const qid = typeof o['quoteId'] === 'string' ? o['quoteId'] : '';
  for (const [mentor, entry] of Object.entries(VERIFIED_QUOTES)) {
    const q = entry.quotes.find((x) => x.id === qid);
    if (q) {
      quote = { mentorId: mentor as MentorId, text: q.text, source: `${entry.author}, ${`${q.work} ${q.ref}`.trim()}` };
      break;
    }
  }
  const m = o['mentor'];
  const mentorId = typeof m === 'string' && MENTOR_IDS.includes(m as MentorId) ? (m as MentorId) : quote?.mentorId ?? null;
  return { heard, meaning, tryNow, quote, mentorId };
}

function mock(): string {
  return JSON.stringify({
    heard: 'Emeğinin görülmesini istediğin bir anda sessizlikle karşılaşmışsın; kırgınlığın tam da önemsediğin yerden geliyor.',
    meaning: 'Kırgınlık çoğu zaman değer verdiğimiz bir şeyin karşılık bulmadığını söyler. Bunu hissetmen çok anlaşılır.',
    tryNow: ['Bugün kendine "emeğim değerli, görülmese de" demeyi dene.', 'Güvendiğin bir iş arkadaşına fikrini bir kez daha, kısaca anlat.'],
    quoteId: 'mar-16',
    mentor: 'marcus',
  });
}

export async function reflectFeelings(input: FeelingsInput): Promise<FeelingsReflection | null> {
  try {
    const out = await completeText({ system: SYSTEM, user: userMessage(input), maxTokens: 700, feature: 'feelings', mock });
    return parseReflection(extractJson(out));
  } catch (e) {
    console.error('[duygu yansıtma] üretilemedi:', e instanceof Error ? e.message : 'bilinmeyen hata');
    return null;
  }
}

