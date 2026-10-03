/**
 * "Bu cevap işine yaradı mı?" değerlendirmeleri — yalnızca sayaç.
 *
 * Redis anahtarları (120 gün TTL):
 *   stats:rating:<tarih>:<mentor>:<up|down>
 *   stats:rating-reason:<tarih>:<neden>
 *
 * Cevap metni, soru ya da kullanıcı saklanmaz.
 */

import { getKV, getMany } from '@/lib/kv';
import { todayKey } from '@/lib/time';
import { MENTOR_IDS, type MentorId } from '@/types';

export const DOWN_REASONS = {
  alakasiz: 'Soruma cevap değil',
  genel: 'Çok genel kaldı',
  uzun: 'Çok uzun',
  uslup: 'Üslubu rahatsız etti',
  yanlis: 'Yanlış ya da uydurma bilgi',
} as const;

export type DownReason = keyof typeof DOWN_REASONS;
export type RatingValue = 'up' | 'down';

const TTL = 60 * 60 * 24 * 120;

async function bump(key: string): Promise<void> {
  const kv = getKV();
  const n = await kv.incr(key);
  if (n === 1) await kv.expire(key, TTL);
}

export async function recordRating(mentorId: MentorId, value: RatingValue): Promise<void> {
  await bump(`stats:rating:${todayKey()}:${mentorId}:${value}`);
}

export async function recordDownReason(reason: DownReason): Promise<void> {
  await bump(`stats:rating-reason:${todayKey()}:${reason}`);
}

export interface RatingSummary {
  mentors: Array<{ id: MentorId; up: number; down: number }>;
  reasons: Array<{ id: DownReason; label: string; count: number }>;
}

export async function ratingSummary(dates: string[]): Promise<RatingSummary> {
  const mentorKeys = MENTOR_IDS.flatMap((m) => dates.flatMap((d) => [`stats:rating:${d}:${m}:up`, `stats:rating:${d}:${m}:down`]));
  const reasonIds = Object.keys(DOWN_REASONS) as DownReason[];
  const reasonKeys = reasonIds.flatMap((r) => dates.map((d) => `stats:rating-reason:${d}:${r}`));
  const [mv, rv] = await Promise.all([getMany<number | string>(mentorKeys), getMany<number | string>(reasonKeys)]);

  const per = dates.length * 2;
  const mentors = MENTOR_IDS.map((id, mi) => {
    let up = 0;
    let down = 0;
    for (let di = 0; di < dates.length; di++) {
      up += Number(mv[mi * per + di * 2]) || 0;
      down += Number(mv[mi * per + di * 2 + 1]) || 0;
    }
    return { id, up, down };
  });
  const reasons = reasonIds
    .map((id, ri) => ({
      id,
      label: DOWN_REASONS[id],
      count: dates.reduce((s, _, di) => s + (Number(rv[ri * dates.length + di]) || 0), 0),
    }))
    .sort((a, b) => b.count - a.count);
  return { mentors, reasons };
}
