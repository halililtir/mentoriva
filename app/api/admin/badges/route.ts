/**
 * POST /api/admin/badges — toplu işaret verme (yalnızca admin çerezi).
 *   { badge: 'kurucu' }  → şu an kayıtlı TÜM üyelere verir (zaten olanlar atlanır)
 * Kapalı betadaki herkesi "Kurucu Üye" yapmak için.
 */

import { NextResponse } from 'next/server';
import { jsonError, readJson } from '@/lib/http';
import { isAdmin } from '@/lib/auth/session';
import { listUsers } from '@/lib/auth/users';
import { BADGE_BY_ID, GRANTABLE, giveBadge } from '@/lib/badges';
import { logAdminAction } from '@/lib/admin/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const body = await readJson(req);
  const badge = typeof body?.['badge'] === 'string' ? body['badge'] : '';
  if (!GRANTABLE.includes(badge)) return jsonError(400, 'Bu işaret elle verilemez');

  const users = await listUsers();
  let given = 0;
  for (const u of users) if (await giveBadge(u.username, badge, 'admin')) given++;
  await logAdminAction('Toplu işaret', `${users.length} üye`, `${BADGE_BY_ID[badge]!.name}: ${given} yeni`);
  return NextResponse.json({ success: true, given, total: users.length });
}
