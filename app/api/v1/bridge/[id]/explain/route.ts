/**
 * POST /api/v1/bridge/[id]/explain { messageId } — karşı tarafın mesajını
 * yalnızca isteyene özel, taraf tutmadan anlamaya yardım. Hak düşmez; sınırlı.
 */

import { NextResponse } from 'next/server';
import { jsonError, readJson } from '@/lib/http';
import { hit } from '@/lib/rate-limit';
import { RATE_LIMITS } from '@/lib/features';
import { listMessages } from '@/lib/bridge/store';
import { requireMember } from '@/lib/bridge/guard';
import { explainForMe } from '@/lib/bridge/ai';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireMember(req, params.id);
  if (ctx instanceof NextResponse) return ctx;
  const { user, room, me } = ctx;
  if (!(await hit('bridge-help', user.username, RATE_LIMITS.BRIDGE_HELP_USER))) return jsonError(429, 'Biraz sonra tekrar dene.');
  const body = await readJson(req);
  const messages = await listMessages(room.id);
  const target = messages.find((m) => m.id === body?.['messageId'] && m.from !== me);
  if (!target) return jsonError(400, 'Mesaj bulunamadı.');
  const result = await explainForMe({ topic: room.topic, messages: messages.slice(0, messages.indexOf(target) + 1), viewer: me, target });
  return result ? NextResponse.json(result) : jsonError(502, 'Şu an olmadı; biraz sonra tekrar dene.');
}
