'use client';

import Link from 'next/link';
import { DemoPreview } from '@/components/home/DemoPreview';
import { RotatingText } from '@/components/ui/RotatingText';
import type { SessionUser } from '@/lib/session';
import { DEFAULT_DAILY_LIMIT } from '@/lib/auth/limits';

interface Props {
  user: SessionUser | null;
  /** Misafirin bugünkü deneme hakkı duruyor: ana çağrı "Kayıt olmadan dene" olur. */
  guestTrial?: boolean;
  /** Mentor seçimine kaydır. */
  onStart: () => void;
  /** "Nasıl çalışır" bölümüne kaydır. */
  onHowItWorks: () => void;
}

const PHRASES = [
  'kararlarını farklı zihinlerle tart.',
  'tekrar eden kalıplarını fark et.',
  'kırgınlıklarına başka bir pencereden bak.',
  'kendi cevabını bulmanı sağlayacak soruları gör.',
];

const TRUST = ['Kayıt olmadan 1 soru dene', `Üyelere her gün ${DEFAULT_DAILY_LIMIT} ücretsiz soru`, 'Kredi kartı istenmez'];

export function Hero({ user, guestTrial = false, onStart, onHowItWorks }: Props) {
  return (
    <section className="relative mx-auto grid max-w-content items-center gap-8 px-5 pb-8 pt-6 sm:gap-12 sm:pb-12 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-20">
      <div className="text-center lg:text-left">
        <span className="eyebrow animate-fade-up">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-400" />
          </span>
          Yapay zekâ destekli düşünme aracı
        </span>

        <h1 className="mt-6 font-display text-[clamp(2.5rem,6.6vw,4.4rem)] leading-[1.03] tracking-[-0.02em] text-balance">
          {['Tek', 'bir', 'soru,'].map((w, i) => (
            <span key={i} className="inline-block animate-word" style={{ animationDelay: `${60 + i * 50}ms` }}>
              {w}&nbsp;
            </span>
          ))}
          <br className="hidden sm:block" />
          <span className="inline-block animate-word italic text-gradient" style={{ animationDelay: '220ms' }}>
            farklı zihinler.
          </span>
        </h1>

        {/* Ne işe yaradığını tek satırda söyleyen dönen cümle */}
        <p className="mt-4 min-h-[2.8em] text-[16px] leading-snug text-white/80 animate-fade-up sm:mt-5 sm:min-h-[1.8em] sm:text-lg" style={{ animationDelay: '260ms' }}>
          Mentoriva ile <RotatingText phrases={PHRASES} className="font-medium text-brand-300" />
        </p>

        <p className="mx-auto mt-3 max-w-[540px] text-[14.5px] leading-relaxed text-white/55 animate-fade-up sm:mt-4 sm:text-[15px] lg:mx-0" style={{ animationDelay: '300ms' }}>
          <span className="sm:hidden">Bir soru yaz; farklı düşünürler aynı anda cevap versin, seni en çok düşündürenle konuşmaya devam et.</span>
          <span className="hidden sm:inline">
            Aklındaki soruyu yaz; Jung, Nietzsche, Mevlânâ, Marcus Aurelius ve Seneca kendi düşünce sistemleriyle aynı anda
            cevap versin. Cevapları yan yana koy, seni en çok düşündürenle sohbete devam et.
          </span>
        </p>

        {/* Butonlar animasyonsuz: iOS Safari, opaklık animasyonuyla beliren düğmeleri
            ekrana dokunulana dek çizmeyebiliyor; ana çağrı her zaman ilk anda görünsün. */}
        <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:mt-8 sm:flex-row sm:gap-3 lg:justify-start">
          {user ? (
            <button onClick={onStart} className="btn-primary w-full !px-7 !py-3.5 sm:w-auto">
              Mentorunu seç
              <Arrow />
            </button>
          ) : guestTrial ? (
            <button onClick={onStart} className="btn-primary w-full !px-7 !py-3.5 sm:w-auto">
              Kayıt olmadan dene
              <Arrow />
            </button>
          ) : (
            <Link href="/kayit" className="btn-primary w-full !px-7 !py-3.5 sm:w-auto">
              Ücretsiz başla
              <Arrow />
            </Link>
          )}
          <button onClick={onHowItWorks} className="btn-ghost justify-center py-2 text-sm sm:btn-secondary sm:w-auto sm:!px-7 sm:!py-3.5 sm:text-base">
            Nasıl çalışır?
          </button>
        </div>

        {user ? (
          <p className="mt-6 text-sm text-white/45 animate-fade-up" style={{ animationDelay: '380ms' }}>
            Hoş geldin <span className="text-white/75">{user.name}</span> · bugün{' '}
            <span className="font-semibold text-brand-300">{user.remaining}</span> soru hakkın var.
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 animate-fade-up sm:mt-6 sm:gap-x-5 lg:justify-start" style={{ animationDelay: '380ms' }}>
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
