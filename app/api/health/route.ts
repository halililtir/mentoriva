/**
 * GET /api/health — yapılandırma durumu (yalnızca var/yok bilgisi, gizli değer yok).
 * Canlıda bir özellik çalışmadığında hangi ayarın eksik olduğunu görmek için.
 */

import { NextResponse } from 'next/server';
import { getHealth } from '@/lib/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getHealth(), { headers: { 'Cache-Control': 'no-store' } });
}
