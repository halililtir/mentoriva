'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { BADGES } from '@/lib/badges-public';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/cn';

interface Earned { id: string; at: string; by: 'auto' | 'admin' }

const DATE = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });

/**
 * Kişiye özel işaretler. Kimseyle karşılaştırılmaz; sayılar ve sıralama yok.
 * Admin'in verdiği işaretler yalnızca kazanıldıysa görünür.
 */
export default function BadgesPage() {
  const { status } = useSession();
  const [earned, setEarned] = useState<Earned[] | null>(null);

  useEffect(() => {
    if (status !== 'user') return;
    fetch('/api/v1/badges', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { earned: [] }))
      .then((d: { earned?: Earned[] }) => setEarned(d.earned ?? []))
      .catch(() => setEarned([]));
    void fetch('/api/v1/badges', { method: 'POST' }).catch(() => {});
  }, [status]);

  const got = new Map((earned ?? []).map((e) => [e.id, e]));
  const visible = BADGES.filter((b) => b.kind === 'auto' || got.has(b.id));
  // Önce verilenler (kurucu vb.), sonra kazanılanlar, en sonda henüz olmayanlar
  const ordered = [...visible].sort((a, b) => {
    const rank = (id: string, kind: string) => (got.has(id) ? (kind === 'grant' ? 0 : 1) : 2);
    return rank(a.id, a.kind) - rank(b.id, b.kind);
  });

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-content px-5 pb-20 pt-10 sm:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">İşaretlerim</p>
          <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3rem)] leading-tight text-balance">
            Yolculuğunda bıraktığın <span className="italic text-gradient">izler.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-white/60">
            Bunlar bir yarış değil. Kimseyle karşılaştırılmaz, sayılmaz; yalnızca sen görürsün. Daha çok soru sormak için değil, nerelerden geçtiğini hatırlaman için.
          </p>
        </div>

        {status === 'guest' ? (
          <div className="mx-auto mt-12 max-w-md text-center">
            <p className="text-white/70">İşaretlerini görmek için giriş yap.</p>
            <Link href="/giris?next=/isaretlerim" className="btn-primary mt-5 inline-flex">Giriş yap</Link>
          </div>
        ) : earned === null ? (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
          </div>
        ) : (
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ordered.map((b) => {
              const e = got.get(b.id);
              return (
                <li
                  key={b.id}
                  className={cn(
                    'rounded-2xl border p-5 transition-colors',
                    e ? 'glass border-brand-500/25' : 'border-dashed border-white/[0.12] bg-transparent',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-full border text-xl',
                        e ? 'border-brand-500/40 bg-brand-500/10 text-brand-300' : 'border-white/10 text-white/30',
                      )}
                      aria-hidden="true"
                    >
                      {b.icon}
                    </span>
                    <div>
                      <h2 className={cn('font-display text-lg', e ? 'text-white/95' : 'text-white/55')}>{b.name}</h2>
                      <p className="text-[11px] text-white/45">
                        {e ? `${DATE.format(new Date(e.at))}${b.kind === 'grant' ? ' · Mentoriva tarafından' : ''}` : 'Henüz değil'}
                      </p>
                    </div>
                  </div>
                  <p className={cn('mt-3 text-[13.5px] leading-relaxed', e ? 'text-white/75' : 'text-white/50')}>{e ? b.meaning : b.how}</p>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
