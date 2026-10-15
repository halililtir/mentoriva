/**
 * Aramızda — tek oda.
 *   GET     → { room: { id, topic, me, myName, other, waiting }, messages: [{ id, mine, text, at }] }
 *   POST { invite: true } → { inviteUrl }  (yalnızca odayı açan, ikinci kişi yokken)
 *   DELETE  → odayı iki taraf için de siler.
 */

import { NextResponse } from 'next/server';
import { jsonError, readJson } from '@/lib/http';
import { hit } from '@/lib/rate-limit';
import { RATE_LIMITS } from '@/lib/features';
import { recordEvent } from '@/lib/admin/metrics';
import { SITE_URL } from '@/lib/site';
import { closeRoom, listMessages, renewInvite } from '@/lib/bridge/store';
import { requireMember } from '@/lib/bridge/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireMember(req, params.id);
  if (ctx instanceof NextResponse) return ctx;
  const { user, room, me } = ctx;
  if (!(await hit('bridge-read', user.username, RATE_LIMITS.BRIDGE_READ_USER))) return jsonError(429, 'Biraz yavaşlayalım.');
  const messages = await listMessages(room.id);
  return NextResponse.json({
    room: { id: room.id, topic: room.topic, me, myName: room.members[me]?.name ?? '', other: room.members[me === 0 ? 1 : 0]?.name ?? null, waiting: room.members.length < 2 },
    messages: messages.map((m) => ({ id: m.id, mine: m.from === me, text: m.text, at: m.at })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireMember(req, params.id);
  if (ctx instanceof NextResponse) return ctx;
  const body = await readJson(req);
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
