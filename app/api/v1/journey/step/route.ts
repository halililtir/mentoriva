/**
 * Seçilen küçük adım — yalnızca kullanıcı "kaydet" dediğinde saklanır.
 *   GET    → { step | null }
 *   POST   { stepId, detail, topic, mentorId, label? } → kaydet ("ozel" adımda label zorunlu)
 *   PATCH  { status: 'done' | 'skipped' | 'pending' }
 *   DELETE → sil
 */

import { NextResponse } from 'next/server';
import { jsonError, readJson, str } from '@/lib/http';
import { getSessionUser } from '@/lib/auth/session';
import { SMALL_STEP_IDS, type SmallStepId } from '@/lib/journey/content';
import { deleteStep, getStep, saveStep, updateStepStatus } from '@/lib/journey/store';
import { MENTOR_IDS, type MentorId } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  return NextResponse.json({ step: await getStep(user.username) });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  const body = await readJson(req);
  const stepId = str(body?.['stepId'], 20);
  const mentorId = str(body?.['mentorId'], 20);
  const customLabel = str(body?.['label'], 160);
  if (stepId === 'ozel' ? customLabel.length < 3 : !(SMALL_STEP_IDS as string[]).includes(stepId)) return jsonError(400, 'Geçersiz adım');
  const step = await saveStep(user.username, {
    stepId: stepId as SmallStepId | 'ozel',
    customLabel,
    detail: str(body?.['detail'], 220),
    topic: str(body?.['topic'], 220),
    mentorId: ((MENTOR_IDS as readonly string[]).includes(mentorId) ? mentorId : 'marcus') as MentorId,
  });
  return NextResponse.json({ step });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  const body = await readJson(req);
  const status = body?.['status'];
  if (status !== 'done' && status !== 'skipped' && status !== 'pending') return jsonError(400, 'Geçersiz durum');
  const step = await updateStepStatus(user.username, status);
  return step ? NextResponse.json({ step }) : jsonError(404, 'Kayıtlı adım yok');
}

export async function DELETE(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  await deleteStep(user.username);
  return NextResponse.json({ success: true });
}
