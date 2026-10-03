/**
 * POST /api/v1/errors — tarayıcıda yakalanan hatalar (components/shared/ErrorReporter.tsx).
 * IP başına sınırlı; mesaj lib/admin/errors.ts içinde temizlenerek saklanır.
 */

import { NextResponse } from 'next/server';
import { getClientIp, jsonError, readJson, str } from '@/lib/http';
import { hit, RATE_LIMITS } from '@/lib/rate-limit';
import { logError } from '@/lib/admin/errors';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!(await hit('client-error', getClientIp(req), RATE_LIMITS.CLIENT_ERROR_IP))) {
    return NextResponse.json({ success: false }, { status: 429 });
  }
  const body = await readJson(req);
  const message = str(body?.['message'], 500);
  if (!message) return jsonError(400, 'Mesaj gerekli');
  const where = str(body?.['where'], 40) || 'window';
  const path = str(body?.['path'], 200);
  await logError('client', where, message, path);
  return NextResponse.json({ success: true });
}
