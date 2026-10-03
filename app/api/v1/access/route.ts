/** GET /api/v1/access — herkese açık: erken erişimdeki mentorlar (arayüz kilidi için). */

import { NextResponse } from 'next/server';
import { getEarlyMentors } from '@/lib/mentors/access-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ earlyMentors: await getEarlyMentors() }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } });
}
