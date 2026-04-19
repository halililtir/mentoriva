'use client';

import Image from 'next/image';
import type { MentorMetadata, AccentTheme } from '@/lib/mentors/metadata';
import { getAccent } from '@/lib/mentors/metadata';
import { cn } from '@/lib/cn';

interface Props {
  mentor: MentorMetadata;
  selected?: boolean;
  onSelect?: () => void;
  delay?: number;
}

export function MentorGalleryCard({ mentor, selected, onSelect, delay = 0 }: Props) {
  const a = getAccent(mentor.accentColor);
  const isSoon = mentor.status === 'coming_soon';

  return (
    <article
      className={cn(
        'group relative rounded-2xl overflow-hidden transition-all duration-300',
        'border-[1.5px]',
        'animate-fade-up',
        isSoon
          ? 'cursor-default border-white/[0.04] opacity-100'
          : 'cursor-pointer border-white/[0.05] hover:-translate-y-1',
        selected && !isSoon && 'border-current',
      )}
      style={{
        animationDelay: `${delay}s`,
        animationFillMode: 'both',
        borderColor: selected && !isSoon ? a.hex : undefined,
        boxShadow: selected && !isSoon ? `0 0 0 1px ${a.hex}, 0 12px 32px -8px ${a.glow}` : undefined,
      }}
      onClick={isSoon ? undefined : onSelect}
      role={isSoon ? undefined : 'button'}
      tabIndex={isSoon ? undefined : 0}
      onKeyDown={isSoon ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(); } }}
      aria-label={isSoon ? `${mentor.name} — yakında` : `${mentor.name} seç`}
    >
      {/* Portre */}
      <div className="relative aspect-square overflow-hidden" style={{ background: a.dark }}>
        <Image
          src={mentor.portraitUrl}
          alt={mentor.name}
          fill
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
          style={{ objectPosition: mentor.portraitPosition ?? 'center' }}
          className={cn(
            'object-cover transition-all duration-500',
            isSoon
              ? 'grayscale-[70%] brightness-50 contrast-90'
              : 'grayscale-[30%] brightness-[0.85] contrast-[1.05] group-hover:grayscale-0 group-hover:brightness-[0.95]',
          )}
        />
        {/* Gradient overlay */}
        <div className={cn(
          'absolute inset-0',
          isSoon
            ? 'bg-gradient-to-t from-[#070b14]/[0.97] via-[#070b14]/65 to-[#070b14]/30'
            : 'bg-gradient-to-t from-[#070b14]/95 via-[#070b14]/50 to-transparent',
        )} />

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3
            className="font-display text-lg leading-tight mb-1"
            style={{ color: isSoon ? 'rgba(255,255,255,0.4)' : a.hex }}
          >
            {mentor.name}
          </h3>
          <p className={cn('text-[10px] uppercase tracking-[0.12em] font-medium', isSoon ? 'text-white/25' : 'text-white/45')}>
            {mentor.title}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {mentor.traitTags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  'text-[8px] px-2 py-0.5 rounded-full border',
                  isSoon
                    ? 'bg-white/[0.02] border-white/[0.04] text-white/25'
                    : 'bg-white/[0.05] border-white/[0.08] text-white/40',
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Yakında rozeti */}
      {isSoon && (
        <span className="absolute top-3 right-3 z-10 text-[9px] px-3 py-1 rounded-full bg-amber-500/12 border border-amber-500/25 text-amber-400 font-medium uppercase tracking-wide">
          Yakında
        </span>
      )}

      {/* Seçim checkbox */}
      {!isSoon && (
        <div
          className={cn(
            'absolute top-3 right-3 z-10 w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center transition-all',
            selected
              ? 'border-current bg-current'
              : 'border-white/15 bg-black/30',
          )}
          style={{
            borderColor: selected ? a.hex : undefined,
            background: selected ? a.hex : undefined,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={cn('transition-opacity', selected ? 'opacity-100' : 'opacity-0')}>
            <path d="M3 8l3.5 3.5L13 5" stroke="#070b14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </article>
  );
}
