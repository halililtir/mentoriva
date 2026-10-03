/**
 * Mentor erişim kuralları — sunucu tarafında uygulanır (arayüz yalnızca yansıtır).
 *  - Bir soruda en fazla DEFAULT_MAX_MENTORS mentor; "tam-meclis" ayrıcalığı sınırı kaldırır.
 *  - Erken erişimdeki mentorlar yalnızca "erken-erisim" ayrıcalığı olanlara açıktır
 *    (Kurucu Üye, Destekçi). Liste admin panelinden yönetilir (lib/mentors/access-server.ts).
 *
 * Saf fonksiyonlar (maxMentorsFor, canUseMentor, checkMentorSelection) istemcide de kullanılır.
 */

import { DEFAULT_MAX_MENTORS } from '@/lib/badges-public';
import { EARLY_ACCESS_MENTORS } from '@/lib/mentors/metadata';
import { MENTOR_IDS, type MentorId } from '@/types';

export function maxMentorsFor(perks: readonly string[]): number {
  return perks.includes('tam-meclis') ? MENTOR_IDS.length : DEFAULT_MAX_MENTORS;
}

export function canUseMentor(id: MentorId, perks: readonly string[], early: readonly MentorId[] = EARLY_ACCESS_MENTORS): boolean {
  return !early.includes(id) || perks.includes('erken-erisim');
}

/** Hata mesajı ya da null (izin var). */
export function checkMentorSelection(ids: readonly MentorId[], perks: readonly string[], early: readonly MentorId[]): string | null {
  if (ids.some((id) => !canUseMentor(id, perks, early))) return 'Bu mentor şimdilik yalnızca erken erişimi olan üyelere açık.';
  const max = maxMentorsFor(perks);
  if (ids.length > max) return `Bir soruya en fazla ${max} mentor seçebilirsin.`;
  return null;
}
