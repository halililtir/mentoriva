/**
 * POST /api/v1/studies/finish { token, turns, takeaway }
 *   → { summary, open, steps } | { crisis: true, message }
 * Her çalışma bir kez bitirilir (`study-done:<id>`). Hak düşmez.
 */

import { NextResponse } from 'next/server';
import { getKV } from '@/lib/kv';
import { jsonError, readJson } from '@/lib/http';
import { hit } from '@/lib/rate-limit';
import { CRISIS_RESPONSE, RATE_LIMITS } from '@/lib/features';
import { getSessionUser } from '@/lib/auth/session';
import { moderateInput } from '@/lib/safety/moderation';
import { recordEvent } from '@/lib/admin/metrics';
import { STUDY_MIN_ANSWERS, STUDY_TAKEAWAY_MAX } from '@/lib/studies/guided-content';
import { finishStudy } from '@/lib/studies/guided';
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
  if (!turns || turns.length < STUDY_MIN_ANSWERS) return jsonError(400, `Bitirmek için en az ${STUDY_MIN_ANSWERS} cevap gerekli.`);
  const takeaway = typeof body?.['takeaway'] === 'string' ? body['takeaway'].trim().slice(0, STUDY_TAKEAWAY_MAX) : '';

  const moderation = moderateInput(`${turns[turns.length - 1]!.a}\n${takeaway}`);
  if (!moderation.allowed) {
    await recordEvent('crisis');
    return NextResponse.json({ crisis: true, message: CRISIS_RESPONSE[moderation.reason] });
  }

  // Tek kullanımlık: aynı izinle ikinci kez özet üretilmez
  const doneKey = `study-done:${auth.payload.id}`;
  if (await getKV().get(doneKey)) return jsonError(409, 'Bu çalışma zaten tamamlandı.');

  try {
    const result = await finishStudy(auth.study, turns, takeaway);
    if (!result) throw new Error('Geçersiz çıktı');
    if (result.crisis) return NextResponse.json({ crisis: true, message: CRISIS_RESPONSE.crisis });
    await getKV().set(doneKey, '1', { ex: 3 * 60 * 60 });
    await recordEvent('study_done');
    return NextResponse.json({ summary: result.summary, open: result.open, steps: result.steps });
  } catch {
    return jsonError(502, 'Özeti şu an hazırlayamadık. Biraz sonra tekrar dene.');
  }
}
