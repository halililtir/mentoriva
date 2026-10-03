'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WELCOME } from '@/lib/home-content';
import { track } from '@/lib/analytics';

const KEY = 'mentoriva_welcome_done';

/**
 * Henüz hiç soru sormamış üyeye ilk adımı gösterir. Bir soru seçince ya da
 * kapatınca bir daha görünmez (localStorage).
 */
export function WelcomeCard({ name, onPick }: { name: string; onPick: (q: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try { setVisible(localStorage.getItem(KEY) !== '1'); } catch { setVisible(true); }
  }, []);

  const done = () => {
    setVisible(false);
    try { localStorage.setItem(KEY, '1'); } catch {}
  };

  if (!visible) return null;

  return (
    <section className="mx-auto max-w-content px-5 pb-6" aria-labelledby="welcome-title">
      <div className="glass relative overflow-hidden rounded-3xl p-6 animate-fade-up sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-500/15 blur-3xl" />
        <button onClick={done} className="absolute right-4 top-4 rounded-full px-2 py-1 text-xs text-white/50 hover:text-white" aria-label="Karşılamayı kapat">
          Kapat ✕
        </button>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-300">Hoş geldin</p>
        <h2 id="welcome-title" className="mt-2 font-display text-[clamp(1.5rem,3.5vw,2rem)] leading-tight">
          {name}, ilk sorun bir dakika uzağında.
        </h2>

        <ol className="m-rail mt-6 grid gap-3 sm:grid-cols-3">
          {WELCOME.steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-white/[0.08] bg-ink-0/40 p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-onbrand">{i + 1}</span>
              <p className="mt-3 text-sm font-medium text-white/90">{s.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-white/60">{s.body}</p>
            </li>
          ))}
        </ol>

        <p className="mt-6 text-sm text-white/70">Nereden başlayacağını bilmiyorsan:</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {WELCOME.starters.map((q) => (
            <button
              key={q}
              onClick={() => { done(); track('welcome_pick'); onPick(q); }}
              className="rounded-full border border-brand-500/30 bg-brand-500/[0.07] px-4 py-2 text-left text-sm text-white/85 transition-colors hover:border-brand-500/60"
            >
              “{q}”
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs text-white/50">
          Hangi mentorun sana uyduğunu merak ediyorsan önce 2 dakikalık{' '}
          <Link href="/test" className="text-brand-300 hover:underline">kişilik testini</Link> çözebilirsin.
        </p>
      </div>
    </section>
  );
}
