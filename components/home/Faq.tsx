'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SectionHeading } from '@/components/home/Sections';
import { Reveal } from '@/components/ui/Reveal';
import { FAQ } from '@/lib/home-content';
import { CONTACT_EMAIL } from '@/lib/site';
import { cn } from '@/lib/cn';

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-content px-5 py-12 sm:py-24" aria-labelledby="faq-title">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <SectionHeading eyebrow="Sık sorulan sorular" title="Aklındaki" accent="sorular" id="faq-title" align="left">
            Cevabını bulamadığın bir şey mi var? Bize{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-300 hover:text-brand-200">{CONTACT_EMAIL}</a> adresinden
            yaz ya da{' '}
            <Link href="/geri-bildirim" className="text-brand-300 hover:text-brand-200">geri bildirim</Link> bırak.
          </SectionHeading>
        </div>

        <Reveal delay={80}>
          <ul className="space-y-3">
            {FAQ.map((item, i) => {
              const isOpen = open === i;
              return (
                <li key={item.q} className={cn('glass overflow-hidden rounded-2xl transition-colors duration-300', isOpen && 'border-brand-500/25')}>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-[15px] font-medium text-white/85">{item.q}</span>
                    <span
                      className={cn(
                        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition-transform duration-500 ease-spring',
                        isOpen && 'rotate-45 border-brand-500/40 text-brand-300',
                      )}
                      aria-hidden="true"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    </span>
                  </button>
                  {/* grid-rows hilesi: yüksekliği bilmeden yumuşak aç/kapa */}
                  <div
                    id={`faq-${i}`}
                    className={cn('grid transition-[grid-template-rows] duration-500 ease-out-expo', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-white/55">{item.a}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
