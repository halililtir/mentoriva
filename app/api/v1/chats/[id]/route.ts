/**
 * Tek kayıtlı sohbet.
 *   GET    → { chat } (mesajlarıyla)
 *   PUT    { messages } → kayıtlı sohbet devam ettikçe güncellenir
 *   DELETE → siler
 */

import { NextResponse } from 'next/server';
import { jsonError, readJson } from '@/lib/http';
import { getSessionUser } from '@/lib/auth/session';
import { deleteChat, getChat, isChatId, sanitizeMessages, updateChat } from '@/lib/chats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function GET(req: Request, { params }: Ctx) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  if (!isChatId(params.id)) return jsonError(404, 'Sohbet bulunamadı');
  const chat = await getChat(user.username, params.id);
  if (!chat) return jsonError(404, 'Sohbet bulunamadı');
  return NextResponse.json({ chat }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(req: Request, { params }: Ctx) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  if (!isChatId(params.id)) return jsonError(404, 'Sohbet bulunamadı');
  const messages = sanitizeMessages((await readJson(req))?.['messages']);
  if (!messages) return jsonError(400, 'Sohbet geçersiz');
  const chat = await updateChat(user.username, params.id, messages);
  if (!chat) return jsonError(404, 'Sohbet bulunamadı');
  return NextResponse.json({ chat });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  if (!isChatId(params.id)) return jsonError(404, 'Sohbet bulunamadı');
  await deleteChat(user.username, params.id);
  return NextResponse.json({ success: true });
}
