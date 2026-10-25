/**
 * POST /api/v1/bridge/[id]/send { text, token } — onaylanan öneriyi ortak alana
 * yazar. Metin, taslak izninin taşıdığı özetle birebir aynı olmalı.
 */

import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { jsonError, readJson } from '@/lib/http';
import { verifyJson } from '@/lib/signing';
import { getKV } from '@/lib/kv';
import { recordEvent } from '@/lib/admin/metrics';
import { addMessage } from '@/lib/bridge/store';
import { requireMember } from '@/lib/bridge/guard';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireMember(req, params.id);
  if (ctx instanceof NextResponse) return ctx;
  const { user, room, me } = ctx;
  if (room.members.length < 2) return jsonError(400, 'Karşı taraf henüz katılmadı.');
  const body = await readJson(req);
  const text = typeof body?.['text'] === 'string' ? body['text'] : '';
  const token = typeof body?.['token'] === 'string' ? body['token'] : '';
  const ok = await verifyJson<{ r: string; u: string; h: string }>('bridge-send', token);
  if (!ok || ok.r !== room.id || ok.u !== user.username || ok.h !== createHash('sha256').update(text).digest('hex')) {
    return jsonError(400, 'Bu öneri artık geçerli değil; yeniden hazırlat.');
  }
  // İzin tek kullanımlık (atomik): aynı öneri iki kez gönderilemez.
  const kv = getKV();
  const usedKey = `bridge-sent:${createHash('sha256').update(token).digest('hex')}`;
  if ((await kv.incr(usedKey)) !== 1) return jsonError(409, 'Bu öneri zaten gönderildi.');
  await kv.expire(usedKey, 60 * 60).catch(() => 0);
  const message = await addMessage(room, me, text);
  if (!message) return jsonError(404, 'Bu konuşma kapatıldı.');
  await recordEvent('bridge_message');
  return NextResponse.json({ message: { id: message.id, mine: true, text: message.text, at: message.at } });
}
