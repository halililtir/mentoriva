import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { toPublicUser } from '@/lib/auth/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  // Misafir için 200 + null: tarayıcı konsolunu her sayfa yüklemesinde 401 ile kirletmesin.
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: await toPublicUser(user) });
}
