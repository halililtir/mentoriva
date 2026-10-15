/**
 * Aramızda — odalar.
 *   GET                         → { rooms: [{ id, topic, other, waiting, updatedAt }] }
 *   POST { topic, consent }     → { id, inviteUrl }   (en fazla MAX_OPEN_ROOMS açık oda)
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { jsonError, readJson } from '@/lib/http';
import { hit } from '@/lib/rate-limit';
import { CRISIS_RESPONSE, RATE_LIMITS } from '@/lib/features';
import { moderateInput } from '@/lib/safety/moderation';
import { recordEvent } from '@/lib/admin/metrics';
import { SITE_URL } from '@/lib/site';
import { MAX_OPEN_ROOMS, TOPIC_MAX, createRoom, listRooms, memberIndex } from '@/lib/bridge/store';
import { displayName } from '@/lib/bridge/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  const rooms = await listRooms(user.username);
  return NextResponse.json({
    rooms: rooms.map((r) => {
      const me = memberIndex(r, user.username);
      const other = r.members[me === 0 ? 1 : 0];
      return { id: r.id, topic: r.topic, other: other?.name ?? null, waiting: r.members.length < 2, updatedAt: r.updatedAt };
    }),
    max: MAX_OPEN_ROOMS,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  if (!(await hit('bridge-create', user.username, RATE_LIMITS.BRIDGE_CREATE_USER))) return jsonError(429, 'Biraz sonra tekrar dene.');
  const body = await readJson(req);
  if (body?.['consent'] !== true) return jsonError(400, 'Devam etmek için kuralları onaylamalısın.');
  const topic = typeof body?.['topic'] === 'string' ? body['topic'].replace(/\s+/g, ' ').trim() : '';
  if (topic.length < 3 || topic.length > TOPIC_MAX) return jsonError(400, `Konu 3-${TOPIC_MAX} karakter olmalı.`);
  const moderation = moderateInput(topic);
  if (!moderation.allowed) {
    await recordEvent('crisis');
    return NextResponse.json({ crisis: CRISIS_RESPONSE[moderation.reason] });
  }
  const created = await createRoom(user.username, displayName(user), topic);
  if (created === 'limit') return jsonError(400, `Aynı anda en fazla ${MAX_OPEN_ROOMS} açık konuşman olabilir; önce birini kapat.`);
  await recordEvent('bridge_room');
  return NextResponse.json({ id: created.room.id, inviteUrl: `${SITE_URL}/aramizda/katil?r=${created.room.id}&t=${created.inviteToken}` });
}
