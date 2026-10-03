/**
 * /api/admin/report — haftalık özet (yalnızca admin çerezi).
 *   GET  → önizleme (veri + düz metin)
 *   POST → ADMIN_EMAIL adresine şimdi gönder
 */

import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/http';
import { isAdmin } from '@/lib/auth/session';
import { buildWeeklyReport, renderWeeklyReport, sendWeeklyReport } from '@/lib/admin/report';
import { logAdminAction } from '@/lib/admin/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const report = await buildWeeklyReport();
  return NextResponse.json(
    { report, text: renderWeeklyReport(report).text, recipient: process.env['ADMIN_EMAIL']?.trim() || null },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const result = await sendWeeklyReport();
  if (!result.sent) return jsonError(400, result.reason ?? 'Gönderilemedi');
  await logAdminAction('Haftalık özet gönderildi', process.env['ADMIN_EMAIL']?.trim() ?? '');
  return NextResponse.json({ success: true });
}
