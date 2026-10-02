/**
 * Kaydedilen geçici haritalar — yalnızca kullanıcının isteğiyle.
 *   GET            → { journeys }
 *   POST           { startingPoint, map, supportMentor, growthMentor } → kaydet
 *   DELETE ?id=..  → tek kayıt;  DELETE ?all=1 → tüm yolculuk verisi (adım dahil)
 */

import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { jsonError, readJson, str } from '@/lib/http';
import { getSessionUser } from '@/lib/auth/session';
import { deleteAllJourneyData, deleteJourney, listJourneys, sanitizeMap, saveJourney } from '@/lib/journey/store';
import { MENTOR_IDS, type MentorId } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const mentorOr = (v: unknown, fallback: MentorId): MentorId =>
  typeof v === 'string' && (MENTOR_IDS as readonly string[]).includes(v) ? (v as MentorId) : fallback;

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  return NextResponse.json({ journeys: await listJourneys(user.username) });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  const body = await readJson(req);
  const map = sanitizeMap(body?.['map']);
  if (!map) return jsonError(400, 'Kaydedilecek harita bulunamadı');
  const journey = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    startingPoint: str(body?.['startingPoint'], 200),
    map,
    supportMentor: mentorOr(body?.['supportMentor'], 'mevlana'),
    growthMentor: mentorOr(body?.['growthMentor'], 'marcus'),
  };
  await saveJourney(user.username, journey);
  return NextResponse.json({ journey });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  const url = new URL(req.url);
  if (url.searchParams.get('all') === '1') {
    await deleteAllJourneyData(user.username);
  } else {
    const id = url.searchParams.get('id');
    if (!id) return jsonError(400, 'id gerekli');
    await deleteJourney(user.username, id);
  }
  return NextResponse.json({ success: true });
}
