import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const secret = (process.env['ADMIN_SECRET'] || '121017').trim();

    if (!password || password.trim() !== secret) {
      return NextResponse.json({ error: 'Yanlış anahtar' }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set('mentoriva_admin', 'yes', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 86400,
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }
}
