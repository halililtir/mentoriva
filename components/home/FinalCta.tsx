'use client';

import Link from 'next/link';
import { CouncilOrbit } from '@/components/home/CouncilOrbit';
import { Reveal } from '@/components/ui/Reveal';
import type { SessionUser } from '@/lib/session';
import type { MentorId } from '@/types';

interface Props {
  user: SessionUser | null;
  selectedIds: MentorId[];
  onToggle: (id: MentorId) => void;
  onStart: () => void;
}

/** Sayfa sonu çağrısı — mentor yörüngesiyle birlikte. */
export function FinalCta({ user, selectedIds, onToggle, onStart }: Props) {
  return (
    <section className="mx-auto max-w-content px-5 py-16 sm:py-24">
      <Reveal>
        <div className="glass relative overflow-hidden rounded-[2rem] px-6 py-12 sm:px-12">
          <div className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-brand-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div className="text-center lg:text-left">
              <h2 className="font-display text-[clamp(2rem,4.5vw,3rem)] leading-tight text-balance">
                Mentorların <span className="italic text-gradient">hazır.</span>
                <br />
                Sıra senin sorunda.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/50 lg:mx-0">
                {user
                  ? 'Bir portreye dokunarak mentorunu seç, sonra aklındaki soruyu yaz.'
                  : 'Ücretsiz üye ol, her gün 5 soruyla farklı zihinlere danış. Kredi kartı istenmez.'}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                {user ? (
                  <button onClick={onStart} className="btn-primary w-full !px-7 !py-3.5 sm:w-auto">Mentorunu seç</button>
                ) : (
                  <>
                    <Link href="/kayit" className="btn-primary w-full !px-7 !py-3.5 sm:w-auto">Ücretsiz üye ol</Link>
                    <Link href="/giris" className="btn-secondary w-full !px-7 !py-3.5 sm:w-auto">Giriş yap</Link>
                  </>
                )}
              </div>
              <p className="mt-5 text-xs text-white/35">
                Hangi mentorun sana yakın olduğunu bilmiyor musun?{' '}
                <Link href="/test" className="text-brand-300 hover:text-brand-200">2 dakikalık testi çöz →</Link>
              </p>
            </div>

            <div className="scale-[0.85] sm:scale-100">
              <CouncilOrbit selectedIds={selectedIds} onToggle={onToggle} />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
