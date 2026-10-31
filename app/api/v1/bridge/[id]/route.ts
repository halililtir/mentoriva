/**
 * Aramızda — tek oda.
 *   GET     → { room: { id, topic, me, myName, other, waiting }, messages: [{ id, mine, text, at }] }
 *   POST { invite: true } → { inviteUrl }  (yalnızca odayı açan, ikinci kişi yokken)
 *   POST { mute: boolean } → { muted }     (bu konuşmanın e-posta bildirimi)
 *   DELETE  → odayı iki taraf için de siler.
 */

import { NextResponse } from 'next/server';
import { jsonError, readJson } from '@/lib/http';
import { hit } from '@/lib/rate-limit';
import { RATE_LIMITS } from '@/lib/features';
import { recordEvent } from '@/lib/admin/metrics';
import { SITE_URL } from '@/lib/site';
import { closeRoom, isMuted, listMessages, markHere, markSeen, renewInvite, setMuted } from '@/lib/bridge/store';
import { requireMember } from '@/lib/bridge/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireMember(req, params.id);
  if (ctx instanceof NextResponse) return ctx;
  const { user, room, me } = ctx;
  if (!(await hit('bridge-read', user.username, RATE_LIMITS.BRIDGE_READ_USER))) return jsonError(429, 'Biraz yavaşlayalım.');
  const messages = await listMessages(room.id);
  const [muted] = await Promise.all([isMuted(room.id, me), markSeen(room, me), markHere(room.id, me)]);
  return NextResponse.json({
    room: { id: room.id, topic: room.topic, me, myName: room.members[me]?.name ?? '', other: room.members[me === 0 ? 1 : 0]?.name ?? null, waiting: room.members.length < 2, muted },
    messages: messages.map((m) => ({ id: m.id, mine: m.from === me, text: m.text, at: m.at })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireMember(req, params.id);
  if (ctx instanceof NextResponse) return ctx;
  const body = await readJson(req);
  if (typeof body?.['mute'] === 'boolean') {
    if (!(await hit('bridge-mute', ctx.user.username, RATE_LIMITS.BRIDGE_HELP_USER))) return jsonError(429, 'Biraz sonra tekrar dene.');
    await setMuted(ctx.room.id, ctx.me, body['mute']);
    return NextResponse.json({ muted: body['mute'] });
  }
  if (body?.['invite'] !== true || ctx.me !== 0) return jsonError(400, 'Geçersiz istek');
  const token = await renewInvite(ctx.room);
  if (!token) return jsonError(400, 'Bu konuşmaya zaten biri katılmış.');
  return NextResponse.json({ inviteUrl: `${SITE_URL}/aramizda/katil?r=${ctx.room.id}&t=${token}` });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireMember(req, params.id);
  if (ctx instanceof NextResponse) return ctx;
  await closeRoom(ctx.room);
  await recordEvent('bridge_close');
  return NextResponse.json({ success: true });
}
