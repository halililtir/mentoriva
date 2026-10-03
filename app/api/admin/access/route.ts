/**
 * /api/admin/access — erken erişim yönetimi (yalnızca admin çerezi).
 *   GET → { earlyMentors, earlyUsers: [{ username, name, badges }] }
 *   PUT { earlyMentors: MentorId[] } → listeyi kaydet (en az bir mentor herkese açık kalmalı)
 */

import { NextResponse } from 'next/server';
import { jsonError, readJson } from '@/lib/http';
import { isAdmin } from '@/lib/auth/session';
import { listUsers } from '@/lib/auth/users';
import { getBadges, perksFromBadges } from '@/lib/badges';
import { getEarlyMentors, setEarlyMentors } from '@/lib/mentors/access-server';
import { logAdminAction } from '@/lib/admin/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const [early, users] = await Promise.all([getEarlyMentors(), listUsers()]);
  const badges = await Promise.all(users.map((u) => getBadges(u.username).catch(() => [])));
  const earlyUsers = users
    .map((u, i) => ({ username: u.username, name: u.name ?? '', badges: (badges[i] ?? []).map((b) => b.id) }))
    .filter((u) => perksFromBadges(u.badges).includes('erken-erisim'));
  return NextResponse.json({ earlyMentors: early, earlyUsers }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const body = await readJson(req);
  const saved = await setEarlyMentors(body?.['earlyMentors']);
  if (!saved) return jsonError(400, 'En az bir mentor herkese açık kalmalı.');
  await logAdminAction('Erken erişim güncellendi', saved.length ? saved.join(', ') : 'boş', 'mentor listesi');
  return NextResponse.json({ success: true, earlyMentors: saved });
}
