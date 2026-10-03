/**
 * /api/v1/badges — oturum açmış kullanıcının işaretleri.
 *   GET  → { earned: [{ id, at, by }], unseen: [id] }
 *   POST → hepsini görüldü işaretle
 */

import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/http';
import { getSessionUser } from '@/lib/auth/session';
import { getBadges, markBadgesSeen, unseenBadges } from '@/lib/badges';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş gerekli');
  const [earned, unseen] = await Promise.all([getBadges(user.username), unseenBadges(user.username)]);
  return NextResponse.json({ earned, unseen: unseen.map((b) => b.id) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş gerekli');
  await markBadgesSeen(user.username);
  return NextResponse.json({ success: true });
}
