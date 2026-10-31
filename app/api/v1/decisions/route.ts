/**
 * Karar takibi (yalnızca kişi isterse).
 *   GET                                  → { decisions }
 *   POST { title, choice, why?, days }   → { decision }
 *   PATCH { id, outcome }                → { decision }
 *   DELETE ?id=                          → { success }
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { jsonError, readJson } from '@/lib/http';
import { hit } from '@/lib/rate-limit';
import { RATE_LIMITS } from '@/lib/features';
import { recordEvent } from '@/lib/admin/metrics';
import { DECISION_DAYS, DECISION_LIMITS, MAX_DECISIONS, addDecision, deleteDecision, listDecisions, setDecisionOutcome, type DecisionDays } from '@/lib/decisions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  return NextResponse.json({ decisions: await listDecisions(user.username) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  if (!(await hit('decisions', user.username, RATE_LIMITS.DECISIONS_USER))) return jsonError(429, 'Biraz sonra tekrar dene.');
  const body = await readJson(req);
  const title = text(body?.['title'], DECISION_LIMITS.title);
  const choice = text(body?.['choice'], DECISION_LIMITS.choice);
  const days = body?.['days'];
  if (!title || choice.length < 2 || !DECISION_DAYS.includes(days as DecisionDays)) return jsonError(400, 'Kararını yaz ve bir süre seç.');
  const decision = await addDecision(user.username, { title, choice, why: text(body?.['why'], DECISION_LIMITS.why), days: days as DecisionDays });
  if (decision === 'full') return jsonError(400, `En fazla ${MAX_DECISIONS} karar takip edebilirsin; önce birini sil.`);
  await recordEvent('decision_saved');
  return NextResponse.json({ decision });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  if (!(await hit('decisions', user.username, RATE_LIMITS.DECISIONS_USER))) return jsonError(429, 'Biraz sonra tekrar dene.');
  const body = await readJson(req);
  const outcome = text(body?.['outcome'], DECISION_LIMITS.outcome);
  if (typeof body?.['id'] !== 'string' || outcome.length < 2) return jsonError(400, 'Ne olduğunu birkaç kelimeyle yaz.');
  const decision = await setDecisionOutcome(user.username, body['id'], outcome);
  if (!decision) return jsonError(404, 'Karar bulunamadı.');
  await recordEvent('decision_outcome');
  return NextResponse.json({ decision });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  const id = new URL(req.url).searchParams.get('id') ?? '';
  return (await deleteDecision(user.username, id)) ? NextResponse.json({ success: true }) : jsonError(404, 'Karar bulunamadı.');
}
