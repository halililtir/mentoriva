'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { Bar, Card, Stat, adminFetch } from './shared';

interface InsightsData {
  funnel: Array<{ label: string; count: number; ofPrev: number | null }>;
  cohorts: Array<{ week: string; signups: number; firstQuestion: number; returned: number; d7Eligible: number; d7: number }>;
  cost: {
    dates: string[];
    daily: number[];
    features: Array<{ id: string; label: string; usd: number; calls: number }>;
    tokens: { in: number; out: number; cache_write: number; cache_read: number };
    total30: number;
    monthToDate: number;
    monthForecast: number;
    perInteraction: number | null;
    cacheShare: number | null;
  };
}

const usd = (v: number) => (v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(v >= 0.01 ? 3 : 4)}`);
const pct = (a: number, b: number) => (b > 0 ? `%${Math.round((a / b) * 100)}` : '—');
const NUM = new Intl.NumberFormat('tr-TR');

export function Insights({ onError }: { onError: (e: unknown) => void }) {
  const [data, setData] = useState<InsightsData | null>(null);

  useEffect(() => {
    adminFetch<InsightsData>('/api/admin/insights').then(setData).catch(onError);
  }, [onError]);

  if (!data) return <div className="skeleton h-64 rounded-2xl" />;
  const { funnel, cohorts, cost } = data;
  const top = funnel[0]?.count ?? 0;
  const costMax = Math.max(0.0001, ...cost.daily);

  return (
    <div className="space-y-5">
      {/* Huni */}
      <Card title="Huni (son 30 günde kaydolanlar)">
        {top === 0 ? (
          <p className="text-sm text-white/50">Son 30 günde kayıt yok.</p>
        ) : (
          <div className="space-y-3">
            {funnel.map((s, i) => (
              <div key={s.label}>
                <div className="mb-1 flex justify-between text-[13px]">
                  <span className="text-white/80">{i + 1}. {s.label}</span>
                  <span className="tabular-nums text-white/60">
                    <b className="text-white/90">{s.count}</b>
                    {s.ofPrev !== null && <span className={cn('ml-2', s.ofPrev < 40 ? 'text-amber-400' : 'text-white/50')}>%{s.ofPrev}{i === funnel.length - 1 ? ' (uygun olanların)' : ' önceki adımın'}</span>}
                  </span>
                </div>
                <Bar value={s.count} max={top} />
              </div>
            ))}
            <p className="pt-1 text-[11px] text-white/45">
              Son adım yalnızca kaydı en az 7 gün önce olan üyeler üzerinden hesaplanır. En büyük kayıp hangi adımdaysa önce orayı iyileştirmek gerekir.
            </p>
          </div>
        )}
      </Card>

      {/* Haftalık gruplar */}
      <Card title="Kayıt haftasına göre geri dönüş">
        {cohorts.length === 0 ? (
          <p className="text-sm text-white/50">Henüz veri yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[13px]">
              <thead className="text-[11px] uppercase tracking-wider text-white/45">
                <tr>
                  <th className="py-2 font-medium">Hafta</th>
                  <th className="py-2 text-right font-medium">Kayıt</th>
                  <th className="py-2 text-right font-medium">İlk soru</th>
                  <th className="py-2 text-right font-medium">Geri geldi</th>
                  <th className="py-2 text-right font-medium">7. gün</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] tabular-nums">
                {cohorts.map((c) => (
                  <tr key={c.week}>
                    <td className="py-2 text-white/80">{c.week}</td>
                    <td className="py-2 text-right text-white/90">{c.signups}</td>
                    <td className="py-2 text-right text-white/75">{pct(c.firstQuestion, c.signups)}</td>
                    <td className="py-2 text-right text-white/75">{pct(c.returned, c.signups)}</td>
                    <td className="py-2 text-right text-white/75">{c.d7Eligible ? pct(c.d7, c.d7Eligible) : 'bekleniyor'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Maliyet */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Bu ay (şu ana kadar)" value={usd(cost.monthToDate)} />
        <Stat label="Ay sonu tahmini" value={usd(cost.monthForecast)} hint="Son 7 günün ortalamasıyla" />
        <Stat label="Etkileşim başına" value={cost.perInteraction === null ? '—' : usd(cost.perInteraction)} hint="Soru, sohbet mesajı, yolculuk" />
        <Stat label="Önbellekten okunan" value={cost.cacheShare === null ? '—' : `%${Math.round(cost.cacheShare * 100)}`} hint="Girdi tokenlarının; yüksek olması iyi" />
      </div>

      <Card title={`Yapay zekâ maliyeti · son 30 gün · ${usd(cost.total30)}`}>
        <div className="flex h-32 items-end gap-[3px]" role="img" aria-label="Günlük yapay zekâ maliyeti">
          {cost.daily.map((v, i) => (
            <div key={cost.dates[i]} className="group relative flex h-full flex-1 flex-col justify-end">
              <div className="w-full rounded-t-sm bg-amber-500/60 group-hover:bg-amber-500" style={{ height: `${v ? Math.max(4, (v / costMax) * 100) : 1}%` }} />
              <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-300 px-1.5 py-0.5 text-[10px] text-white/90 group-hover:block">
                {cost.dates[i]?.slice(5)}: {usd(v)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="space-y-2.5">
            {cost.features.map((f) => (
              <div key={f.id}>
                <div className="mb-1 flex justify-between text-[13px]">
                  <span className="text-white/80">{f.label}</span>
                  <span className="tabular-nums text-white/60">{usd(f.usd)} · {NUM.format(f.calls)} çağrı</span>
                </div>
                <Bar value={f.usd} max={Math.max(0.0001, ...cost.features.map((x) => x.usd))} color="rgb(217 119 6 / 0.7)" />
              </div>
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
            <div><dt className="text-white/50">Girdi token</dt><dd className="tabular-nums text-white/85">{NUM.format(cost.tokens.in)}</dd></div>
            <div><dt className="text-white/50">Çıktı token</dt><dd className="tabular-nums text-white/85">{NUM.format(cost.tokens.out)}</dd></div>
            <div><dt className="text-white/50">Önbelleğe yazılan</dt><dd className="tabular-nums text-white/85">{NUM.format(cost.tokens.cache_write)}</dd></div>
            <div><dt className="text-white/50">Önbellekten okunan</dt><dd className="tabular-nums text-white/85">{NUM.format(cost.tokens.cache_read)}</dd></div>
          </dl>
        </div>
        <p className="mt-4 text-[11px] text-white/45">
          Tahminidir: token sayıları Anthropic’in döndürdüğü değerlerdir, fiyatlar lib/admin/cost.ts içindeki liste fiyatlarıdır (USD). Kesin tutar için Anthropic Console faturasına bak.
        </p>
      </Card>
    </div>
  );
}
