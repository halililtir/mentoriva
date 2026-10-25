/**
 * POST /api/v1/bridge/join { id, token, consent } — davetle odaya katılma.
 * Katılan kişi kuralları ayrıca onaylar (ham metin gitmez, oda kapanınca silinir).
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { jsonError, readJson } from '@/lib/http';
import { hit } from '@/lib/rate-limit';
import { RATE_LIMITS } from '@/lib/features';
import { recordEvent } from '@/lib/admin/metrics';
import { MAX_OPEN_ROOMS, getRoom, isRoomId, joinRoom } from '@/lib/bridge/store';
import { displayName } from '@/lib/bridge/guard';
import { digest } from '@/lib/auth/tokens';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Katılmak için giriş yapmalısın.');
  if (!(await hit('bridge-join', user.username, RATE_LIMITS.BRIDGE_JOIN_USER))) return jsonError(429, 'Biraz sonra tekrar dene.');
  const body = await readJson(req);
  const id = body?.['id'];
  const token = typeof body?.['token'] === 'string' ? body['token'] : '';
  if (!isRoomId(id) || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) return jsonError(400, 'Davet bağlantısı geçersiz.');
  if (body?.['consent'] !== true) return jsonError(400, 'Katılmak için kuralları onaylamalısın.');
  const result = await joinRoom(id, token, user.username, displayName(user));
  if (result === 'invalid') return jsonError(400, 'Davet bağlantısının süresi dolmuş ya da kullanılmış. Daveti gönderen kişiden yeni bir bağlantı isteyebilirsin.');
  if (result === 'self') return jsonError(400, 'Bu konuşmayı sen açtın; bağlantıyı konuşmak istediğin kişiye gönder.');
  if (result === 'full') return jsonError(400, 'Bu konuşmada zaten iki kişi var.');
  if (result === 'limit') return jsonError(400, `Aynı anda en fazla ${MAX_OPEN_ROOMS} açık konuşman olabilir; önce birini kapat.`);
  await recordEvent('bridge_join');
  return NextResponse.json({ id: result.id });
}

/** GET ?id=&t= — davet ekranı için konu ve davet edenin adı (geçerli davet anahtarıyla). */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const id = q.get('id');
  const token = q.get('t') ?? '';
  const room = isRoomId(id) ? await getRoom(id) : null;
  if (!room || !room.invite || room.invite.exp < Date.now() || room.members.length >= 2 || room.invite.hash !== digest(token)) {
    return jsonError(404, 'Davet bulunamadı ya da süresi dolmuş.');
  }
  return NextResponse.json({ topic: room.topic, from: room.members[0]?.name ?? 'Biri' });
}
