'use client';

import { useMemo, useState } from 'react';
import { ACTIVE_MENTORS, getAccent } from '@/lib/mentors/metadata';
import { Bar, Card, Pill, Stat, fmtAgo } from './shared';
import { cn } from '@/lib/cn';

export interface OverviewData {
  health: {
    kv: 'ok' | 'error' | 'memory';
    kvProbe: Record<string, string | null>;
    ai: 'configured' | 'missing';
    mockAi: boolean;
    email: 'configured' | 'missing';
    emailFrom: 'custom' | 'default';
    admin: 'missing' | 'too_short' | 'ok';
    shareSecret: 'custom' | 'fallback';
    adminEmail: boolean;
    cronSecret: boolean;
    siteUrl: string | null;
  };
  members: {
    total: number; verified: number; frozen: number; newToday: number; new7d: number;
    activeToday: number; active7d: number; active30d: number; questionsAllTime: number; referred: number;
  };
  dates: string[];
  series: Record<string, number[]>;
  eventLabels: Record<string, string>;
  mentors: Array<{ id: string; total: number; last7: number }>;
  topics: Array<{ id: string; label: string; count: number }>;
  ratings: { mentors: Array<{ id: string; up: number; down: number }>; reasons: Array<{ id: string; label: string; count: number }> };
  recentQuestions: Array<{ q: string; mentors: string[]; at: string | null }>;
  unreadFeedback: number;
}

const sum = (xs: number[] | undefined, last?: number) => (xs ?? []).slice(last ? -last : 0).reduce((a, b) => a + b, 0);

/** Sistem durumu: her satır ne demek ve ne yapmalı. */
function healthRows(h: OverviewData['health']) {
  return [
    {
      label: 'Veritabanı (Redis)',
      tone: h.kv === 'ok' ? 'good' : 'bad',
      value: h.kv === 'ok' ? 'Bağlı' : h.kv === 'memory' ? 'Geçici bellek' : 'Bağlantı hatası',
      fix: h.kv === 'ok' ? null : 'Vercel → Storage’da veritabanını projeye bağla, sonra yeniden yayınla. Bu düzelmeden üyelik ve kota çalışmaz.',
    },
    {
      label: 'Yapay zekâ',
      tone: h.ai === 'configured' && !h.mockAi ? 'good' : h.mockAi ? 'warn' : 'bad',
      value: h.mockAi ? 'Deneme (sahte cevap)' : h.ai === 'configured' ? 'Hazır' : 'Anahtar yok',
      fix: h.ai === 'configured' ? null : 'ANTHROPIC_API_KEY ortam değişkenini ekle.',
    },
    {
      label: 'E-posta gönderimi',
      tone: h.email === 'configured' ? (h.emailFrom === 'custom' ? 'good' : 'warn') : 'bad',
      value: h.email !== 'configured' ? 'Kapalı' : h.emailFrom === 'custom' ? 'Hazır' : 'Varsayılan gönderici',
      fix:
        h.email !== 'configured'
          ? 'RESEND_API_KEY ekle; yoksa yeni üyeler doğrulama kodu alamaz.'
          : h.emailFrom === 'custom'
            ? null
            : 'Varsayılan gönderici yalnızca Resend hesabının sahibine e-posta atar. Alan adını Resend’de doğrulayıp RESEND_FROM ekle.',
    },
    {
      label: 'Admin anahtarı',
      tone: h.admin === 'ok' ? 'good' : 'bad',
      value: h.admin === 'ok' ? 'Güçlü' : 'Zayıf / yok',
      fix: h.admin === 'ok' ? null : 'ADMIN_SECRET en az 12 karakter olmalı.',
    },
    {
      label: 'Paylaşım imzası',
      tone: h.shareSecret === 'custom' ? 'good' : 'warn',
      value: h.shareSecret === 'custom' ? 'Ayrı anahtar' : 'Redis anahtarı kullanılıyor',
      fix: h.shareSecret === 'custom' ? null : 'SHARE_CARD_SECRET ekle.',
    },
    {
      label: 'Haftalık özet',
      tone: h.adminEmail && h.cronSecret ? 'good' : 'warn',
      value: h.adminEmail && h.cronSecret ? 'Açık' : 'Kapalı',
      fix: h.adminEmail && h.cronSecret ? null : 'Pazartesi e-postası için ADMIN_EMAIL (senin adresin) ve CRON_SECRET (rastgele uzun bir değer) ekle.',
    },
    {
      label: 'Site adresi',
      tone: h.siteUrl ? 'good' : 'warn',
      value: h.siteUrl ?? 'Tanımsız',
      fix: h.siteUrl ? null : 'NEXT_PUBLIC_SITE_URL ekle (paylaşım linkleri ve site haritası için).',
    },
  ] as const;
}

export function Overview({ data, onOpenFeedback }: { data: OverviewData; onOpenFeedback: () => void }) {
  const { members, series, dates, eventLabels } = data;
  const [metric, setMetric] = useState('question');
  const rows = healthRows(data.health);
  const problems = rows.filter((r) => r.fix);

  const chart = series[metric] ?? [];
  const chartMax = Math.max(1, ...chart);

  const mentorMax = Math.max(1, ...data.mentors.map((m) => m.last7));
  const topicMax = Math.max(1, ...data.topics.map((t) => t.count));
  const mentorMeta = useMemo(() => Object.fromEntries(ACTIVE_MENTORS.map((m) => [m.id, m])), []);

  const questions7 = sum(series['question'], 7);
  const questionsToday = sum(series['question'], 1);
  const errors7 = sum(series['mentor_error'], 7) + sum(series['server_error'], 7) + sum(series['client_error'], 7);
  const crisis7 = sum(series['crisis'], 7);

  return (
    <div className="space-y-5">
      {/* Uyarılar */}
      {problems.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] p-4">
          <p className="text-sm font-semibold text-amber-400">Dikkat isteyen {problems.length} ayar var</p>
          <ul className="mt-2 space-y-1.5 text-[13px] text-white/75">
            {problems.map((p) => (
              <li key={p.label}><span className="font-medium text-white/90">{p.label}:</span> {p.fix}</li>
            ))}
          </ul>
        </div>
      )}
      {data.unreadFeedback > 0 && (
        <button onClick={onOpenFeedback} className="w-full rounded-2xl border border-brand-500/30 bg-brand-500/[0.07] px-4 py-3 text-left text-sm text-white/85 hover:border-brand-500/50">
          <span className="font-semibold text-brand-300">{data.unreadFeedback} okunmamış geri bildirim</span> var → aç
        </button>
      )}

      {/* Sayılar */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Toplam üye" value={members.total} hint={`${members.new7d} yeni (7 gün) · bugün ${members.newToday}`} />
        <Stat label="Bugün aktif" value={members.activeToday} hint={`7 gün: ${members.active7d} · 30 gün: ${members.active30d}`} />
        <Stat label="Bugün soru" value={questionsToday} hint={`7 gün: ${questions7} · toplam: ${members.questionsAllTime}`} />
        <Stat
          label="Hata / kriz (7 gün)"
          value={`${errors7} / ${crisis7}`}
          hint="Tüm hatalar / kriz filtresi"
          tone={errors7 > 0 ? 'warn' : 'default'}
        />
      </div>

      {/* Zaman serisi */}
      <Card
        title="Son 30 gün"
        action={
          <select value={metric} onChange={(e) => setMetric(e.target.value)} className="rounded-lg border border-white/10 bg-ink-0/60 px-2 py-1 text-xs text-white/80">
            {Object.entries(eventLabels).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        }
      >
        <div className="flex h-36 items-end gap-[3px]" role="img" aria-label={`${eventLabels[metric]} — son 30 gün`}>
          {chart.map((v, i) => (
            <div key={dates[i]} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className={cn('w-full rounded-t-sm transition-colors', i === chart.length - 1 ? 'bg-brand-400' : 'bg-brand-500/45 group-hover:bg-brand-400')}
                style={{ height: `${v ? Math.max(4, (v / chartMax) * 100) : 1}%` }}
              />
              <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-300 px-1.5 py-0.5 text-[10px] text-white/90 group-hover:block">
                {dates[i]?.slice(5)}: {v}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-white/40">
          <span>{dates[0]?.slice(5)}</span>
          <span>Toplam {sum(chart)}</span>
          <span>bugün</span>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Mentorlar */}
        <Card title="Mentor tercihleri (son 7 gün)">
          <div className="space-y-3">
            {[...data.mentors].sort((a, b) => b.last7 - a.last7).map((m) => {
              const meta = mentorMeta[m.id];
              const a = meta ? getAccent(meta.accentColor) : null;
              return (
                <div key={m.id}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="font-medium" style={{ color: a?.text }}>{meta?.shortName ?? m.id}</span>
                    <span className="tabular-nums text-white/55">{m.last7} <span className="text-white/35">· toplam {m.total}</span></span>
                  </div>
                  <Bar value={m.last7} max={mentorMax} color={a?.hex} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Konular */}
        <Card title="Ne soruluyor? (son 7 gün)">
          {data.topics.every((t) => t.count === 0) ? (
            <p className="text-sm text-white/50">Henüz veri yok. Konular yeni sorulardan itibaren sayılır.</p>
          ) : (
            <div className="space-y-2.5">
              {data.topics.filter((t) => t.count > 0).map((t) => (
                <div key={t.id}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="text-white/80">{t.label}</span>
                    <span className="tabular-nums text-white/55">{t.count}</span>
                  </div>
                  <Bar value={t.count} max={topicMax} />
                </div>
              ))}
              <p className="pt-1 text-[11px] text-white/40">Anahtar kelimeyle kaba sınıflandırma; bir soru birden çok konuya girebilir.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Memnuniyet */}
      <Card title="Cevap memnuniyeti (son 7 gün)">
        {(() => {
          const up = data.ratings.mentors.reduce((s, m) => s + m.up, 0);
          const down = data.ratings.mentors.reduce((s, m) => s + m.down, 0);
          if (up + down === 0) return <p className="text-sm text-white/50">Henüz oy yok. Cevapların altındaki 👍/👎 düğmelerinden gelir.</p>;
          return (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm text-white/75">
                  Genel: <b className="text-white/90">%{Math.round((up / (up + down)) * 100)}</b> olumlu · {up} 👍 / {down} 👎
                </p>
                {data.ratings.mentors.filter((m) => m.up + m.down > 0).map((m) => {
                  const meta = mentorMeta[m.id];
                  const total = m.up + m.down;
                  return (
                    <div key={m.id}>
                      <div className="mb-1 flex justify-between text-[13px]">
                        <span style={{ color: meta ? getAccent(meta.accentColor).text : undefined }}>{meta?.shortName ?? m.id}</span>
                        <span className="tabular-nums text-white/55">%{Math.round((m.up / total) * 100)} · {total} oy</span>
                      </div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full bg-emerald-500" style={{ width: `${(m.up / total) * 100}%` }} />
                        <div className="h-full bg-red-500/70" style={{ width: `${(m.down / total) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div>
                <p className="mb-2 text-sm text-white/75">👎 nedenleri</p>
                {data.ratings.reasons.every((r) => r.count === 0) ? (
                  <p className="text-sm text-white/50">Neden belirtilmedi.</p>
                ) : (
                  <ul className="space-y-1.5 text-[13px]">
                    {data.ratings.reasons.filter((r) => r.count > 0).map((r) => (
                      <li key={r.id} className="flex justify-between"><span className="text-white/75">{r.label}</span><span className="tabular-nums text-white/55">{r.count}</span></li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })()}
      </Card>

      {/* Son sorular */}
      <Card title="Son sorular" action={<Pill>anonim</Pill>}>
        {data.recentQuestions.length === 0 ? (
          <p className="text-sm text-white/50">Henüz soru yok.</p>
        ) : (
          <ul className="max-h-[420px] divide-y divide-white/[0.06] overflow-y-auto pr-1">
            {data.recentQuestions.map((q, i) => (
              <li key={i} className="py-2.5">
                <p className="text-sm leading-relaxed text-white/85">{q.q}</p>
                <p className="mt-1 text-[11px] text-white/45">
                  {q.mentors.map((id) => mentorMeta[id]?.shortName ?? id).join(', ')} · {fmtAgo(q.at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Sistem durumu */}
      <Card title="Sistem durumu">
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3 border-b border-white/[0.05] py-1.5 text-[13px]">
              <span className="text-white/70">{r.label}</span>
              <Pill tone={r.tone}>{r.value}</Pill>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Doğrulanmış" value={members.verified} />
          <Stat label="Dondurulmuş" value={members.frozen} tone={members.frozen ? 'warn' : 'default'} />
          <Stat label="Davetle gelen" value={members.referred} />
          <Stat label="Paylaşım (7 gün)" value={sum(series['share'], 7)} />
        </div>
      </Card>
    </div>
  );
}
