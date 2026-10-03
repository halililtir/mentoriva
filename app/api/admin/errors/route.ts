/** GET /api/admin/errors — son sunucu ve tarayıcı hataları (yalnızca admin çerezi). */

import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/http';
import { isAdmin } from '@/lib/auth/session';
import { readErrors } from '@/lib/admin/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  return NextResponse.json({ entries: await readErrors(150) }, { headers: { 'Cache-Control': 'no-store' } });
}
