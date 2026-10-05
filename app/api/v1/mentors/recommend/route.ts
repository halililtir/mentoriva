/**
 * POST /api/v1/mentors/recommend
 *
 * "Meselemi yazayım, sen öner": kişinin anlattığına göre uygun mentorları
 * kısa gerekçeyle önerir. Kota düşmez; IP ve kullanıcı başına sınırlıdır.
 * Misafir de kullanabilir (önerilenler misafir sınırına göre kırpılır).
 *
 * Request:  { text: string }
 * Response: { picks: [{ id, why }] } | { crisis: string }
 *
 * Metin saklanmaz ve metriklere yazılmaz; yalnızca olay sayılır.
 */

import { NextResponse } from 'next/server';
import { CRISIS_RESPONSE, RATE_LIMITS } from '@/lib/features';
import { moderateInput } from '@/lib/safety/moderation';
import { recordEvent } from '@/lib/admin/metrics';
import { getPerks } from '@/lib/badges';
import { canUseMentor, maxMentorsFor } from '@/lib/mentors/access';
import { getEarlyMentors } from '@/lib/mentors/access-server';
import { ACTIVE_MENTORS } from '@/lib/mentors/metadata';
import { RECOMMEND_TEXT_MAX, RECOMMEND_TEXT_MIN, recommendMentors } from '@/lib/mentors/recommend';
import { getSessionUser } from '@/lib/auth/session';
import { GUEST_MAX_MENTORS } from '@/lib/auth/limits';
import { getClientIp, jsonError, readJson } from '@/lib/http';
import { hitAll, type Limit } from '@/lib/rate-limit';
import type { MentorId } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

/** Öneri en fazla bu kadar mentor içerir (seçim sınırından bağımsız). */
const MAX_PICKS = 3;

export async function POST(request: Request): Promise<Response> {
  const user = await getSessionUser(request);
  const ip = getClientIp(request);
  const checks: Array<[string, string, Limit]> = [['recommend-ip', ip, RATE_LIMITS.RECOMMEND_IP]];
  if (user) checks.push(['recommend-user', user.username, RATE_LIMITS.RECOMMEND_USER]);
  const allowed = await hitAll(checks);
  if (!allowed) return jsonError(429, 'Biraz fazla öneri istedin; bir süre sonra tekrar dene.');

  const body = await readJson(request);
  const text = typeof body?.['text'] === 'string' ? body['text'].trim() : '';
  if (text.length < RECOMMEND_TEXT_MIN) return jsonError(400, 'Biraz daha anlatır mısın? Bir iki cümle yeter.');
  if (text.length > RECOMMEND_TEXT_MAX) return jsonError(400, `En fazla ${RECOMMEND_TEXT_MAX} karakter yazabilirsin.`);

  // Misafir kayıt formunu görmediği için yurt dışı aktarım onayı burada istenir
  if (!user && body?.['consent'] !== true) return jsonError(403, 'Devam etmek için onay kutusunu işaretlemelisin.', 'CONSENT_REQUIRED');

  const moderation = moderateInput(text);
  if (!moderation.allowed) {
    await recordEvent('crisis');
    return NextResponse.json({ crisis: CRISIS_RESPONSE[moderation.reason] });
  }

  const [perks, early] = await Promise.all([user ? getPerks(user.username) : Promise.resolve([] as string[]), getEarlyMentors()]);
  const usable = ACTIVE_MENTORS.map((m) => m.id as MentorId).filter((id) => canUseMentor(id, perks, early));
  const max = Math.min(MAX_PICKS, user ? maxMentorsFor(perks) : GUEST_MAX_MENTORS);

  const picks = await recommendMentors(text, usable, max);
  if (picks.length === 0) return jsonError(503, 'Şu an öneri hazırlanamadı. Mentorları kartlarından seçebilirsin.');
  await recordEvent('recommend');
  return NextResponse.json({ picks }, { headers: { 'Cache-Control': 'no-store' } });
}
