'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GuestConsent } from '@/components/shared/GuestConsent';
import { CrisisNotice } from '@/components/mentors/CrisisNotice';
import { getAccent, getActiveMentor } from '@/lib/mentors/metadata';
import { DRAFT_KEY, PRESELECT_KEY } from '@/lib/flow-keys';
import { cardToQuestion, type CardDraft } from '@/lib/feelings/card';
import { track } from '@/lib/analytics';
import type { MentorId } from '@/types';

interface Reflection {
  heard: string;
  meaning: string;
  reframe?: string;
  tryNow: string[];
  quote: { mentorId: MentorId; text: string; source: string } | null;
  mentorId: MentorId | null;
}

/**
 * "İçimde ne var?" sonunda Mentoriva'nın karşılığı: ne fark ettiği, duygunun ne
 * anlatıyor olabileceği, şimdi denenebilecek bir iki şey ve uygun bir mentordan
 * doğrulanmış bir söz. Kart bunun altında, ikinci planda kalır.
 */
export function FeelingReflection({ card, guest }: { card: CardDraft; guest: boolean }) {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [data, setData] = useState<Reflection | null>(null);
  const [crisis, setCrisis] = useState('');
  const asked = useRef(false);

  const load = useCallback(async () => {
    if (asked.current) return;
    asked.current = true;
    setState('loading');
    try {
      const res = await fetch('/api/v1/feelings/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card, ...(guest ? { consent: true } : {}) }),
      });
      const d = (await res.json().catch(() => null)) as { reflection?: Reflection; crisis?: string } | null;
      if (d?.crisis) { setCrisis(d.crisis); setState('done'); return; }
      if (!res.ok || !d?.reflection) { setState('error'); asked.current = false; return; }
      setData(d.reflection);
      setState('done');
      track('feelings_reflect');
    } catch {
      setState('error');
      asked.current = false;
    }
  }, [card, guest]);

  useEffect(() => {
    if (!guest) void load();
  }, [guest, load]);

  const toMentor = (id: MentorId) => {
    try {
      sessionStorage.setItem(DRAFT_KEY, cardToQuestion(card));
      sessionStorage.setItem(PRESELECT_KEY, id);
    } catch {}
    track('feelings_to_mentor', { from: 'reflection' });
    router.push('/');
  };

  if (crisis) return <CrisisNotice message={crisis} />;

  if (guest && state === 'idle') {
    return (
      <div className="glass rounded-3xl p-5 sm:p-6">
        <p className="font-display text-xl">Sana söylemek istediklerim hazır</p>
        <p className="mt-1 text-sm text-white/55">Anlattıklarına bakıp ne fark ettiğimi ve şimdi neler deneyebileceğini yazayım.</p>
        <GuestConsent checked={consent} onChange={setConsent} className="mt-4" />
        <button onClick={() => void load()} disabled={!consent} className="btn-primary mt-4">Göster</button>
      </div>
    );
  }

  if (state === 'loading' || state === 'idle') {
    return (
      <div className="glass rounded-3xl p-6">
        <p className="text-sm text-white/55">Anlattıklarını okuyorum…</p>
        <div className="mt-4 space-y-2">
          <div className="skeleton h-4 w-11/12 rounded" />
          <div className="skeleton h-4 w-10/12 rounded" />
          <div className="skeleton h-4 w-8/12 rounded" />
        </div>
      </div>
    );
  }

  if (state === 'error' || !data) {
    return (
      <div className="rounded-3xl border border-white/[0.08] p-5 text-sm text-white/60">
        Şu an sana bir şey yazamadım.{' '}
        <button onClick={() => void load()} className="text-brand-300 hover:underline">Tekrar dene</button>
      </div>
    );
  }

  const mentor = data.mentorId ? getActiveMentor(data.mentorId) : null;
  return (
    <section className="space-y-5 animate-fade-up" aria-label="Mentoriva'nın karşılığı">
      <div className="glass relative overflow-hidden rounded-3xl p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl" />
        <p className="relative text-[11px] uppercase tracking-[0.16em] text-brand-300">Sana söylemek istediklerim</p>
        <p className="relative mt-3 font-display text-[1.35rem] leading-snug text-white/95">{data.heard}</p>
        <p className="relative mt-4 text-[15.5px] leading-relaxed text-white/75">{data.meaning}</p>
      </div>

      {data.reframe && (
        <div className="rounded-3xl border border-brand-400/25 bg-brand-500/[0.05] p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-brand-300">Başka bir açıdan</p>
          <p className="mt-2 text-[15.5px] leading-relaxed text-white/85">{data.reframe}</p>
        </div>
      )}

      {data.tryNow.length > 0 && (
        <div className="rounded-3xl border border-white/[0.08] p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Şimdi deneyebileceğin</p>
          <ul className="mt-3 space-y-2.5">
            {data.tryNow.map((t) => (
              <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-white/85">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-400" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.quote && (
        <figure className="rounded-3xl border p-5" style={{ borderColor: getAccent(getActiveMentor(data.quote.mentorId).accentColor).border }}>
          <blockquote className="font-display text-lg leading-snug text-white/90">&ldquo;{data.quote.text}&rdquo;</blockquote>
          <figcaption className="mt-2 text-[12.5px] text-white/45">— {data.quote.source}</figcaption>
        </figure>
      )}

      {mentor && data.mentorId && (
        <button onClick={() => toMentor(data.mentorId!)} className="btn-secondary w-full justify-center sm:w-auto">
          Bunu {mentor.shortName} ile konuş →
        </button>
      )}
    </section>
  );
}
