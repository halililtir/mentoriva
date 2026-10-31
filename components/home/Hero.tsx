'use client';

import { useState } from 'react';
import Image from 'next/image';
import { DemoPreview } from '@/components/home/DemoPreview';
import { ACTIVE_MENTORS, COMING_SOON_MENTORS } from '@/lib/mentors/metadata';
import type { SessionUser } from '@/lib/session';
import { DEFAULT_DAILY_LIMIT } from '@/lib/auth/limits';

interface Props {
  user: SessionUser | null;
  /** Yazılan soruyla devam: taslak olarak saklanır, mentor seçimine geçilir. */
  onAsk: (question: string) => void;
  /** Soru yazmadan mentorlara bak. */
  onStart: () => void;
}

const TRUST = ['Kayıt olmadan 1 soru dene', `Üyelere her gün ${DEFAULT_DAILY_LIMIT} ücretsiz soru`, 'Kredi kartı istenmez'];

export function Hero({ user, onAsk, onStart }: Props) {
  const [question, setQuestion] = useState('');
  const ready = question.trim().length >= 3;

  return (
    <section className="relative mx-auto grid max-w-content items-center gap-8 px-5 pb-8 pt-6 sm:gap-12 sm:pb-12 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-16">
      <div className="text-center lg:text-left">
        <h1 className="font-display text-[clamp(2.4rem,6.4vw,4.2rem)] leading-[1.05] tracking-[-0.02em] text-balance">
          <span className="inline-block animate-word" style={{ animationDelay: '60ms' }}>Sıkıştığın yerde,</span>
          <br />
          <span className="inline-block animate-word italic text-gradient" style={{ animationDelay: '200ms' }}>
            farklı zihinler.
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-[540px] text-[16px] leading-relaxed text-white/70 animate-fade-up sm:text-[17px] lg:mx-0" style={{ animationDelay: '260ms' }}>
          Zor bir karar, söyleyemediğin bir söz, içinden çıkamadığın bir his. Yaz; büyük düşünürlerin bakışıyla neyin önemli olduğunu gör.
        </p>

        {/* Portreler: kimlerle konuşacağı ilk ekranda görünsün */}
        <div className="mt-5 flex flex-col items-center gap-2 animate-fade-up lg:items-start" style={{ animationDelay: '300ms' }}>
          <ul className="flex -space-x-2.5" aria-label={ACTIVE_MENTORS.map((m) => m.shortName).join(', ')}>
            {ACTIVE_MENTORS.map((m) => (
              <li key={m.id} className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-white/15 sm:h-12 sm:w-12">
                <Image src={m.portraitUrl} alt="" fill sizes="48px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
              </li>
            ))}
          </ul>
          <p className="text-[12.5px] text-white/45">
            {ACTIVE_MENTORS.map((m) => m.shortName).join(' · ')}
            <span className="text-white/30"> · Yakında: {COMING_SOON_MENTORS.map((m) => m.shortName).join(', ')}</span>
          </p>
        </div>

        {/* Ana çağrı: kişi ilk ekranda sorusunu yazabilsin. Düğme animasyonsuz:
            iOS Safari, opaklık animasyonuyla beliren düğmeleri ekrana dokunulana
            dek çizmeyebiliyor. */}
        <form
          className="mx-auto mt-6 max-w-[540px] lg:mx-0"
          onSubmit={(e) => { e.preventDefault(); if (ready) onAsk(question.trim()); else onStart(); }}
        >
          <label htmlFor="hero-question" className="sr-only">Aklındaki soru</label>
          <textarea
            id="hero-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Örneğin: İşimi bırakıp kendi yolumu çizmeli miyim?"
            className="input-field w-full resize-none text-base"
          />
          <div className="mt-3 flex flex-col items-center gap-2.5 sm:flex-row sm:gap-3">
            <button type="submit" className="btn-primary w-full !px-7 !py-3.5 sm:w-auto">
              {ready ? 'Kime soracağını seç' : 'Mentorları gör'}
              <Arrow />
            </button>
          </div>
        </form>

        {user ? (
          <p className="mt-6 text-sm text-white/45 animate-fade-up" style={{ animationDelay: '380ms' }}>
            Hoş geldin <span className="text-white/75">{user.name}</span> · bugün{' '}
            <span className="font-semibold text-brand-300">{user.remaining}</span> soru hakkın var.
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 animate-fade-up sm:gap-x-5 lg:justify-start" style={{ animationDelay: '380ms' }}>
            {TRUST.map((t, i) => (
              <li key={t} className={`items-center gap-1.5 text-[12.5px] text-white/50 sm:text-[13px] ${i === 2 ? 'hidden sm:flex' : 'flex'}`}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l3.5 3.5L13 5" stroke="#33d4dc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="animate-scale-in" style={{ animationDelay: '200ms' }}>
        <DemoPreview />
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
