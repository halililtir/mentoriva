'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { BadgeMedal } from '@/components/badges/BadgeMedal';
import { BADGES, BADGE_BY_ID, PERKS } from '@/lib/badges-public';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/cn';

interface Earned { id: string; at: string; by: 'auto' | 'admin' }

const DATE = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });

/**
 * Kişisel işaret sayfası. Kimseyle karşılaştırılmaz; sıralama yok.
 * Admin'in verdiği işaretler yalnızca kazanıldıysa görünür.
 */
export default function BadgesPage() {
  const { status, user } = useSession();
  const [earned, setEarned] = useState<Earned[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'user') return;
    fetch('/api/v1/badges', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { earned: [] }))
      .then((d: { earned?: Earned[] }) => setEarned(d.earned ?? []))
      .catch(() => setEarned([]));
    void fetch('/api/v1/badges', { method: 'POST' }).catch(() => {});
  }, [status]);

  const got = new Map((earned ?? []).map((e) => [e.id, e]));
  const granted = BADGES.filter((b) => b.kind === 'grant' && got.has(b.id));
  const auto = BADGES.filter((b) => b.kind === 'auto');
  const selected = open ? BADGE_BY_ID[open] : null;
  const selectedEarned = open ? got.get(open) : undefined;

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-content px-5 pb-20 pt-10 sm:pt-14">
        {status === 'guest' ? (
          <div className="mx-auto mt-12 max-w-md text-center">
            <h1 className="font-display text-3xl">İşaretlerim</h1>
            <p className="mt-3 text-white/70">İşaretlerini görmek için giriş yap.</p>
            <Link href="/giris?next=/isaretlerim" className="btn-primary mt-5 inline-flex">Giriş yap</Link>
          </div>
        ) : (
          <>
            {/* Profil başlığı */}
            <section className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 font-display text-3xl text-white shadow-lg">
                  {(user?.name ?? '?').slice(0, 1).toLocaleUpperCase('tr-TR')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-300">İşaretlerim</p>
                  <h1 className="mt-1 font-display text-[clamp(1.8rem,4vw,2.4rem)] leading-tight">{user?.name ?? '…'}</h1>
                  <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-white/60">
                    Yolculuğunda bıraktığın izler. Bir yarış değil; kimseyle karşılaştırılmaz, yalnızca sen görürsün.
                  </p>
                </div>
                {granted.length > 0 && (
                  <div className="flex gap-3">
                    {granted.map((b) => (
                      <button key={b.id} onClick={() => setOpen(b.id)} className="group text-center" aria-label={b.name}>
                        <BadgeMedal id={b.id} size={64} className="transition-transform duration-500 ease-spring group-hover:-rotate-6 group-hover:scale-105" />
                        <span className="mt-1 block text-[11px] font-medium text-amber-400">{b.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Seçili işaretin anlamı */}
            {selected && (
              <section className="mt-6 flex flex-col items-center gap-5 rounded-3xl border border-white/[0.08] bg-ink-50/70 p-6 text-center animate-fade-up sm:flex-row sm:text-left" aria-live="polite">
                <BadgeMedal id={selected.id} earned={!!selectedEarned} size={112} />
                <div className="flex-1">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    {selectedEarned ? `${DATE.format(new Date(selectedEarned.at))}${selected.kind === 'grant' ? ' · Mentoriva tarafından verildi' : ''}` : 'Henüz değil'}
                  </p>
                  <h2 className="mt-1 font-display text-2xl">{selected.name}</h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/75">{selectedEarned ? selected.meaning : selected.how}</p>
                  {selected.perks?.length ? (
                    <ul className="mt-3 space-y-1">
                      {selected.perks.map((p) => (
                        <li key={p} className="text-[13px] text-white/70">
                          <span className={selectedEarned ? 'text-emerald-400' : 'text-white/45'}>{selectedEarned ? '✓ Açtı:' : 'Açacağı:'}</span>{' '}
                          <b className="text-white/85">{PERKS[p].name}</b> — {PERKS[p].desc}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <button onClick={() => setOpen(null)} className="text-sm text-white/50 hover:text-white">Kapat</button>
              </section>
            )}

            {/* Açılan ayrıcalıklar */}
            {(user?.perks?.length ?? 0) > 0 && (
              <section className="mt-8">
                <h2 className="font-display text-2xl">Açtığın ayrıcalıklar</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(user?.perks ?? []).filter((p): p is keyof typeof PERKS => p in PERKS).map((p) => (
                    <li key={p} className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-4">
                      <p className="text-sm font-medium text-emerald-400">✓ {PERKS[p].name}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-white/70">{PERKS[p].desc}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Yolculuk işaretleri */}
            <h2 className="mt-12 font-display text-2xl">Yolculuk işaretleri</h2>
            <p className="mt-1 text-sm text-white/55">Kullandıkça kendiliğinden gelir. Bir işarete dokun, anlamını oku.</p>
            {earned === null ? (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {auto.map((b) => <div key={b.id} className="skeleton h-48 rounded-2xl" />)}
              </div>
            ) : (
              <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {auto.map((b) => {
                  const e = got.get(b.id);
                  return (
                    <li key={b.id}>
                      <button
                        onClick={() => setOpen(b.id)}
                        className={cn(
                          'group flex h-full w-full flex-col items-center rounded-2xl border p-5 text-center transition-all duration-300 hover:-translate-y-1',
                          e ? 'glass border-white/[0.1]' : 'border-dashed border-white/[0.12]',
                          open === b.id && 'ring-2 ring-brand-500/50',
                        )}
                      >
                        <BadgeMedal id={b.id} earned={!!e} size={84} className="transition-transform duration-500 ease-spring group-hover:scale-105" />
                        <span className={cn('mt-3 font-display text-[17px]', e ? 'text-white/95' : 'text-white/55')}>{b.name}</span>
                        <span className="mt-0.5 text-[11px] text-white/45">{e ? DATE.format(new Date(e.at)) : 'Henüz değil'}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
