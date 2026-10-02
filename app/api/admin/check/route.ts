import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (await isAdmin(request)) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false }, { status: 401 });
}
