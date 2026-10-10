/**
 * POST /api/v1/notes/suggest — sohbetten hatırlanacak not önerisi.
 * Request: { messages: string[] } (yalnızca kişinin kendi mesajları)
 * Response: { notes: string[] } — kaydedilmez; kişi düzenleyip onaylarsa
 * ayrıca POST /api/v1/notes ile eklenir. Hak düşmez, sınırlıdır.
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { jsonError, readJson } from '@/lib/http';
import { hit } from '@/lib/rate-limit';
import { RATE_LIMITS, INPUT_LIMITS } from '@/lib/features';
import { SUGGEST_MAX_MESSAGES, suggestNotes } from '@/lib/memory/suggest';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  if (!(await hit('notes-suggest', user.username, RATE_LIMITS.NOTES_SUGGEST_USER))) {
    return jsonError(429, 'Biraz sonra tekrar dene.');
  }
  const body = await readJson(req);
  const raw = Array.isArray(body?.['messages']) ? (body['messages'] as unknown[]) : [];
  const messages = raw
    .filter((m): m is string => typeof m === 'string' && m.trim().length > 0)
    .map((m) => m.slice(0, INPUT_LIMITS.MAX_CHAT_MESSAGE_LENGTH))
    .slice(-SUGGEST_MAX_MESSAGES);
  if (messages.length === 0) return jsonError(400, 'Önerilecek bir şey yok');
  return NextResponse.json({ notes: await suggestNotes(messages) });
}
