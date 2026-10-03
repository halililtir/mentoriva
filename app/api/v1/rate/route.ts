/**
 * POST /api/v1/rate — "Bu cevap işine yaradı mı?"
 *
 *   { mentorId, value: 'up' | 'down' }         → oy
 *   { mentorId, value: 'reason', reason }      → 👎 sonrası isteğe bağlı neden
 *
 * Oturum gerekmez (günün sorusu herkese açık); IP başına sınırlıdır.
 * Yalnızca sayaç artar; cevap metni ya da kullanıcı saklanmaz.
 */

import { NextResponse } from 'next/server';
import { getClientIp, jsonError, readJson } from '@/lib/http';
import { hit, RATE_LIMITS } from '@/lib/rate-limit';
import { isActiveMentor } from '@/lib/mentors/metadata';
import { DOWN_REASONS, recordDownReason, recordRating, type DownReason } from '@/lib/admin/ratings';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!(await hit('rate', getClientIp(req), RATE_LIMITS.RATE_IP))) return jsonError(429, 'Çok fazla istek');

  const body = await readJson(req);
  const mentorId = String(body?.['mentorId'] ?? '');
  const value = body?.['value'];
  if (!isActiveMentor(mentorId)) return jsonError(400, 'Geçersiz mentor');

  try {
    if (value === 'up' || value === 'down') {
      await recordRating(mentorId, value);
    } else if (value === 'reason') {
      const reason = String(body?.['reason'] ?? '');
      if (!(reason in DOWN_REASONS)) return jsonError(400, 'Geçersiz neden');
      await recordDownReason(reason as DownReason);
    } else {
      return jsonError(400, 'Geçersiz değer');
    }
  } catch (e) {
    console.error('[rate] yazılamadı:', e instanceof Error ? e.message : e);
    return jsonError(503, 'Şu an kaydedilemedi');
  }
  return NextResponse.json({ success: true });
}
