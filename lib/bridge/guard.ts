/** "Aramızda" uçlarının ortak denetimi: oturum + oda + üyelik. */

import type { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { jsonError } from '@/lib/http';
import type { StoredUser } from '@/lib/auth/users';
import { getRoom, memberIndex, type Room } from './store';

export type MemberContext = { user: StoredUser; room: Room; me: 0 | 1 };

export async function requireMember(req: Request, id: string): Promise<MemberContext | NextResponse> {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  const room = await getRoom(id);
  if (!room) return jsonError(404, 'Bu konuşma artık yok; kapatılmış ya da süresi dolmuş olabilir.');
  const me = memberIndex(room, user.username);
  if (me === -1) return jsonError(404, 'Bu konuşma artık yok; kapatılmış ya da süresi dolmuş olabilir.');
  return { user, room, me };
}

export const displayName = (u: StoredUser) => (u.name?.trim() || 'Biri').slice(0, 40);
