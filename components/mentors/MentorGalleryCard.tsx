'use client';

import { useRef } from 'react';
import Image from 'next/image';
import type { MentorMetadata } from '@/lib/mentors/metadata';
import { getAccent } from '@/lib/mentors/metadata';
import { cn } from '@/lib/cn';

interface Props {
  mentor: MentorMetadata;
  selected?: boolean;
  onSelect?: () => void;
  /** Kademeli giriş animasyonu gecikmesi (saniye). */
  delay?: number;
}

/**
 * Mentor kartı — imleci takip eden ışık ve hafif 3B eğilme.
 * Hareket CSS değişkenleriyle yapılır, React yeniden render edilmez.
 */
export function MentorGalleryCard({ mentor, selected, onSelect, delay = 0 }: Props) {
  const a = getAccent(mentor.accentColor);
  const isSoon = mentor.status === 'coming_soon';
  const ref = useRef<HTMLElement>(null);

  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || isSoon || e.pointerType !== 'mouse') return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
    el.style.setProperty('--rx', `${(0.5 - y) * 8}deg`);
    el.style.setProperty('--ry', `${(x - 0.5) * 10}deg`);
  };

  const onPointerLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <article
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn(
        'group relative rounded-2xl animate-fade-up [perspective:900px]',
        isSoon ? 'cursor-default' : 'cursor-pointer',
      )}
      style={{ animationDelay: `${delay}s` }}
      onClick={isSoon ? undefined : onSelect}
      role={isSoon ? undefined : 'button'}
      tabIndex={isSoon ? undefined : 0}
      aria-pressed={isSoon ? undefined : !!selected}
      onKeyDown={isSoon ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(); } }}
      aria-label={isSoon ? `${mentor.name} — yakında` : `${mentor.name} — ${selected ? 'seçimi kaldır' : 'seç'}`}
    >
      {/* Animasyon (article), kalkış (bu katman) ve eğilme (iç katman) ayrı
          elemanlarda — üçü de transform kullandığı için birbirini ezmesin. */}
      <div className={cn('transition-transform duration-500 ease-out-expo', !isSoon && 'group-hover:-translate-y-1.5')}>
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border transition-[transform,box-shadow,border-color] duration-500 ease-out-expo',
          '[transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]',
          isSoon ? 'border-white/[0.04]' : 'border-white/[0.07]',
        )}
        style={{
          borderColor: selected ? a.hex : undefined,
          boxShadow: selected
            ? `0 0 0 1px ${a.hex}, 0 20px 50px -15px ${a.glow}, 0 0 80px -30px ${a.hex}`
            : '0 20px 40px -24px rgba(0,0,0,0.9)',
        }}
      >
        {/* Portre */}
        <div className="relative aspect-[4/5] overflow-hidden" style={{ background: a.dark }}>
          <Image
            src={mentor.portraitUrl}
            alt={mentor.name}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            style={{ objectPosition: mentor.portraitPosition ?? 'center' }}
            className={cn(
              'object-cover transition-all duration-700 ease-out-expo',
              isSoon
                ? 'grayscale brightness-[0.45]'
                : 'grayscale-[35%] brightness-[0.8] group-hover:scale-[1.06] group-hover:grayscale-0 group-hover:brightness-95',
              selected && 'grayscale-0 brightness-95 scale-[1.04]',
            )}
          />

          {/* Renk tonu + alt gradient */}
          <div className="absolute inset-0 mix-blend-soft-light opacity-60" style={{ background: `linear-gradient(160deg, ${a.hex}40, transparent 60%)` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-0 via-ink-0/55 to-transparent" />

          {/* İmleci takip eden ışık */}
          {!isSoon && (
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: `radial-gradient(420px circle at var(--mx,50%) var(--my,50%), ${a.hex}26, transparent 45%)` }}
            />
          )}

          {/* Bilgi */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
            <p className={cn('text-[10px] uppercase tracking-[0.16em] font-medium', isSoon ? 'text-white/30' : 'text-white/55')}>
              {mentor.title}
            </p>
            <h3
              className="mt-1 font-display text-lg leading-tight sm:text-xl"
              style={{ color: isSoon ? 'rgba(255,255,255,0.45)' : a.hex }}
            >
              {mentor.name}
            </h3>
            {/* Kısa tanıtım: üzerine gelince açılır */}
            {!isSoon && (
              <p className="mt-0 max-h-0 overflow-hidden text-[12px] leading-relaxed text-white/60 opacity-0 transition-all duration-500 ease-out-expo group-hover:mt-2 group-hover:max-h-24 group-hover:opacity-100 group-focus-visible:mt-2 group-focus-visible:max-h-24 group-focus-visible:opacity-100">
                {mentor.shortBio}
              </p>
            )}
            <div className="mt-2.5 flex flex-wrap gap-1">
              {mentor.traitTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[9px] backdrop-blur-sm',
                    isSoon ? 'border-white/[0.05] bg-white/[0.02] text-white/25' : 'border-white/10 bg-white/[0.06] text-white/55',
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Ne zaman seçmeli — dokunmatik ekranlarda da görünür */}
        {!isSoon && mentor.bestFor && (
          <div className="border-t border-white/[0.06] bg-ink-0/60 px-4 py-3 sm:px-5">
            <p className="text-[9px] font-medium uppercase tracking-[0.16em]" style={{ color: a.hex }}>Ne zaman seç?</p>
            <p className="mt-1 text-[12px] leading-snug text-white/60">{mentor.bestFor}</p>
          </div>
        )}

        {/* Yakında rozeti */}
        {isSoon && (
          <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-ink-0/60 px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider text-amber-300 backdrop-blur-md">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Yakında
          </span>
        )}

        {/* Seçim işareti */}
        {!isSoon && (
          <div
            className={cn(
              'absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] backdrop-blur-md transition-all duration-300',
              selected ? 'scale-100' : 'border-white/25 bg-ink-0/40 group-hover:border-white/50',
            )}
            style={{ borderColor: selected ? a.hex : undefined, background: selected ? a.hex : undefined }}
            aria-hidden="true"
          >
            {selected && (
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="animate-pop">
                <path d="M3 8l3.5 3.5L13 5" stroke="#070b14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        )}
      </div>
      </div>
    </article>
  );
}
