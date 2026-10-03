'use client';

import { cn } from '@/lib/cn';

const STAGES = ['Neredesin', 'Anlat', 'Sorular', 'Fark ediş', 'Adım'];

interface Props {
  /** 0-4 arası aşama; null ise gösterge gizlenir. */
  stage: number | null;
  onBack?: () => void;
  onExit?: () => void;
  children: React.ReactNode;
}

/**
 * Yolculuk ekranlarının sakin çerçevesi: üstte geri / bırak, ince bir
 * ilerleme çizgisi (sınav hissi vermeden), ortada tek bir içerik.
 */
export function JourneyFrame({ stage, onBack, onExit, children }: Props) {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-72px)] w-full max-w-2xl flex-col px-5 pb-12 pt-6">
      <div className="flex items-center justify-between">
        {onBack ? (
          <button onClick={onBack} className="btn-ghost text-sm" aria-label="Önceki adıma dön">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Geri
          </button>
        ) : <span />}
        {onExit && (
          <button onClick={onExit} className="text-xs text-white/35 transition-colors hover:text-white/70">
            Yolculuğu bırak
          </button>
        )}
      </div>

      {stage !== null && (
        <div className="mt-5" aria-label={`${STAGES[stage]} — ${stage + 1}/${STAGES.length}`}>
          <div className="flex gap-1.5">
            {STAGES.map((s, i) => (
              <span
                key={s}
                className={cn('h-1 flex-1 rounded-full transition-colors duration-700', i <= stage ? 'bg-brand-400/80' : 'bg-white/[0.07]')}
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/35">{STAGES[stage]}</p>
        </div>
      )}

      <div className="flex flex-1 flex-col justify-center py-8">{children}</div>
    </main>
  );
}

/** Yolculuğun ortak başlık stili — her ekranda tek ana soru. */
export function JourneyQuestion({ eyebrow, title, hint }: { eyebrow?: string; title: string; hint?: string }) {
  return (
    <div className="animate-fade-up">
      {eyebrow && <p className="text-[11px] uppercase tracking-[0.18em] text-brand-300/80">{eyebrow}</p>}
      <h1 className="mt-3 font-display text-[clamp(1.7rem,4.5vw,2.4rem)] leading-tight text-balance">{title}</h1>
      {hint && <p className="mt-3 text-[15px] leading-relaxed text-white/50">{hint}</p>}
    </div>
  );
}
