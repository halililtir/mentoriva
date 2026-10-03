'use client';

import type { Synthesis } from '@/lib/mentors/synthesis';

/**
 * Karşılaştırmanın altında Mentoriva'nın kendi sesiyle sentez: ortak nokta,
 * ayrışma ve kişiye kalan soru. Mentor kartlarından farklı görünsün diye
 * marka renginde, pusula simgeli.
 */
export function SynthesisCard({ data }: { data: Synthesis }) {
  return (
    <section
      aria-label="Mentorlar nerede ayrışıyor"
      className="relative mx-auto mt-8 max-w-4xl overflow-hidden rounded-3xl border border-brand-400/30 bg-brand-500/[0.06] p-5 animate-fade-up sm:p-7"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/70 to-transparent" />
      <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-brand-300">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5 13 13l-4.5 2.5L11 11z" fill="currentColor" stroke="none" />
        </svg>
        Mentorlar nerede ayrışıyor?
      </p>

      <dl className="mt-4 space-y-4 text-[14.5px] leading-[1.7]">
        {data.agree && (
          <div>
            <dt className="text-[12px] font-medium text-white/50">Buluştukları yer</dt>
            <dd className="mt-0.5 text-white/80">{data.agree}</dd>
          </div>
        )}
        <div>
          <dt className="text-[12px] font-medium text-white/50">Ayrıldıkları yer</dt>
          <dd className="mt-0.5 text-white/85">{data.differ}</dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-brand-400/20 pt-4">
        <p className="text-[12px] font-medium text-brand-300">Sana kalan soru</p>
        <p className="mt-1.5 border-l-2 border-brand-400/70 pl-3.5 text-[16.5px] font-medium leading-relaxed text-white/90 sm:text-[17px]">{data.ask}</p>
      </div>
      <p className="mt-4 text-[11px] text-white/35">Mentoriva&apos;nın yukarıdaki cevaplardan çıkardığı özet.</p>
    </section>
  );
}

/** Cevaplar bitti, sentez bekleniyor. */
export function SynthesisPending() {
  return (
    <div className="mx-auto mt-8 flex max-w-4xl items-center gap-3 rounded-3xl border border-brand-400/20 bg-brand-500/[0.04] px-5 py-4 text-[13px] text-white/55 animate-fade-in">
      <span className="h-2 w-2 animate-pulse rounded-full bg-brand-400" />
      Mentoriva, cevapların nerede buluşup nerede ayrıldığını özetliyor…
    </div>
  );
}
