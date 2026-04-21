import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  const cookieStore = await cookies();
  const session = cookieStore.get('mentoriva_admin_session');

  if (session?.value === 'true') {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
