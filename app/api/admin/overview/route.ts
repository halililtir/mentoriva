/**
 * GET /api/admin/overview — admin genel bakış (yalnızca admin çerezi).
 *
 * Döner: sistem durumu, üye özetleri, son 30 günün olay serileri,
 * mentor tercihleri (toplam + son 7 gün), son 7 günün konu dağılımı,
 * anonim son sorular ve okunmamış geri bildirim sayısı.
 */

import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/http';
import { isAdmin } from '@/lib/auth/session';
import { getKV, getMany, scanKeys } from '@/lib/kv';
import { listUsers } from '@/lib/auth/users';
import { getHealth } from '@/lib/health';
import { EVENTS, getSeries, lastDays } from '@/lib/admin/metrics';
import { topicTotals } from '@/lib/admin/topics';
import { MENTOR_IDS } from '@/types';
import { todayKey } from '@/lib/time';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY_MS = 86_400_000;

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');

  const kv = getKV();
  const dates = lastDays(30);
  const last7 = dates.slice(-7);
  const today = todayKey();
  const now = Date.now();

  const [health, users, series, topics, mentorTotals, mentorDaily, recentRaw, feedbackKeys] = await Promise.all([
    getHealth(),
    listUsers(),
    getSeries(dates),
    topicTotals(last7),
    getMany<number | string>(MENTOR_IDS.map((id) => `stats:mentor:${id}`)),
    getMany<number | string>(MENTOR_IDS.flatMap((id) => last7.map((d) => `stats:mentor:${id}:${d}`))),
    kv.lrange<unknown>('stats:recent-questions', 0, 49),
    scanKeys('feedback:*'),
  ]);

  const feedbacks = await getMany<{ status?: string } | string>(feedbackKeys);
  const unreadFeedback = feedbacks.filter((f) => {
    const v = typeof f === 'string' ? (JSON.parse(f) as { status?: string }) : f;
    return v && v.status !== 'read';
  }).length;

  const within = (iso: string | null | undefined, ms: number) => !!iso && now - new Date(iso).getTime() <= ms;
  const istanbulDay = (iso: string | null | undefined) => (iso ? todayKey(new Date(iso)) : '');

  const members = {
    total: users.length,
    verified: users.filter((u) => u.isVerified !== false).length,
    frozen: users.filter((u) => !u.isActive).length,
    newToday: users.filter((u) => istanbulDay(u.createdAt) === today).length,
    new7d: users.filter((u) => within(u.createdAt, 7 * DAY_MS)).length,
    activeToday: users.filter((u) => istanbulDay(u.lastSeen) === today).length,
    active7d: users.filter((u) => within(u.lastSeen, 7 * DAY_MS)).length,
    active30d: users.filter((u) => within(u.lastSeen, 30 * DAY_MS)).length,
    questionsAllTime: users.reduce((s, u) => s + (u.questionsUsed ?? 0), 0),
    referred: users.filter((u) => u.referredBy).length,
  };

  const mentors = MENTOR_IDS.map((id, i) => ({
    id,
    total: Number(mentorTotals[i]) || 0,
    last7: last7.reduce((s, _, di) => s + (Number(mentorDaily[i * last7.length + di]) || 0), 0),
  }));

  // Eski kayıtlarda "user" alanı olabilir; panele asla gönderilmez.
  const recentQuestions = recentRaw
    .map((r) => {
      try {
        const v = (typeof r === 'string' ? JSON.parse(r) : r) as { q?: string; mentors?: string[]; at?: string };
        return v?.q ? { q: v.q, mentors: v.mentors ?? [], at: v.at ?? null } : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return NextResponse.json(
    { health, members, dates, series, eventLabels: EVENTS, mentors, topics, recentQuestions, unreadFeedback },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
