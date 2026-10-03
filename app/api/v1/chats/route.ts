/**
 * Kaydedilen sohbetler (yalnızca kullanıcının isteğiyle; lib/chats.ts).
 *   GET  → { chats: özetler, limit }
 *   POST { mentorId, messages } → { chat } | 403 CHAT_LIMIT
 */

import { NextResponse } from 'next/server';
import { jsonError, readJson } from '@/lib/http';
import { getSessionUser } from '@/lib/auth/session';
import { SAVED_CHAT_LIMIT, createChat, isMentorId, listChats, sanitizeMessages } from '@/lib/chats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  return NextResponse.json({ chats: await listChats(user.username), limit: SAVED_CHAT_LIMIT }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  const body = await readJson(req);
  if (!isMentorId(body?.['mentorId'])) return jsonError(400, 'Geçersiz mentor');
  const messages = sanitizeMessages(body?.['messages']);
  if (!messages) return jsonError(400, 'Kaydedilecek sohbet geçersiz');

  const result = await createChat(user.username, body['mentorId'], messages);
  if (!result.ok) {
    return jsonError(403, `Şimdilik en fazla ${SAVED_CHAT_LIMIT} sohbet kaydedebilirsin.`, 'CHAT_LIMIT');
  }
  return NextResponse.json({ chat: result.chat });
}
