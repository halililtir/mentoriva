import { NextResponse } from 'next/server';
import { ensureDaily } from '@/lib/daily';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Günün sorusu ve tüm aktif mentorların cevabı. Herkese açık; giriş gerekmez. */
export async function GET() {
  const entry = await ensureDaily();
  if (!entry) {
    return NextResponse.json({ error: 'Günün cevapları hazırlanıyor, birazdan tekrar dene.' }, { status: 503 });
  }
  return NextResponse.json(entry, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
