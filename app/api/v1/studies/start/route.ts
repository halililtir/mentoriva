/**
 * POST /api/v1/studies/start { studyId, answer }
 *   → { token, reflect, question, done, remaining } | { crisis: true, message }
 *
 * Çalışmanın bedeli (STUDY_COST hak) burada düşer; ilk soru üretilemezse iade.
 * Cevaplar saklanmaz; 2 saatlik imzalı izin sonraki adımlara bağlanır.
 */

import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { jsonError, readJson } from '@/lib/http';
import { hit } from '@/lib/rate-limit';
import { CRISIS_RESPONSE, RATE_LIMITS } from '@/lib/features';
import { getSessionUser } from '@/lib/auth/session';
import { releaseQuestion, reserveQuestion } from '@/lib/auth/users';
import { moderateInput } from '@/lib/safety/moderation';
import { recordEvent } from '@/lib/admin/metrics';
import { GUIDED_BY_ID, STUDY_ANSWER_MAX } from '@/lib/studies/guided-content';
import { nextQuestion } from '@/lib/studies/guided';
import { signStudy } from '@/lib/studies/guided-server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Çalışmaya başlamak için giriş yapmalısın.');
  if (!(await hit('study-start', user.username, RATE_LIMITS.STUDY_START_USER))) {
    return jsonError(429, 'Bir saat içinde çok fazla çalışma başlattın. Biraz sonra tekrar dene.');
  }

  const body = await readJson(req);
  const study = GUIDED_BY_ID.get(typeof body?.['studyId'] === 'string' ? body['studyId'] : '');
  if (!study) return jsonError(400, 'Geçersiz çalışma');
  const answer = typeof body?.['answer'] === 'string' ? body['answer'].trim() : '';
  if (answer.length < 5) return jsonError(400, 'Birkaç kelimeyle de olsa yaz.');
  if (answer.length > STUDY_ANSWER_MAX) return jsonError(400, `En fazla ${STUDY_ANSWER_MAX} karakter yazabilirsin.`);

  const moderation = moderateInput(answer);
  if (!moderation.allowed) {
    await recordEvent('crisis');
    return NextResponse.json({ crisis: true, message: CRISIS_RESPONSE[moderation.reason] });
  }

  const reservation = await reserveQuestion(user);
  if (!reservation) return NextResponse.json({ error: 'Bugünkü hakların doldu.', code: 'QUOTA_EXCEEDED' }, { status: 429 });

  try {
    const next = await nextQuestion(study, [{ q: study.opening, a: answer }], false);
    if (!next) throw new Error('Geçersiz çıktı');
    if (next.crisis) {
      await releaseQuestion(user, reservation).catch(() => {});
      return NextResponse.json({ crisis: true, message: CRISIS_RESPONSE.crisis });
    }
    const token = await signStudy({ id: randomUUID(), s: study.id, u: user.username });
    if (!token) throw new Error('İmza anahtarı yok');
    await recordEvent('study');
    return NextResponse.json({ token, reflect: next.reflect, question: next.question, done: next.done, remaining: reservation.remaining });
  } catch {
    await releaseQuestion(user, reservation).catch(() => {});
    return jsonError(502, 'Şu an soruyu hazırlayamadık. Hakkın iade edildi; biraz sonra tekrar dene.');
  }
}
