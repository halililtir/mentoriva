/**
 * GET /api/admin/insights — büyüme (huni, haftalık gruplar) ve yapay zekâ
 * maliyeti (yalnızca admin çerezi).
 */

import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/http';
import { isAdmin } from '@/lib/auth/session';
import { listUsers } from '@/lib/auth/users';
import { cohorts, funnel } from '@/lib/admin/funnel';
import { costSummary } from '@/lib/admin/cost';
import { getSeries, lastDays } from '@/lib/admin/metrics';
import { todayKey } from '@/lib/time';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');

  const dates = lastDays(30);
  const month = todayKey().slice(0, 7);
  const monthDates = dates.filter((d) => d.startsWith(month));

  const [users, cost30, costMonth, series] = await Promise.all([
    listUsers(),
    costSummary(dates),
    costSummary(monthDates),
    getSeries(dates, ['question', 'chat', 'journey']),
  ]);

  const sum = (xs: number[] | undefined) => (xs ?? []).reduce((a, b) => a + b, 0);
  const interactions = sum(series['question']) + sum(series['chat']) + sum(series['journey']);
  const dayOfMonth = Number(todayKey().slice(8, 10));
  const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();

  return NextResponse.json(
    {
      funnel: funnel(users, 30),
      cohorts: cohorts(users, 8),
      cost: {
        dates,
        daily: cost30.daily,
        features: cost30.features,
        tokens: cost30.tokens,
        total30: cost30.totalUsd,
        monthToDate: costMonth.totalUsd,
        // Ayın geri kalanı son 7 günün ortalamasıyla tahmin edilir
        monthForecast: costMonth.totalUsd + (cost30.daily.slice(-7).reduce((a, b) => a + b, 0) / 7) * (daysInMonth - dayOfMonth),
        perInteraction: interactions > 0 ? cost30.totalUsd / interactions : null,
        cacheShare: cost30.tokens.in + cost30.tokens.cache_read > 0 ? cost30.tokens.cache_read / (cost30.tokens.in + cost30.tokens.cache_read + cost30.tokens.cache_write) : null,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
