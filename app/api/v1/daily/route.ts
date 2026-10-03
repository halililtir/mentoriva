import { NextResponse } from 'next/server';
import { ensureDaily } from '@/lib/daily';
import { logError } from '@/lib/admin/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Günün sorusu ve tüm aktif mentorların cevabı. Herkese açık; giriş gerekmez. */
export async function GET() {
  let entry;
  try {
    entry = await ensureDaily();
  } catch (e) {
    console.error('[daily] üretilemedi:', e instanceof Error ? e.message : e);
    await logError('server', 'daily', e);
    return NextResponse.json({ error: 'Günün cevapları şu an hazırlanamıyor.' }, { status: 503 });
  }
  if (!entry) {
    return NextResponse.json({ error: 'Günün cevapları hazırlanıyor, birazdan tekrar dene.' }, { status: 503 });
  }
  return NextResponse.json(entry, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
