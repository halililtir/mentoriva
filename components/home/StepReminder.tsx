'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/session';
import { todayKey } from '@/lib/time';
import { track } from '@/lib/analytics';
import type { SavedStep } from '@/lib/journey/store';

const SNOOZE_KEY = 'mentoriva_step_snooze';
/** Adım seçildikten bu kadar sonra sorulur; aynı oturumda hemen sormasın. */
const ASK_AFTER_MS = 12 * 60 * 60 * 1000;

function since(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Geçen sefer';
  if (days === 1) return 'Dün';
  if (days < 7) return `${days} gün önce`;
  return 'Bir süre önce';
}

/**
 * Kendine Yolculuk'ta seçilen küçük adımı ana sayfada nazikçe sorar.
 * Seri baskısı yok: "Sonra" o gün gizler; cevap verilince bir daha sorulmaz.
 */
export function StepReminder() {
  const { status } = useSession();
  const [step, setStep] = useState<SavedStep | null>(null);
  const [answer, setAnswer] = useState<'done' | 'skipped' | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (status !== 'user') return;
    try { if (localStorage.getItem(SNOOZE_KEY) === todayKey()) return; } catch {}
    fetch('/api/v1/journey/step', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { step: null }))
      .then((d: { step?: SavedStep | null }) => {
        const s = d.step;
        if (s && s.status === 'pending' && Date.now() - new Date(s.createdAt).getTime() > ASK_AFTER_MS) setStep(s);
      })
      .catch(() => {});
  }, [status]);

  if (!step || hidden) return null;

  const respond = async (value: 'done' | 'skipped') => {
    setAnswer(value);
    track('journey_step_status', { status: value, from: 'home' });
    await fetch('/api/v1/journey/step', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: value }),
    }).catch(() => {});
  };

  const snooze = () => {
    try { localStorage.setItem(SNOOZE_KEY, todayKey()); } catch {}
    setHidden(true);
  };

  return (
    <section aria-label="Küçük adımın" className="mx-auto max-w-content px-5 pb-6">
      <div className="relative overflow-hidden rounded-3xl border border-brand-400/25 bg-brand-500/[0.05] p-5 animate-fade-up sm:p-6">
        <div className="absolute inset-y-0 left-0 w-[3px] bg-brand-400/70" />
        <p className="text-[11px] uppercase tracking-[0.18em] text-brand-300/90">Kendine Yolculuk</p>

        {answer === null ? (
          <>
            <p className="mt-2 text-[16px] leading-relaxed text-white/85">
              {since(step.createdAt)} kendine bir adım seçmiştin: <b className="font-medium text-white">{step.label}</b>. Nasıl geçti?
            </p>
            {step.detail && <p className="mt-1 text-[13.5px] leading-relaxed text-white/50">{step.detail}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button onClick={() => void respond('done')} className="btn-primary !px-4 !py-2 text-sm">Yaptım</button>
              <button onClick={() => void respond('skipped')} className="btn-secondary !px-4 !py-2 text-sm">Bu sefer olmadı</button>
              <button onClick={snooze} className="btn-ghost !px-3 !py-2 text-sm">Sonra</button>
            </div>
          </>
        ) : (
          <div className="mt-2 animate-fade-in">
            <p className="text-[16px] leading-relaxed text-white/85">
              {answer === 'done'
                ? 'Güzel. Değişim çoğu zaman böyle küçük, sessiz bir adımla başlar.'
                : 'Olur. Bir adımın zor gelmesi de neyin seni zorladığını gösterir; bu da bir fark ediş.'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Link href="/yolculuk" className="text-[14px] font-medium text-brand-300 hover:underline">Yeni bir yolculuğa başla →</Link>
              <button onClick={() => setHidden(true)} className="text-[13px] text-white/50 hover:text-white/80">Kapat</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
