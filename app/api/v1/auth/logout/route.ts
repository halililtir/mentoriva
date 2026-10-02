import { NextResponse } from 'next/server';
import { endUserSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const res = NextResponse.json({ success: true });
  await endUserSession(req, res);
  return res;
}
