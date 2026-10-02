/**
 * Paylaşım kartı izni: doğrulanmış kart içeriğini imzalar (lib/signing.ts).
 *
 * Doğrulama (cevap gerçekten üretildi mi?) Node ucunda yapılır; görsel Edge
 * ucunda çizilir. Edge ucu yalnızca imzası geçerli ve süresi dolmamış izni kabul eder.
 */

import { signJson, verifyJson } from '@/lib/signing';

export interface CardPayload {
  mentorId: string;
  question: string;
  highlight: string;
  quote: { text: string; source: string } | null;
  label?: string;
}

const TTL_MS = 5 * 60 * 1000;

export function signCard(payload: CardPayload): Promise<string | null> {
  return signJson('share-card', payload, TTL_MS);
}

export function verifyCard(token: string): Promise<(CardPayload & { exp: number }) | null> {
  return verifyJson<CardPayload>('share-card', token);
}
