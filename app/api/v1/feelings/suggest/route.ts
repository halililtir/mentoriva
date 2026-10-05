/**
 * POST /api/v1/feelings/suggest — "İçimde ne var?" kelime önerisi.
 *
 * Request:  { phrases: string[], body: string[], text: string }
 * Response: { suggestions: [{ id, why }], thought } | { crisis }
 *
 * Anlatım yoksa yapay zekâ çağrılmaz (giriş cümlelerinin ipuçları döner).
 * Hak düşmez; IP ve kullanıcı başına sınırlıdır; misafire açıktır.
 * Metin saklanmaz ve metriklere yazılmaz.
 */

import { NextResponse } from 'next/server';
import { CRISIS_RESPONSE, RATE_LIMITS } from '@/lib/features';
import { moderateInput } from '@/lib/safety/moderation';
import { recordEvent } from '@/lib/admin/metrics';
import { getSessionUser } from '@/lib/auth/session';
import { getClientIp, jsonError, readJson } from '@/lib/http';
import { hitAll, type Limit } from '@/lib/rate-limit';
import { FEELINGS_TEXT_MAX } from '@/lib/feelings/content';
import { sanitizeInputs, staticSuggestions, suggestFeelings } from '@/lib/feelings/suggest';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request): Promise<Response> {
  const user = await getSessionUser(request);
  const checks: Array<[string, string, Limit]> = [['feelings-ip', getClientIp(request), RATE_LIMITS.FEELINGS_IP]];
  if (user) checks.push(['feelings-user', user.username, RATE_LIMITS.FEELINGS_USER]);
  if (!(await hitAll(checks))) return jsonError(429, 'Biraz hızlı gittin; birkaç dakika sonra tekrar dene.');

  const body = await readJson(request);
  const text = typeof body?.['text'] === 'string' ? body['text'].trim() : '';
  if (text.length > FEELINGS_TEXT_MAX) return jsonError(400, `En fazla ${FEELINGS_TEXT_MAX} karakter yazabilirsin.`);
  const { phrases, body: notes, phraseIds } = sanitizeInputs(body?.['phrases'], body?.['body']);

  if (text && !user && body?.['consent'] !== true) {
    return jsonError(403, 'Yazdıklarının işlenmesi için onay kutusunu işaretlemelisin.', 'CONSENT_REQUIRED');
  }

  if (text) {
    const moderation = moderateInput(text);
    if (!moderation.allowed) {
      await recordEvent('crisis');
      return NextResponse.json({ crisis: CRISIS_RESPONSE[moderation.reason] });
    }
  }

  const result = text ? await suggestFeelings(text, phraseIds, phrases, notes) : { suggestions: staticSuggestions(phraseIds), thought: '' };
  await recordEvent('feelings');
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
