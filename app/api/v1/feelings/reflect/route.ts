/**
 * POST /api/v1/feelings/reflect — "İçimde ne var?" sonunda Mentoriva'nın karşılığı.
 * Request: { card: { situation, feelings, thought, matters, note }, consent? }
 * Response: { reflection } | { crisis }
 *
 * Hak düşmez (ilk deneyimin ödülü); IP ve kullanıcı başına sınırlı; misafire açık
 * (misafirden yurt dışı aktarım onayı istenir). Metin saklanmaz.
 */

import { NextResponse } from 'next/server';
import { CRISIS_RESPONSE, RATE_LIMITS } from '@/lib/features';
import { moderateInput } from '@/lib/safety/moderation';
import { recordEvent } from '@/lib/admin/metrics';
import { getSessionUser } from '@/lib/auth/session';
import { getClientIp, jsonError, readJson } from '@/lib/http';
import { hitAll, type Limit } from '@/lib/rate-limit';
import { sanitizeCard } from '@/lib/studies/cards';
import { reflectFeelings } from '@/lib/feelings/reflect';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request): Promise<Response> {
  const user = await getSessionUser(request);
  const checks: Array<[string, string, Limit]> = [['feelings-reflect-ip', getClientIp(request), RATE_LIMITS.FEELINGS_IP]];
  if (user) checks.push(['feelings-reflect-user', user.username, RATE_LIMITS.FEELINGS_USER]);
  if (!(await hitAll(checks))) return jsonError(429, 'Biraz hızlı gittin; birkaç dakika sonra tekrar dene.');

  const body = await readJson(request);
  if (!user && body?.['consent'] !== true) {
    return jsonError(403, 'Yazdıklarının işlenmesi için onay kutusunu işaretlemelisin.', 'CONSENT_REQUIRED');
  }
  const card = sanitizeCard(body?.['card']);
  if (!card) return jsonError(400, 'Önce biraz anlatman gerekiyor.');

  const moderation = moderateInput([card.situation, card.thought, card.note, ...card.feelings].join('\n'));
  if (!moderation.allowed) {
    await recordEvent('crisis');
    return NextResponse.json({ crisis: CRISIS_RESPONSE[moderation.reason] });
  }

  const reflection = await reflectFeelings(card);
  if (!reflection) return jsonError(503, 'Şu an sana bir şey yazamadım; kartın aşağıda, biraz sonra yeniden deneyebilirsin.');
  await recordEvent('feelings_reflect');
  return NextResponse.json({ reflection }, { headers: { 'Cache-Control': 'no-store' } });
}
