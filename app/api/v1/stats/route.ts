import { NextResponse } from 'next/server';
import { getKV } from '@/lib/kv';
import { jsonError } from '@/lib/http';
import { isAdmin } from '@/lib/auth/session';
import { MENTOR_IDS } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');

  const kv = getKV();
  const counts = await Promise.all(MENTOR_IDS.map((id) => kv.get(`stats:mentor:${id}`)));
  const mentorStats = Object.fromEntries(MENTOR_IDS.map((id, i) => [id, Number(counts[i]) || 0]));

  const raw = await kv.lrange<unknown>('stats:recent-questions', 0, 49);
  const recentQuestions = raw
    .map((r) => {
      try {
        // Eski kayıtlardaki kullanıcı alanı panele gönderilmez
        const v = (typeof r === 'string' ? JSON.parse(r) : r) as { q?: string; mentors?: string[]; at?: string };
        return v?.q ? { q: v.q, mentors: v.mentors ?? [], at: v.at ?? null } : null;
      } catch { return null; }
    })
    .filter(Boolean);

  return NextResponse.json({ mentorStats, recentQuestions });
}
