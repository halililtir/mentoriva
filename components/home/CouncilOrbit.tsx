'use client';

import Image from 'next/image';
import { ACTIVE_MENTORS, getAccent } from '@/lib/mentors/metadata';
import { LogoMark } from '@/components/shared/Logo';
import { cn } from '@/lib/cn';
import type { MentorId } from '@/types';

interface Props {
  selectedIds: MentorId[];
  onToggle: (id: MentorId) => void;
}

/**
 * Mentor yörüngesi: ortada pusula, etrafında yavaşça dönen mentorlar.
 * Portreler dönüş boyunca dik kalır (ters yönde döndürülür). Üzerine gelince
 * dönüş durur; portreye tıklamak o mentoru seçer.
 */
export function CouncilOrbit({ selectedIds, onToggle }: Props) {
  const count = ACTIVE_MENTORS.length;

  return (
    <div
      className="group/orbit relative mx-auto aspect-square w-[min(84vw,440px)] select-none"
      style={{ '--r': 'min(32vw, 168px)' } as React.CSSProperties}
    >
      {/* Arka hale */}
      <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(0,188,212,0.22),transparent_72%)] animate-breathe" />

      {/* Halkalar */}
      <div className="absolute inset-[6%] rounded-full border border-dashed border-white/[0.08] animate-spin-slow" />
      <div className="absolute inset-[22%] rounded-full border border-white/[0.06]" />
      <div className="absolute inset-[36%] rounded-full border border-brand-500/20" />

      {/* Merkez */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-ink-0/70 backdrop-blur-md shadow-[0_0_60px_-10px_rgba(0,188,212,0.6)] sm:h-28 sm:w-28">
          <LogoMark size={64} animated />
        </div>
      </div>

      {/* Dönen mentorlar */}
      <div className="absolute inset-0 animate-orbit group-hover/orbit:[animation-play-state:paused]">
        {/* Merkezden mentorlara ışık çizgileri */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="ray" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(0,188,212,0)" />
              <stop offset="100%" stopColor="rgba(0,188,212,0.35)" />
            </linearGradient>
          </defs>
          {ACTIVE_MENTORS.map((m, i) => {
            const angle = (i / count) * 360 - 90;
            return (
              <line
                key={m.id}
                x1="50"
                y1="50"
                x2="88"
                y2="50"
                stroke="url(#ray)"
                strokeWidth="0.25"
                transform={`rotate(${angle} 50 50)`}
              />
            );
          })}
        </svg>

        {ACTIVE_MENTORS.map((m, i) => {
          const a = getAccent(m.accentColor);
          const angle = (i / count) * 360 - 90;
          const id = m.id as MentorId;
          const selected = selectedIds.includes(id);
          return (
            <div
              key={m.id}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translate(var(--r)) rotate(${-angle}deg)` }}
            >
              <div className="animate-orbit-reverse group-hover/orbit:[animation-play-state:paused]">
                <button
                  type="button"
                  onClick={() => onToggle(id)}
                  aria-pressed={selected}
                  aria-label={`${m.name} — ${selected ? 'seçimi kaldır' : 'seç'}`}
                  className="group/m relative flex flex-col items-center"
                >
                  <span
                    className={cn(
                      'relative block h-16 w-16 overflow-hidden rounded-full border-2 transition-all duration-500 ease-spring sm:h-20 sm:w-20',
                      'group-hover/m:scale-110',
                      selected && 'scale-110',
                    )}
                    style={{
                      borderColor: selected ? a.hex : a.border,
                      boxShadow: selected ? `0 0 0 4px ${a.bg}, 0 0 40px ${a.glow}` : `0 0 30px -8px ${a.glow}`,
                    }}
                  >
                    <Image
                      src={m.portraitUrl}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover grayscale-[25%] transition-all duration-500 group-hover/m:grayscale-0"
                      style={{ objectPosition: m.portraitPosition ?? 'center' }}
                      priority
                    />
                  </span>
                  <span
                    className="mt-2 whitespace-nowrap rounded-full border border-white/10 bg-ink-0/70 px-2.5 py-0.5 text-[11px] backdrop-blur-md transition-colors"
                    style={{ color: selected ? a.text : 'rgb(var(--fg) / 0.75)' }}
                  >
                    {m.shortName}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
