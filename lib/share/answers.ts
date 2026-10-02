/**
 * Paylaşım kartı için "bu cevap gerçekten üretildi mi?" kaydı.
 *
 * Kart görseli Mentoriva markasını taşıdığı için, karta yalnızca sunucunun
 * gerçekten ürettiği bir cevaptan alınmış cümle basılabilir. Mentor cevabı
 * tamamlandığında buraya yazılır; kart ucu cümlenin bu kayıtlarda geçtiğini
 * doğrular.
 *
 *   answers:<email>  → son 30 cevap (2 gün TTL)
 */

import { getKV } from '@/lib/kv';

export interface RecordedAnswer {
  mentorId: string;
  question: string;
  text: string;
  at: string;
}

const MAX_ANSWERS = 30;
const TTL_SECONDS = 60 * 60 * 48;
const key = (username: string) => `answers:${username}`;

export async function recordAnswer(username: string, answer: Omit<RecordedAnswer, 'at'>): Promise<void> {
  try {
    const kv = getKV();
    await kv.lpush(key(username), JSON.stringify({ ...answer, at: new Date().toISOString() }));
    await kv.ltrim(key(username), 0, MAX_ANSWERS - 1);
    await kv.expire(key(username), TTL_SECONDS);
  } catch (e) {
    console.error('[share] cevap kaydedilemedi:', e);
  }
}

export async function getRecordedAnswers(username: string): Promise<RecordedAnswer[]> {
  const raw = await getKV().lrange<unknown>(key(username), 0, MAX_ANSWERS - 1);
  return raw
    .map((r) => {
      try { return (typeof r === 'string' ? JSON.parse(r) : r) as RecordedAnswer; } catch { return null; }
    })
    .filter((r): r is RecordedAnswer => !!r && typeof r.text === 'string');
}

/** Boşluk ve tırnak farklarını yok sayarak karşılaştırma için normalleştirir. */
export function normalizeForMatch(s: string): string {
  return s.replace(/[“”"«»]/g, '"').replace(/[‘’']/g, "'").replace(/\s+/g, ' ').trim();
}

/** `highlight`, verilen cevaplardan birinde (aynı mentor ve soru için) birebir geçiyor mu? */
export function findMatchingAnswer(
  answers: Array<Pick<RecordedAnswer, 'mentorId' | 'question' | 'text'>>,
  mentorId: string,
  question: string,
  highlight: string,
): boolean {
  const h = normalizeForMatch(highlight);
  const q = normalizeForMatch(question);
  return answers.some(
    (a) => a.mentorId === mentorId && normalizeForMatch(a.question) === q && normalizeForMatch(a.text).includes(h),
  );
}
