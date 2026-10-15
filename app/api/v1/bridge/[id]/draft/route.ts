/**
 * POST /api/v1/bridge/[id]/draft { text, instruction? } — yazanın ham metnini
 * karşı tarafın duyabileceği hâle getirir. Ham metin saklanmaz. 1 hak düşer;
 * üretilemezse ya da güvenlik nedeniyle yeniden yazılmazsa iade edilir.
 *   → { text, kept, token, remaining } | { safety: true, remaining } | { crisis }
 * `token`: gönderilecek metnin özetini taşıyan 30 dakikalık imzalı izin; böylece
 * yalnızca onaylanan öneri birebir gönderilebilir (elle değiştirilen metin geçmez).
 */

import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { jsonError, readJson } from '@/lib/http';
import { hit } from '@/lib/rate-limit';
import { CRISIS_RESPONSE, RATE_LIMITS } from '@/lib/features';
import { moderateInput } from '@/lib/safety/moderation';
import { recordEvent } from '@/lib/admin/metrics';
import { logError } from '@/lib/admin/errors';
import { signJson } from '@/lib/signing';
import { releaseQuestion, reserveQuestion } from '@/lib/auth/users';
import { MESSAGE_MAX, listMessages } from '@/lib/bridge/store';
import { requireMember } from '@/lib/bridge/guard';
import { SOFTEN_INSTRUCTIONS, softenForRoom, type SoftenInstruction } from '@/lib/bridge/ai';

export const runtime = 'nodejs';
export const maxDuration = 60;

const hashText = (t: string) => createHash('sha256').update(t).digest('hex');

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireMember(req, params.id);
  if (ctx instanceof NextResponse) return ctx;
  const { user, room, me } = ctx;
  if (room.members.length < 2) return jsonError(400, 'Karşı taraf henüz katılmadı.');
  if (!(await hit('bridge-draft', user.username, RATE_LIMITS.BRIDGE_DRAFT_USER))) return jsonError(429, 'Biraz yavaşlayalım; birkaç dakika sonra devam et.');

  const body = await readJson(req);
  const raw = typeof body?.['text'] === 'string' ? body['text'].trim() : '';
  if (raw.length < 3) return jsonError(400, 'Söylemek istediğini yaz.');
  if (raw.length > MESSAGE_MAX) return jsonError(400, `En fazla ${MESSAGE_MAX} karakter yazabilirsin.`);
  const ins = body?.['instruction'];
  const instruction = typeof ins === 'string' && ins in SOFTEN_INSTRUCTIONS ? (ins as SoftenInstruction) : undefined;

  const moderation = moderateInput(raw);
  if (!moderation.allowed) {
    await recordEvent('crisis');
    return NextResponse.json({ crisis: CRISIS_RESPONSE[moderation.reason] });
  }

  const reservation = await reserveQuestion(user);
  if (!reservation) return NextResponse.json({ error: 'Bugünkü hakların doldu.', code: 'QUOTA_EXCEEDED' }, { status: 429 });

  try {
    const result = await softenForRoom({ topic: room.topic, messages: await listMessages(room.id), viewer: me, raw, instruction });
    if (result.safety) {
      await releaseQuestion(user, reservation).catch(() => {});
      await recordEvent('bridge_safety');
      return NextResponse.json({ safety: true, remaining: reservation.remaining + 1 });
    }
    const token = await signJson('bridge-send', { r: room.id, u: user.username, h: hashText(result.text) }, 30 * 60 * 1000);
    return NextResponse.json({ text: result.text, kept: result.kept, token, remaining: reservation.remaining });
  } catch (e) {
    await logError('server', 'bridge-draft', e);
    await releaseQuestion(user, reservation).catch(() => {});
    return jsonError(502, 'Şu an hazırlanamadı. Hakkın iade edildi; biraz sonra tekrar dene.');
  }
}
