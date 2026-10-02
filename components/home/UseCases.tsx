'use client';

import { useState } from 'react';
import { SectionHeading } from '@/components/home/Sections';
import { Reveal } from '@/components/ui/Reveal';
import { USE_CASES } from '@/lib/home-content';
import { cn } from '@/lib/cn';

/** "Ne sorabilirim?" — konuya göre örnek sorular; tıklanan soru taslak olarak alınır. */
export function UseCases({ onPick }: { onPick: (question: string) => void }) {
  const [active, setActive] = useState(USE_CASES[0]!.id);
  const current = USE_CASES.find((u) => u.id === active) ?? USE_CASES[0]!;

  return (
    <section className="mx-auto max-w-content px-5 py-20 sm:py-24" aria-labelledby="usecases-title">
      <SectionHeading eyebrow="Ne sorabilirim?" title="Seni meşgul eden" accent="her şeyi." id="usecases-title">
        Kararsız kaldığın bir an, tekrar eden bir duygu, cevabını bulamadığın büyük bir soru. Bir konu seç, bir soruya
        dokun; onu mentorlarına sormaya hazır hale getirelim.
      </SectionHeading>

      <Reveal delay={100} className="mt-10">
        <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Konular">
          {USE_CASES.map((u) => (
            <button
              key={u.id}
              role="tab"
              aria-selected={u.id === active}
              onClick={() => setActive(u.id)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm transition-all duration-300',
                u.id === active
                  ? 'border-brand-500/50 bg-brand-500/15 text-brand-200 shadow-[0_0_24px_-8px_rgba(0,188,212,0.7)]'
                  : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white/85',
              )}
            >
              {u.label}
            </button>
          ))}
        </div>

        <div key={current.id} role="tabpanel" className="mx-auto mt-8 grid max-w-4xl gap-3 md:grid-cols-3">
          {current.questions.map((q, i) => (
            <button
              key={q}
              onClick={() => onPick(q)}
              className="group glass flex flex-col justify-between rounded-2xl p-5 text-left transition-all duration-500 ease-out-expo animate-fade-in [animation-fill-mode:both] hover:-translate-y-1 hover:border-brand-500/30"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="font-display text-[17px] leading-snug text-white/85">&ldquo;{q}&rdquo;</span>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs text-brand-300/80 transition-colors group-hover:text-brand-200">
                Bu soruyu sor
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
