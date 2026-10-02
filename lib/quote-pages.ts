/** Alıntı sayfaları için yardımcılar (app/alintilar). */

import { ALL_MENTORS, type MentorMetadata } from '@/lib/mentors/metadata';
import { VERIFIED_QUOTES, type VerifiedQuote } from '@/lib/mentors/quotes';

export interface QuoteWithMentor {
  quote: VerifiedQuote;
  mentorId: string;
  author: string;
  mentor: MentorMetadata | undefined;
}

export function allQuotes(): QuoteWithMentor[] {
  return Object.entries(VERIFIED_QUOTES).flatMap(([mentorId, { author, quotes }]) =>
    quotes.map((quote) => ({ quote, mentorId, author, mentor: ALL_MENTORS.find((m) => m.id === mentorId) })),
  );
}

export function findQuote(id: string): QuoteWithMentor | undefined {
  return allQuotes().find((q) => q.quote.id === id);
}

export function sourceLine(q: QuoteWithMentor): string {
  return `${q.author}, ${`${q.quote.work} ${q.quote.ref}`.trim()}`;
}

/** Orijinal dilin adı — kaynak gösteriminde kullanılır. */
export const ORIGINAL_LANGUAGE: Record<string, string> = {
  seneca: 'Latince',
  marcus: 'Antik Yunanca',
  nietzsche: 'Almanca',
  mevlana: 'Farsça',
};
