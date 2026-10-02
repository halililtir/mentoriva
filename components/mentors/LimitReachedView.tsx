'use client';

import { useState } from 'react';
import Link from 'next/link';
import { showToast } from '@/components/shared/Toast';
import { CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/site';
import { useSession } from '@/lib/session';

const PERKS = ['Sınırsız mentor sohbeti', 'Derin analiz modu', 'Tüm mentorlarla karşılaştırma', 'Yeni mentorlara öncelikli erişim'];

/** Günlük hak bittiğinde gösterilen premium bekleme listesi ekranı. */
export function LimitReachedView({ onHome }: { onHome: () => void }) {
  const { user } = useSession();
  const [email, setEmail] = useState(user?.username ?? '');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const join = async () => {
    if (!email.includes('@') || state !== 'idle') return;
    setState('sending');
    try {
      const res = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user?.name ?? 'Premium İlgi',
          email: email.trim(),
          message: '[PREMIUM_INTEREST] Kullanıcı premium erişim için e-posta bıraktı.',
        }),
      });
      if (!res.ok) throw new Error();
      setState('sent');
    } catch {
      setState('idle');
      showToast('Kaydedemedik, biraz sonra tekrar dene', 'error');
    }
  };

  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-12 sm:py-20">
      <div className="glass relative overflow-hidden rounded-3xl p-8 text-center animate-scale-in sm:p-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
        <div className="pointer-events-none absolute -top-28 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-amber-500/20 blur-3xl" />

        <span className="relative inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-300">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
          Bugünkü hakların doldu
        </span>

        <h2 className="relative mt-6 font-display text-3xl leading-tight text-balance sm:text-4xl">
          Sorularına <span className="italic text-amber-300">sınır olmasın.</span>
        </h2>
        <p className="relative mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-white/50">
          Hakların yarın Türkiye saatiyle gece yarısı yenilenir. Daha fazlasını isteyenler için premium yolda.
        </p>

        {/* Hemen devam etmenin yolu: davet */}
        <Link
          href="/davet"
          className="relative mx-auto mt-6 flex max-w-sm items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.08] px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-amber-400/50"
        >
          <span>
            <span className="block text-sm font-medium text-amber-200">Beklemek istemiyor musun?</span>
            <span className="block text-xs text-white/50">Arkadaşını davet et, her yeni üye için +5 soru kazan.</span>
          </span>
          <span className="text-amber-300" aria-hidden="true">→</span>
        </Link>

        <ul className="relative mx-auto mt-7 max-w-xs space-y-3 text-left">
          {PERKS.map((p, i) => (
            <li key={p} className="flex items-center gap-3 text-sm text-white/70 animate-fade-up" style={{ animationDelay: `${200 + i * 80}ms` }}>
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8l3.5 3.5L13 5" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              {p}
            </li>
          ))}
        </ul>

        <div className="relative mt-8 border-t border-white/[0.06] pt-7">
          {state === 'sent' ? (
            <div className="animate-scale-in">
              <p className="font-medium text-amber-300">Listedesin!</p>
              <p className="mt-1 text-xs text-white/40">Premium hazır olduğunda ilk sen duyacaksın.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-white/40">Premium açıldığında haber verelim</p>
              <div className="mx-auto mt-3 flex max-w-sm gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta adresin"
                  className="input-field !py-2.5"
                  autoComplete="email"
                />
                <button
                  onClick={join}
                  disabled={state === 'sending'}
                  className="flex-shrink-0 rounded-xl bg-amber-500 px-4 text-sm font-medium text-ink-0 transition-all hover:-translate-y-0.5 hover:bg-amber-400 disabled:opacity-50"
                >
                  {state === 'sending' ? '…' : 'Haber ver'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="relative mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber-300/70 transition-colors hover:text-amber-300">{CONTACT_EMAIL}</a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-amber-300/70 transition-colors hover:text-amber-300">{INSTAGRAM_HANDLE}</a>
        </div>

        <button onClick={onHome} className="relative mt-6 text-xs text-white/35 transition-colors hover:text-white/60">
          Ana sayfaya dön
        </button>
      </div>
    </div>
  );
}
