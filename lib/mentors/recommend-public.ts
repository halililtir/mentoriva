/** "Meselemi yazayım, sen öner" — istemci ve sunucunun ortak sınırları ve tipi. */

import type { MentorId } from '@/types';

export interface MentorPick {
  id: MentorId;
  /** Bu mentorun bakışı bu meseleye neden yararlı olabilir (tek cümle). */
  why: string;
}

export const RECOMMEND_TEXT_MIN = 10;
export const RECOMMEND_TEXT_MAX = 1000;
