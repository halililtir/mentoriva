/**
 * Netleştirme adımı (2026-10-05): soru çok kısa ya da belirsizse, mentorlar
 * cevap vermeden önce kişiye iki isteğe bağlı şey sorulur: biraz daha bağlam
 * ve bu soruyla ne aradığı. Yapay zekâ çağrısı yok; tamamen atlanabilir.
 *
 * Mentorlara ayrı ve açıkça işaretlenmiş bir not olarak gider; ekranda görünen
 * soru değişmez. Saf modül: istemci ve sunucu birlikte kullanır.
 */

export const INTENTS = [
  { id: 'anlamak', label: 'Neler olduğunu anlamak', forMentor: 'The person wants to understand what is going on in them or in the situation.' },
  { id: 'karar', label: 'Bir karar vermek', forMentor: 'The person is facing a decision and wants help thinking it through; they will decide themselves.' },
  { id: 'anlatmak', label: 'Sadece anlatmak, duyulmak', forMentor: 'The person mainly wants to be heard. Do not pile on advice; acknowledge, reflect, and offer at most one gentle thought.' },
  { id: 'bakis', label: 'Farklı bir bakış duymak', forMentor: 'The person wants a fresh perspective on something they already know well.' },
] as const;

export type IntentId = (typeof INTENTS)[number]['id'];

export interface QuestionContext {
  /** Kişinin eklediği kısa bağlam (isteğe bağlı). */
  detail?: string;
  intent?: IntentId;
}

export const CONTEXT_DETAIL_MAX = 500;

/** Kısa ya da tek başına anlamı belirsiz sorular için netleştirme önerilir. */
export function needsClarify(question: string): boolean {
  const words = question.trim().split(/\s+/).filter(Boolean).length;
  return words <= 6 || question.trim().length < 40;
}

/** İstekten gelen bağlamı doğrular; geçersiz alanlar düşer. */
export function sanitizeContext(raw: unknown): QuestionContext | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const detail = typeof o['detail'] === 'string' ? o['detail'].replace(/\s+/g, ' ').trim().slice(0, CONTEXT_DETAIL_MAX) : '';
  const intent = INTENTS.find((i) => i.id === o['intent'])?.id;
  if (!detail && !intent) return null;
  return { ...(detail ? { detail } : {}), ...(intent ? { intent } : {}) };
}

/** Mentora gidecek mesaj: soru + işaretli bağlam notu (talimat enjeksiyonuna karşı etiketli). */
export function messageForMentor(question: string, ctx: QuestionContext | null): string {
  if (!ctx) return question;
  const parts = [question];
  if (ctx.detail) parts.push(`\n\n<kisinin_ekledigi_baglam>\n${ctx.detail}\n</kisinin_ekledigi_baglam>`);
  const intent = INTENTS.find((i) => i.id === ctx.intent);
  if (intent) parts.push(`\n\n[Not: ${intent.forMentor}]`);
  return parts.join('');
}
