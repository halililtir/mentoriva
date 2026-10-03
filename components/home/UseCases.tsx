'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SectionHeading } from '@/components/home/Sections';
import { Reveal } from '@/components/ui/Reveal';
import { USE_CASES, type UseCaseQuestion } from '@/lib/home-content';
import { getActiveMentor, getAccent } from '@/lib/mentors/metadata';
import { cn } from '@/lib/cn';
import type { MentorId } from '@/types';

const HOW = ['Bir konu seç', 'Sana yakın gelen soruya dokun', 'Soru ve mentorlar hazır gelir'];

/**
 * "Ne sorabilirim?" — konuya göre örnek sorular. Bir soruya dokununca soru,
 * ona en çok yakışan iki mentorla birlikte soru ekranına taşınır.
 */
export function UseCases({
  onPick,
  onOwn,
}: {
  onPick: (question: string, mentors: MentorId[]) => void;
  /** "Kendi sorum var": mentor seçimine götürür. */
  onOwn: () => void;
}) {
  const [active, setActive] = useState(USE_CASES[0]!.id);
  const current = USE_CASES.find((u) => u.id === active) ?? USE_CASES[0]!;

  return (
    <section className="mx-auto max-w-content px-5 py-12 sm:py-24" aria-labelledby="usecases-title">
      <SectionHeading eyebrow="Ne sorabilirim?" title="Seni meşgul eden" accent="her şeyi." id="usecases-title">
        Kararsız kaldığın bir an, tekrar eden bir duygu, cevabını bulamadığın büyük bir soru. Aşağıdan başlayabilirsin.
      </SectionHeading>

      <ol className="mx-auto mt-6 hidden max-w-xl flex-wrap items-center sm:flex justify-center gap-x-2 gap-y-1.5 text-[12.5px] text-white/55" aria-label="Nasıl kullanılır">
        {HOW.map((h, i) => (
          <li key={h} className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/15 text-[11px] font-semibold text-brand-300">{i + 1}</span>
            {h}
            {i < HOW.length - 1 && <span className="ml-0.5 text-white/25" aria-hidden="true">→</span>}
          </li>
        ))}
      </ol>

      <Reveal delay={100} className="mx-auto mt-8 grid max-w-5xl gap-4 lg:mt-10 lg:grid-cols-[250px_1fr] lg:items-start lg:gap-6">
        {/* Konular: telefonda yana kayan şerit, geniş ekranda dikey liste */}
        <div
          role="tablist"
          aria-label="Konular"
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {USE_CASES.map((u) => {
            const on = u.id === active;
            return (
              <button
                key={u.id}
                role="tab"
                aria-selected={on}
                onClick={() => setActive(u.id)}
                className={cn(
                  'shrink-0 rounded-2xl border px-4 py-2.5 text-left transition-colors duration-300 lg:py-3.5',
                  on
                    ? 'border-brand-400/50 bg-brand-500/10'
                    : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20',
                )}
              >
                <span className={cn('block whitespace-nowrap text-[14px] font-medium', on ? 'text-white' : 'text-white/65')}>{u.label}</span>
                <span className={cn('hidden text-[12.5px] leading-snug lg:block', on ? 'text-brand-300/90' : 'text-white/40')}>{u.hint}</span>
              </button>
            );
          })}
        </div>

        {/* Seçili konunun soruları */}
        <div key={current.id} role="tabpanel" aria-label={current.label} className="glass rounded-3xl p-2 animate-fade-in sm:p-3">
          <div className="px-3 pb-2 pt-3">
            <p className="text-[12px] uppercase tracking-[0.16em] text-brand-300/85">{current.hint}</p>
            <h3 className="mt-1 font-display text-[1.35rem] text-white/90">{current.label}</h3>
          </div>
          <ul className="divide-y divide-white/[0.06]">
            {current.questions.map((item) => (
              <li key={item.q}>
                <QuestionRow item={item} onPick={onPick} />
              </li>
            ))}
          </ul>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-3 py-3 text-[13px]">
            <span className="text-white/45">Kendi sorun mu var?</span>
            <button onClick={onOwn} className="font-medium text-brand-300 hover:text-brand-200">Mentorunu seç, kendin yaz →</button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function QuestionRow({ item, onPick }: { item: UseCaseQuestion; onPick: (q: string, mentors: MentorId[]) => void }) {
  const mentors = item.mentors.map((id) => getActiveMentor(id));
  return (
    <button
      onClick={() => onPick(item.q, item.mentors)}
      className="group flex w-full flex-col gap-3 rounded-2xl px-3 py-4 text-left transition-colors hover:bg-white/[0.04] sm:flex-row sm:items-center sm:gap-5"
    >
      <span className="flex-1 text-[16px] font-medium leading-snug text-white/90 sm:text-[17px]">{item.q}</span>
      <span className="flex shrink-0 items-center gap-2.5">
        <span className="flex -space-x-2" aria-hidden="true">
          {mentors.map((m) => (
            <span key={m.id} className="relative h-7 w-7 overflow-hidden rounded-full border-2" style={{ borderColor: getAccent(m.accentColor).hex }}>
              <Image src={m.portraitUrl} alt="" fill sizes="28px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
            </span>
          ))}
        </span>
        <span className="text-[12.5px] text-white/50">
          {mentors.map((m) => m.shortName).join(' · ')}
        </span>
        <span className="ml-1 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-300 transition-transform group-hover:translate-x-0.5">
          Sor
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
    </button>
  );
}
