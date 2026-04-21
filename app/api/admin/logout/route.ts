import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(): Promise<Response> {
  const response = NextResponse.json({ success: true });
  response.cookies.set('mentoriva_admin_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
