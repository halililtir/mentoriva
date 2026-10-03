/**
 * GET /api/cron/weekly-report — Vercel cron (pazartesi 06:00 UTC = 09:00 İstanbul).
 * Vercel, CRON_SECRET tanımlıysa isteğe "Authorization: Bearer <CRON_SECRET>" ekler;
 * başka kimse bu ucu tetikleyemez.
 */

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { digest } from '@/lib/auth/tokens';
import { jsonError } from '@/lib/http';
import { sendWeeklyReport } from '@/lib/admin/report';
import { logError } from '@/lib/admin/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env['CRON_SECRET']?.trim();
  if (!secret) return jsonError(503, 'CRON_SECRET tanımlı değil');
  const given = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!timingSafeEqual(Buffer.from(digest(given)), Buffer.from(digest(secret)))) return jsonError(401, 'Yetkisiz');

  const result = await sendWeeklyReport();
  if (!result.sent) await logError('server', 'weekly-report', result.reason ?? 'gönderilemedi');
  return NextResponse.json(result, { status: result.sent ? 200 : 500 });
}
