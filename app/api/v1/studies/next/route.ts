/**
 * POST /api/v1/studies/next { token, turns: [{q, a}] }
 *   → { reflect, question, done } | { crisis: true, message }
 * Hak düşmez (bedel başlangıçta alındı); izin ve saatlik sınırla korunur.
 */

import { NextResponse } from 'next/server';
import { jsonError, readJson } from '@/lib/http';
import { hit } from '@/lib/rate-limit';
import { CRISIS_RESPONSE, RATE_LIMITS } from '@/lib/features';
import { getSessionUser } from '@/lib/auth/session';
import { moderateInput } from '@/lib/safety/moderation';
import { recordEvent } from '@/lib/admin/metrics';
import { STUDY_MAX_QUESTIONS } from '@/lib/studies/guided-content';
import { nextQuestion } from '@/lib/studies/guided';
import { sanitizeTurns, verifyStudy } from '@/lib/studies/guided-server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın.');
  if (!(await hit('study-step', user.username, RATE_LIMITS.STUDY_STEP_USER))) return jsonError(429, 'Biraz yavaşlayalım; birkaç dakika sonra devam et.');

  const body = await readJson(req);
  const auth = await verifyStudy(body?.['token'], user.username);
  if (!auth) return jsonError(403, 'Çalışmanın süresi doldu; yeniden başlayabilirsin.');
  const turns = sanitizeTurns(body?.['turns']);
  if (!turns) return jsonError(400, 'Geçersiz istek');
  // Açılış + üretilen sorular: en fazla STUDY_MAX_QUESTIONS üretilmiş soru
  if (turns.length > STUDY_MAX_QUESTIONS) return NextResponse.json({ reflect: '', question: '', done: true });

  const moderation = moderateInput(turns[turns.length - 1]!.a);
  if (!moderation.allowed) {
    await recordEvent('crisis');
    return NextResponse.json({ crisis: true, message: CRISIS_RESPONSE[moderation.reason] });
  }

  try {
    const next = await nextQuestion(auth.study, turns, turns.length === STUDY_MAX_QUESTIONS);
    if (!next) throw new Error('Geçersiz çıktı');
    if (next.crisis) return NextResponse.json({ crisis: true, message: CRISIS_RESPONSE.crisis });
    return NextResponse.json({ reflect: next.reflect, question: next.question, done: next.done });
  } catch {
    return jsonError(502, 'Bir sonraki soruyu şu an hazırlayamadık. Tekrar dene ya da çalışmayı bitir.');
  }
}
