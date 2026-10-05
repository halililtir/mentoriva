/** Farkındalık kartının istemci taslağı ve mentora aktarımı. */

import { INPUT_LIMITS } from '@/lib/features';

export interface CardDraft {
  situation: string;
  feelings: string[];
  thought: string;
  matters: string[];
  note: string;
  step: string;
}

/** Kartı mentora giden taslak soruya çevirir (soru sınırına sığacak şekilde). */
export function cardToQuestion(c: CardDraft): string {
  const parts = [
    c.situation && `Yaşadığım durum: ${c.situation}`,
    c.feelings.length && `Bana yakın gelen duygular: ${c.feelings.join(', ')}.`,
    c.thought && `Aklımdan geçen: "${c.thought}"`,
    (c.matters.length || c.note) && `Benim için önemli olan: ${[...c.matters, c.note].filter(Boolean).join(', ')}.`,
    'Bunu birlikte düşünmeme yardım eder misin?',
  ].filter(Boolean);
  return parts.join('\n').slice(0, INPUT_LIMITS.MAX_QUESTION_LENGTH);
}
