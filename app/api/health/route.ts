/**
 * GET /api/health — yapılandırma durumu (yalnızca var/yok bilgisi, gizli değer yok).
 * Canlıda bir özellik çalışmadığında hangi ayarın eksik olduğunu görmek için.
 */

import { NextResponse } from 'next/server';
import { kvCredentials } from '@/lib/kv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const sanitize = (e: unknown) =>
  (e instanceof Error ? `${e.name}: ${e.message}${e.cause instanceof Error ? ` (${e.cause.message})` : ''}` : 'bilinmeyen')
    .replace(/https?:\/\/\S+/g, '<url>')
    .replace(/[A-Za-z0-9_-]{24,}/g, '<gizli>')
    .slice(0, 200);

/** Bir Redis bağlantı setini dener: 'ok' | hata özeti | null (tanımlı değil). */
async function probe(url?: string, token?: string): Promise<string | null> {
  if (!url || !token) return null;
  try {
    const { Redis } = await import('@upstash/redis');
    await new Redis({ url, token }).get('health:ping');
    return 'ok';
  } catch (e) {
    return sanitize(e);
  }
}

export async function GET() {
  const [upstashVars, kvVars] = await Promise.all([
    probe(process.env['UPSTASH_REDIS_REST_URL'], process.env['UPSTASH_REDIS_REST_TOKEN']),
    probe(process.env['KV_REST_API_URL'], process.env['KV_REST_API_TOKEN']),
  ]);
  const active = kvCredentials()?.source ?? null;
  const activeResult = active === 'UPSTASH_REDIS_REST' ? upstashVars : active === 'KV_REST_API' ? kvVars : null;
  const admin = process.env['ADMIN_SECRET']?.trim() ?? '';

  return NextResponse.json(
    {
      kv: active ? (activeResult === 'ok' ? 'ok' : 'error') : 'memory',
      kvActive: active,
      kvProbe: { UPSTASH_REDIS_REST: upstashVars, KV_REST_API: kvVars },
      ai: process.env['ANTHROPIC_API_KEY'] ? 'configured' : 'missing',
      email: process.env['RESEND_API_KEY'] ? 'configured' : 'missing',
      emailFrom: process.env['RESEND_FROM'] ? 'custom' : 'default',
      admin: !admin ? 'missing' : admin.length < 12 ? 'too_short' : 'ok',
      siteUrl: process.env['NEXT_PUBLIC_SITE_URL'] ?? null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
