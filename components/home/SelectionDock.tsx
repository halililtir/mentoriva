'use client';

import Image from 'next/image';
import { getActiveMentor, getAccent } from '@/lib/mentors/metadata';
import type { MentorId } from '@/types';

interface Props {
  selectedIds: MentorId[];
  onContinue: () => void;
  onClear: () => void;
  hint?: string | null;
}

/** Mentor seçiliyken ekranın altında süzülen eylem çubuğu. */
export function SelectionDock({ selectedIds, onContinue, onClear, hint }: Props) {
  if (selectedIds.length === 0) return null;
  const mentors = selectedIds.map((id) => getActiveMentor(id));
  const single = mentors.length === 1;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-[560px] animate-dock-in"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="region"
      aria-label="Seçilen mentorlar"
    >
      <div className="glass flex items-center gap-2.5 rounded-2xl !bg-ink-50/95 p-2 pl-2.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] sm:gap-3 sm:p-2.5 sm:pl-3">
        <div className="flex -space-x-2.5">
          {mentors.map((m) => (
            <span
              key={m.id}
              className="relative h-8 w-8 overflow-hidden rounded-full border-2 animate-pop sm:h-10 sm:w-10"
              style={{ borderColor: getAccent(m.accentColor).hex }}
            >
              <Image src={m.portraitUrl} alt={m.name} fill sizes="40px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-white/90 sm:text-sm sm:font-normal">
            {single ? mentors[0]!.name : mentors.map((m) => m.shortName).join(' · ')}
          </p>
          <p className="hidden truncate text-[11px] text-white/50 sm:block">
            {hint ?? (single ? 'Tek mentor · veya 2–4 seçip karşılaştır' : `${mentors.length} mentor · karşılaştırma modu`)}
          </p>
        </div>

        <button onClick={onClear} className="hidden rounded-lg px-2 py-2 text-xs text-white/35 transition-colors hover:text-white/70 sm:block" aria-label="Seçimi temizle">
          Temizle
        </button>
        <button onClick={onContinue} className="btn-primary shrink-0 !px-3.5 !py-2.5 text-sm sm:!px-4">
          {single ? 'Sor' : 'Karşılaştır'}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
