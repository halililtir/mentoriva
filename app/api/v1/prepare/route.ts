/**
 * POST /api/v1/prepare — "Söyleyeceğimi hazırla".
 *
 * Request:  { to?, text, matters?, styles: ('sakin'|'net'|'sinir')[] }
 * Response: { versions, kept, remaining } | { safety: true, remaining } | { crisis }
 *
 * Üyelere açık, 1 hak kullanır; üretilemezse ya da güvenlik nedeniyle
 * yeniden yazılmazsa hak iade edilir. Metin saklanmaz.
 */

import { NextResponse } from 'next/server';
import { CRISIS_RESPONSE } from '@/lib/features';
import { moderateInput } from '@/lib/safety/moderation';
import { recordEvent } from '@/lib/admin/metrics';
import { logError } from '@/lib/admin/errors';
import { readJson } from '@/lib/http';
import { apiError, authorizeMentorRequest } from '@/lib/sse';
import { recordQuestion, releaseQuestion, reserveQuestion } from '@/lib/auth/users';
import { prepareMessage, sanitizePrepare } from '@/lib/prepare';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  const auth = await authorizeMentorRequest(request, 'chat');
  if ('response' in auth) return auth.response;
  const { user } = auth;

  const input = sanitizePrepare(await readJson(request));
  if (typeof input === 'string') return apiError(400, 'INVALID_REQUEST', input);

  const moderation = moderateInput(`${input.text}\n${input.matters}`);
  if (!moderation.allowed) {
    await recordEvent('crisis');
    return NextResponse.json({ crisis: CRISIS_RESPONSE[moderation.reason] });
  }

  const reservation = await reserveQuestion(user);
  if (!reservation) return apiError(429, 'QUOTA_EXCEEDED', 'Bugünkü hakların doldu. Yarın yeniden görüşmek üzere.');

  try {
    const result = await prepareMessage(input);
    if (result.safety) {
      await releaseQuestion(user, reservation).catch(() => {});
      return NextResponse.json({ safety: true, remaining: reservation.remaining + 1 });
    }
    await recordQuestion(user.username).catch(() => {});
    await recordEvent('prepare');
    return NextResponse.json({ ...result, remaining: reservation.remaining });
  } catch (e) {
    await logError('server', 'prepare', e);
    await releaseQuestion(user, reservation).catch(() => {});
    return apiError(503, 'INVALID_REQUEST', 'Şu an hazırlanamadı. Hakkın iade edildi, biraz sonra tekrar dene.');
  }
}
