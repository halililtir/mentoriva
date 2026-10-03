/** GET /api/admin/log — son admin işlemleri (yalnızca admin çerezi). */

import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/http';
import { isAdmin } from '@/lib/auth/session';
import { readAdminLog } from '@/lib/admin/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  return NextResponse.json({ entries: await readAdminLog(150) }, { headers: { 'Cache-Control': 'no-store' } });
}
