/**
 * GET /api/health — yapılandırma durumu (yalnızca var/yok bilgisi, gizli değer yok).
 * Canlıda bir özellik çalışmadığında hangi ayarın eksik olduğunu görmek için.
 */

import { NextResponse } from 'next/server';
import { getKV } from '@/lib/kv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const kvConfigured = !!(process.env['KV_REST_API_URL'] && process.env['KV_REST_API_TOKEN']);
  let kv: 'ok' | 'memory' | 'error' = kvConfigured ? 'ok' : 'memory';
  if (kvConfigured) {
    try {
      await getKV().get('health:ping');
    } catch {
      kv = 'error';
    }
  }
  const admin = process.env['ADMIN_SECRET']?.trim() ?? '';
  return NextResponse.json(
    {
      kv,
      ai: process.env['ANTHROPIC_API_KEY'] ? 'configured' : 'missing',
      email: process.env['RESEND_API_KEY'] ? 'configured' : 'missing',
      emailFrom: process.env['RESEND_FROM'] ? 'custom' : 'default',
      admin: !admin ? 'missing' : admin.length < 12 ? 'too_short' : 'ok',
      siteUrl: process.env['NEXT_PUBLIC_SITE_URL'] ?? null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
