/**
 * POST /api/v1/journey/start  { startingPoint, story }
 *   → { questions, token, remaining }  |  { crisis: true, message }
 *
 * Yolculuğun bedeli (JOURNEY_COST hak) burada düşülür; sorular üretilemezse
 * iade edilir. Kullanıcının anlatımı saklanmaz ve loglanmaz; yalnızca 1 saatlik
 * imzalı izne (token) konur ve sonuç adımında geri gelir.
 */

import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { jsonError, readJson, str } from '@/lib/http';
import { hit } from '@/lib/rate-limit';
import { CRISIS_RESPONSE, RATE_LIMITS } from '@/lib/features';
import { getSessionUser } from '@/lib/auth/session';
import { releaseQuestion, reserveQuestion, type Reservation } from '@/lib/auth/users';
import { moderateInput } from '@/lib/safety/moderation';
import { completeText } from '@/lib/claude/client';
import { signJson } from '@/lib/signing';
import { getKV } from '@/lib/kv';
import { JOURNEY_COST, STARTING_POINTS, STORY_MAX, STORY_MIN } from '@/lib/journey/content';
import { QUESTIONS_SYSTEM, questionsUserMessage } from '@/lib/journey/prompts';
import { extractJson, parseQuestions, type JourneyTokenPayload } from '@/lib/journey/schema';
import { mockQuestions } from '@/lib/journey/mock';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Yolculuğa başlamak için giriş yapmalısın.');
  if (!(await hit('journey-start', user.username, RATE_LIMITS.JOURNEY_START_USER))) {
    return jsonError(429, 'Bir saat içinde çok fazla yolculuk başlattın. Biraz dinlen, sonra devam et.');
  }

  const body = await readJson(req);
  if (!body) return jsonError(400, 'Geçersiz istek');

  const spRaw = str(body['startingPoint'], 200);
  const startingPoint = STARTING_POINTS.find((p) => p.id === spRaw)?.label ?? spRaw;
  const story = str(body['story'], STORY_MAX + 50);
  if (startingPoint.length < 3) return jsonError(400, 'Nerede olduğunu seç ya da kendi cümlenle yaz.');
  if (story.length < STORY_MIN) return jsonError(400, `Biraz daha anlatır mısın? En az ${STORY_MIN} karakter yeterli.`);
  if (story.length > STORY_MAX) return jsonError(400, `Anlatım en fazla ${STORY_MAX} karakter olabilir.`);

  const moderation = moderateInput(`${startingPoint}\n${story}`);
  if (!moderation.allowed) {
    return NextResponse.json({ crisis: true, message: CRISIS_RESPONSE[moderation.reason] });
  }

  // Bedel: JOURNEY_COST hak. Biri bile ayrılamazsa ayrılanlar iade edilir.
  const reservations: Reservation[] = [];
  for (let i = 0; i < JOURNEY_COST; i++) {
    const r = await reserveQuestion(user);
    if (!r) {
      for (const x of reservations) await releaseQuestion(user, x);
      return NextResponse.json(
        { error: `Kendine Yolculuk ${JOURNEY_COST} soru hakkı kullanır; bugünkü hakların yetmiyor.`, code: 'QUOTA_EXCEEDED' },
        { status: 429 },
      );
    }
    reservations.push(r);
  }
  const refund = async () => { for (const x of reservations) await releaseQuestion(user, x).catch(() => {}); };

  let parsed;
  try {
    const text = await completeText({
      system: QUESTIONS_SYSTEM,
      user: questionsUserMessage(startingPoint, story),
      maxTokens: 500,
      mock: mockQuestions,
    });
    parsed = parseQuestions(extractJson(text));
  } catch {
    await refund();
    return jsonError(502, 'Şu an soruları hazırlayamadık. Hakların iade edildi; biraz sonra tekrar dene.');
  }

  if (!parsed.ok) {
    await refund();
    if (parsed.crisis) return NextResponse.json({ crisis: true, message: CRISIS_RESPONSE.crisis });
    return jsonError(502, 'Sorular beklenen biçimde gelmedi. Hakların iade edildi; tekrar dener misin?');
  }

  const questions = parsed.value.map((q) => q.q);
  const token = await signJson<JourneyTokenPayload>(
    'journey',
    { jid: randomUUID(), u: user.username, sp: startingPoint, story, questions },
    60 * 60 * 1000,
  );
  if (!token) {
    await refund();
    return jsonError(503, 'Yolculuk şu an başlatılamıyor.');
  }

  // Yalnızca sayı — içerik yok
  void getKV().incr('stats:journeys').catch(() => {});

  return NextResponse.json({ questions, token, remaining: reservations[reservations.length - 1]!.remaining });
}
