import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }

  const password = (typeof body.password === 'string' ? body.password : '').trim();

  if (!password) {
    return NextResponse.json({ error: 'Şifre gerekli' }, { status: 400 });
  }

  const secret = (process.env['ADMIN_SECRET'] || '121017').trim();

  if (password !== secret) {
    return NextResponse.json({ error: 'Yanlış anahtar' }, { status: 401 });
  }

  const isProduction = process.env.NODE_ENV === 'production';

  const response = NextResponse.json({ success: true });
  response.cookies.set('mentoriva_admin_session', 'true', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 saat
  });

  return response;
}
