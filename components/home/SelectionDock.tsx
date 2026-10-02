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
      <div className="glass flex items-center gap-3 rounded-2xl p-2.5 pl-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
        <div className="flex -space-x-2.5">
          {mentors.map((m) => (
            <span
              key={m.id}
              className="relative h-10 w-10 overflow-hidden rounded-full border-2 animate-pop"
              style={{ borderColor: getAccent(m.accentColor).hex }}
            >
              <Image src={m.portraitUrl} alt={m.name} fill sizes="40px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-white/85">
            {single ? mentors[0]!.name : mentors.map((m) => m.shortName).join(' · ')}
          </p>
          <p className="truncate text-[11px] text-white/40">
            {hint ?? (single ? 'Tek mentor · veya 2–4 seçip karşılaştır' : `${mentors.length} mentor · karşılaştırma modu`)}
          </p>
        </div>

        <button onClick={onClear} className="hidden rounded-lg px-2 py-2 text-xs text-white/35 transition-colors hover:text-white/70 sm:block" aria-label="Seçimi temizle">
          Temizle
        </button>
        <button onClick={onContinue} className="btn-primary !px-4 !py-2.5 text-sm">
          {single ? 'Sor' : 'Karşılaştır'}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
