import { NextResponse } from 'next/server';
import { endAdminSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const res = NextResponse.json({ success: true });
  await endAdminSession(request, res);
  return res;
}
