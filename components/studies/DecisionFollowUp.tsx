'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DECISION_DAYS, DECISION_DAY_LABELS, DECISION_LIMITS, type DecisionDays } from '@/lib/decisions-public';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';

const UNDECIDED = 'Henüz karar vermedim';

/** Karar çalışmasının sonunda: kişi kararını yazar, seçtiği süre sonra geri döner. */
export function DecisionFollowUp({ options }: { options: string[] }) {
  const [choice, setChoice] = useState('');
  const [why, setWhy] = useState('');
  const [days, setDays] = useState<DecisionDays>(30);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');

  const save = async () => {
    setState('saving');
    const res = await fetch('/api/v1/decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: options.join(' / '), choice, why, days }),
    }).catch(() => null);
    if (res?.ok) { setState('saved'); track('decision_saved'); return; }
    const d = (await res?.json().catch(() => null)) as { error?: string } | null;
    setError(d?.error ?? 'Kaydedilemedi; biraz sonra tekrar dene.');
    setState('error');
  };

  if (state === 'saved') {
    return (
      <div className="rounded-3xl border border-brand-400/30 bg-brand-500/[0.06] p-5">
        <p className="font-display text-xl text-white/95">Kararın takipte.</p>
        <p className="mt-1.5 text-sm leading-relaxed text-white/60">
          {DECISION_DAY_LABELS[days]} sana bir kez e-posta göndereceğiz. Ne olduğunu <Link href="/yolculugum#kararlar" className="text-brand-300 hover:underline">Yolculuğum</Link>&apos;da yazabilirsin.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <h3 className="font-display text-xl">Kararını takibe al</h3>
      <p className="mt-1 text-sm leading-relaxed text-white/50">Kararını yaz; zamanı gelince ne olduğuna birlikte bakalım. İstersen geç, hiçbir şey kaydedilmez.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {[...options, UNDECIDED].map((o) => (
          <button
            key={o}
            onClick={() => setChoice(o)}
            aria-pressed={choice === o}
            className={cn('rounded-full border px-3.5 py-2 text-[13.5px] transition', choice === o ? 'border-brand-400/50 bg-brand-500/[0.09] text-white' : 'border-white/10 text-white/65 hover:border-white/25')}
          >
            {o}
          </button>
        ))}
      </div>
      <input
        value={choice}
        onChange={(e) => setChoice(e.target.value.slice(0, DECISION_LIMITS.choice))}
        placeholder="Ya da kararını kendin yaz…"
        className="input-field mt-3 w-full text-base"
        aria-label="Kararın"
      />
      <input
        value={why}
        onChange={(e) => setWhy(e.target.value.slice(0, DECISION_LIMITS.why))}
        placeholder="Neden? (isteğe bağlı)"
        className="input-field mt-2 w-full text-base"
        aria-label="Neden bu karar"
      />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-white/50">Bana sor:</span>
        {DECISION_DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            aria-pressed={days === d}
            className={cn('rounded-full border px-3 py-1.5 text-[13px] transition', days === d ? 'border-brand-400/50 text-white' : 'border-white/10 text-white/55 hover:border-white/25')}
          >
            {DECISION_DAY_LABELS[d]}
          </button>
        ))}
      </div>
      {state === 'error' && <p className="mt-3 text-sm text-red-300/90">{error}</p>}
      <button onClick={() => void save()} disabled={choice.trim().length < 2 || state === 'saving'} className="btn-primary mt-4 text-sm">
        {state === 'saving' ? 'Kaydediliyor…' : 'Takibe al'}
      </button>
    </div>
  );
}
