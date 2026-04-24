import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const c = await cookies();
  if (c.get('mentoriva_admin')?.value === 'yes') {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
