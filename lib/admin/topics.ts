/**
 * Soru konuları — kaba, anahtar kelimeye dayalı sınıflandırma.
 *
 * Amaç admin panelinde "insanlar en çok neyi soruyor?" sorusuna sayıyla
 * cevap vermek. Soru metni saklanmaz; yalnızca konu sayacı artar:
 *   stats:topic:<YYYY-MM-DD>:<konu>   (120 gün TTL)
 *
 * Desenler normalizeForModeration ile ASCII'ye katlanmış metne uygulanır.
 */

import { normalizeForModeration } from '@/lib/safety/moderation';
import { getKV, getMany } from '@/lib/kv';
import { todayKey } from '@/lib/time';

export const TOPICS = {
  iliski: { label: 'İlişki ve aşk', re: /\b(sevgili|ask|asik|iliski|evlil|bosan|ayril|kiskan|aldat|esim|partner|flort)/ },
  aile: { label: 'Aile', re: /\b(anne|baba|kardes|aile|cocug|ebeveyn|evlat)/ },
  kariyer: { label: 'İş ve kariyer', re: /\b(is(i|e|te|ten|im|imi|imde|imden|imle|ler|yeri|siz)?\b|kariyer|patron|mesle|maas|calis|universite|okul|sinav|bolum|terfi|girisim)/ },
  karar: { label: 'Karar ve kararsızlık', re: /(\bkarar|\bsecmeli|\bsecim|\bmi yoksa|(meli|mali) miyim|\bne yapmaliyim)/ },
  kaygi: { label: 'Kaygı ve korku', re: /\b(kayg|korku|korkuyor|endise|stres|panik|huzursuz)/ },
  ofke: { label: 'Öfke ve affetme', re: /\b(ofke|sinir|affet|kin|intikam|kirgin)/ },
  kayip: { label: 'Kayıp ve yas', re: /\b(kayb|olum|oldu|yas\b|vefat|ozlem|ozluyorum)/ },
  anlam: { label: 'Anlam ve amaç', re: /\b(anlam|amac|hayatin|neden yasi|bos(luk)?\b|varolus)/ },
  benlik: { label: 'Kendini tanıma', re: /\b(kendimi|kim oldugum|ozguven|kendine|benlik|degismek|aliskanl|tekrar eden)/ },
  yalnizlik: { label: 'Yalnızlık ve dostluk', re: /\b(yalniz|arkadas|dost|sosyal|kimse)/ },
} as const;

export type TopicId = keyof typeof TOPICS;

export function classifyQuestion(question: string): TopicId[] {
  const text = normalizeForModeration(question);
  return (Object.keys(TOPICS) as TopicId[]).filter((id) => TOPICS[id].re.test(text));
}

const key = (day: string, topic: string) => `stats:topic:${day}:${topic}`;

/** Sorunun konularını bugünün sayaçlarına ekler (konu yoksa "diger"). Hata fırlatmaz. */
export async function recordTopics(question: string): Promise<void> {
  try {
    const kv = getKV();
    const topics: string[] = classifyQuestion(question);
    if (topics.length === 0) topics.push('diger');
    const day = todayKey();
    await Promise.all(
      topics.map(async (t) => {
        const n = await kv.incr(key(day, t));
        if (n === 1) await kv.expire(key(day, t), 60 * 60 * 24 * 120);
      }),
    );
  } catch (e) {
    console.error('[topics] yazılamadı:', e instanceof Error ? e.message : e);
  }
}

/** Verilen günlerin toplamı, çoktan aza. */
export async function topicTotals(dates: string[]): Promise<Array<{ id: string; label: string; count: number }>> {
  const ids = [...Object.keys(TOPICS), 'diger'];
  const values = await getMany<number | string>(ids.flatMap((t) => dates.map((d) => key(d, t))));
  return ids
    .map((id, i) => ({
      id,
      label: id === 'diger' ? 'Diğer' : TOPICS[id as TopicId].label,
      count: dates.reduce((sum, _, di) => sum + (Number(values[i * dates.length + di]) || 0), 0),
    }))
    .sort((a, b) => b.count - a.count);
}
