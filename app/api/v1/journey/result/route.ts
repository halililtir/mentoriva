/**
 * POST /api/v1/journey/result  { token, answers: string[] }
 *   → { result }  |  { crisis: true, message }
 *
 * Bedel başlangıçta ödendi; burada yeniden hak düşülmez. İzin (token) yalnızca
 * sahibine aittir ve başarılı sonuçtan sonra tekrar kullanılamaz. Başarısız
 * denemede aynı izinle yeniden denenebilir.
 */

import { NextResponse } from 'next/server';
import { jsonError, readJson } from '@/lib/http';
import { hit } from '@/lib/rate-limit';
import { CRISIS_RESPONSE, RATE_LIMITS } from '@/lib/features';
import { getSessionUser } from '@/lib/auth/session';
import { moderateInput } from '@/lib/safety/moderation';
import { completeText } from '@/lib/claude/client';
import { verifyJson } from '@/lib/signing';
import { getKV } from '@/lib/kv';
import { ANSWER_MAX, QUESTION_COUNT } from '@/lib/journey/content';
import { RESULT_SYSTEM, resultUserMessage } from '@/lib/journey/prompts';
import { extractJson, parseResult, type JourneyTokenPayload } from '@/lib/journey/schema';
import { mockResult } from '@/lib/journey/mock';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Devam etmek için giriş yapmalısın.');
  if (!(await hit('journey-result', user.username, RATE_LIMITS.JOURNEY_RESULT_USER))) {
    return jsonError(429, 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.');
  }

  const body = await readJson(req);
  const token = typeof body?.['token'] === 'string' ? body['token'] : '';
  const payload = token ? await verifyJson<JourneyTokenPayload>('journey', token) : null;
  if (!payload || payload.u !== user.username) {
    return jsonError(403, 'Bu yolculuğun süresi dolmuş. Yeni bir yolculuk başlatabilirsin.');
  }

  const kv = getKV();
  if (await kv.get(`journey-done:${payload.jid}`)) {
    return jsonError(409, 'Bu yolculuğun sonucu zaten oluşturuldu.');
  }

  const rawAnswers = Array.isArray(body?.['answers']) ? (body!['answers'] as unknown[]) : [];
  const answers = Array.from({ length: QUESTION_COUNT }, (_, i) =>
    typeof rawAnswers[i] === 'string' ? (rawAnswers[i] as string).trim().slice(0, ANSWER_MAX) : '',
  );

  const moderation = moderateInput(answers.join('\n'));
  if (!moderation.allowed) {
    return NextResponse.json({ crisis: true, message: CRISIS_RESPONSE[moderation.reason] });
  }

  let parsed;
  try {
    const text = await completeText({
      system: RESULT_SYSTEM,
      user: resultUserMessage(payload.sp, payload.story, payload.questions.map((q, i) => ({ q, a: answers[i] ?? '' }))),
      maxTokens: 1600,
      mock: mockResult,
    });
    parsed = parseResult(extractJson(text));
  } catch {
    return jsonError(502, 'Şu an sonucunu hazırlayamadık. Cevapların duruyor; birazdan tekrar dene.');
  }

  if (!parsed.ok) {
    if (parsed.crisis) return NextResponse.json({ crisis: true, message: CRISIS_RESPONSE.crisis });
    return jsonError(502, 'Sonuç beklenen biçimde gelmedi. Cevapların duruyor; tekrar dener misin?');
  }

  await kv.set(`journey-done:${payload.jid}`, '1', { ex: 60 * 60 * 2 });
  return NextResponse.json({ result: parsed.value, startingPoint: payload.sp });
}
