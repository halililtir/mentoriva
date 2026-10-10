/**
 * GET /api/cron/reminders — Vercel cron (her gün 06:00 UTC = 09:00 İstanbul).
 * Vercel, CRON_SECRET tanımlıysa "Authorization: Bearer <CRON_SECRET>" ekler.
 */

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { digest } from '@/lib/auth/tokens';
import { jsonError } from '@/lib/http';
import { sendDueReminders } from '@/lib/reminders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env['CRON_SECRET']?.trim();
  if (!secret) return jsonError(503, 'CRON_SECRET tanımlı değil');
  const given = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!timingSafeEqual(Buffer.from(digest(given)), Buffer.from(digest(secret)))) return jsonError(401, 'Yetkisiz');
  return NextResponse.json(await sendDueReminders());
}
