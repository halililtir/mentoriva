'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';

/**
 * İşaret madalyası — her işaretin anlamını taşıyan bir sembol ve kendi renkleri.
 * Saf SVG (görsel dosyası yok), her boyutta keskin; iki temada da çalışır.
 * Kazanılmamışsa gri ve kesik çerçeveli görünür.
 */

interface Look {
  /** Dış halka degradesi (açık → koyu). */
  ring: [string, string];
  /** İç disk degradesi. */
  disc: [string, string];
  /** Sembol rengi. */
  ink: string;
  motif: React.ReactNode;
}

const S = { fill: 'none', strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const LOOKS: Record<string, Look> = {
  // Basamaklar: ilk adım
  'ilk-adim': {
    ring: ['#7ee7dd', '#0f766e'], disc: ['#134e4a', '#042f2e'], ink: '#ccfbf1',
    motif: (
      <>
        <path d="M30 66h13v-11h13v-11h14" {...S} />
        <circle cx="70" cy="36" r="3.2" fill="currentColor" />
      </>
    ),
  },
  // Beş ses: ortada bir merkez, çevresinde beş nokta ve onları bağlayan halka
  'cok-sesli': {
    ring: ['#c4b5fd', '#5b21b6'], disc: ['#2e1065', '#1e0b3f'], ink: '#ede9fe',
    motif: (
      <>
        <circle cx="50" cy="50" r="15" {...S} strokeDasharray="3 5" />
        {[0, 72, 144, 216, 288].map((a) => {
          const r = (a - 90) * (Math.PI / 180);
          return <circle key={a} cx={50 + 15 * Math.cos(r)} cy={50 + 15 * Math.sin(r)} r="4.2" fill="currentColor" />;
        })}
        <circle cx="50" cy="50" r="3" fill="currentColor" opacity="0.7" />
      </>
    ),
  },
  // İçe doğru sarmal: derinleşmek
  derinlesen: {
    ring: ['#93c5fd', '#1e3a8a'], disc: ['#172554', '#0b1433'], ink: '#dbeafe',
    motif: <path d="M50 50a3 3 0 0 1 3 3 6 6 0 0 1-6 6 9 9 0 0 1-9-9 12 12 0 0 1 12-12 15 15 0 0 1 15 15 18 18 0 0 1-18 18" {...S} />,
  },
  // İçe bakan göz
  'ice-bakis': {
    ring: ['#a5b4fc', '#3730a3'], disc: ['#1e1b4b', '#110f2e'], ink: '#e0e7ff',
    motif: (
      <>
        <path d="M27 50c6-10 14-15 23-15s17 5 23 15c-6 10-14 15-23 15s-17-5-23-15z" {...S} />
        <circle cx="50" cy="50" r="7" {...S} />
        <circle cx="50" cy="50" r="2.4" fill="currentColor" />
      </>
    ),
  },
  // Hilal ve yıldızlar: geceleri düşünmeye dönen alışkanlık
  'dusunme-aliskanligi': {
    ring: ['#e2e8f0', '#475569'], disc: ['#1e293b', '#0b1220'], ink: '#f1f5f9',
    motif: (
      <>
        <path d="M58 30a20 20 0 1 0 12 30 16 16 0 1 1-12-30z" {...S} />
        <path d="M66 34l1.5 3.5L71 39l-3.5 1.5L66 44l-1.5-3.5L61 39l3.5-1.5z" fill="currentColor" />
        <circle cx="72" cy="52" r="1.8" fill="currentColor" />
      </>
    ),
  },
  // Kemer köprü ve su
  kopru: {
    ring: ['#7dd3fc', '#0369a1'], disc: ['#0c4a6e', '#062a40'], ink: '#e0f2fe',
    motif: (
      <>
        <path d="M26 56c6-14 14-20 24-20s18 6 24 20" {...S} />
        <path d="M24 56h52M34 56v-8M42 56v-15M50 56v-17M58 56v-15M66 56v-8" {...S} strokeWidth={2.4} />
        <path d="M30 65c4-3 8-3 12 0s8 3 12 0 8-3 12 0" {...S} strokeWidth={2.4} opacity="0.75" />
      </>
    ),
  },
  // Işık saçan alev: bir düşünceyi başkasına taşımak
  paylasan: {
    ring: ['#fdba74', '#c2410c'], disc: ['#7c2d12', '#431407'], ink: '#ffedd5',
    motif: (
      <>
        <path d="M50 30c7 9 11 15 11 22a11 11 0 0 1-22 0c0-5 3-9 6-12 0 5 2 8 5 9-1-7 0-13 0-19z" {...S} />
        <path d="M50 22v-3M32 32l-2-2M68 32l2-2M26 50h-3M74 50h3" {...S} strokeWidth={2.4} />
      </>
    ),
  },
  // Kilit taşı (temel taşı): kurucu
  kurucu: {
    ring: ['#fde68a', '#a16207'], disc: ['#422006', '#1f1003'], ink: '#fef3c7',
    motif: (
      <>
        <path d="M27 64a23 23 0 0 1 46 0" {...S} />
        <path d="M44 42l-3-12h18l-3 12z" fill="currentColor" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
        <path d="M35 51l-6-6M65 51l6-6" {...S} strokeWidth={2.4} />
        <path d="M24 68h52" {...S} />
      </>
    ),
  },
  // Sütun: destek
  destekci: {
    ring: ['#fda4af', '#9f1239'], disc: ['#4c0519', '#2a030e'], ink: '#ffe4e6',
    motif: (
      <>
        <path d="M33 32h34M36 37h28M33 70h34M36 65h28" {...S} />
        <path d="M41 37v28M50 37v28M59 37v28" {...S} strokeWidth={2.4} />
      </>
    ),
  },
  // Tüy kalem: katkı
  katki: {
    ring: ['#86efac', '#15803d'], disc: ['#14532d', '#052e16'], ink: '#dcfce7',
    motif: (
      <>
        <path d="M68 28C52 30 40 42 36 62l-4 8 8-4c20-4 32-16 34-32-2-4-4-6-6-6z" {...S} />
        <path d="M36 62c8-10 16-18 26-24" {...S} strokeWidth={2.4} />
      </>
    ),
  },
};

const FALLBACK: Look = { ring: ['#99f6e4', '#0f766e'], disc: ['#134e4a', '#042f2e'], ink: '#ccfbf1', motif: <circle cx="50" cy="50" r="10" {...S} /> };

export function BadgeMedal({ id, earned = true, size = 72, className }: { id: string; earned?: boolean; size?: number; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const look = LOOKS[id] ?? FALLBACK;
  const ring = earned ? look.ring : ['#cbd5e1', '#64748b'];
  const disc = earned ? look.disc : ['#334155', '#1e293b'];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn('shrink-0', !earned && 'opacity-45', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`r${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={ring[0]} />
          <stop offset="1" stopColor={ring[1]} />
        </linearGradient>
        <radialGradient id={`d${uid}`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={disc[0]} />
          <stop offset="1" stopColor={disc[1]} />
        </radialGradient>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Dış halka ve çentikler */}
      <circle cx="50" cy="50" r="47" fill={`url(#r${uid})`} />
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i * 15 * Math.PI) / 180;
        return <circle key={i} cx={50 + 43.5 * Math.cos(a)} cy={50 + 43.5 * Math.sin(a)} r="1.1" fill="#fff" opacity={earned ? 0.45 : 0.25} />;
      })}
      {/* İç disk */}
      <circle cx="50" cy="50" r="39" fill={`url(#d${uid})`} />
      <circle cx="50" cy="50" r="39" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="1" strokeDasharray={earned ? undefined : '3 3'} />
      {/* Sembol */}
      <g color={earned ? look.ink : '#cbd5e1'} stroke="currentColor">{look.motif}</g>
      {/* Parlama */}
      {earned && <path d="M14 42a37 37 0 0 1 72 0 60 40 0 0 0-72 0z" fill={`url(#g${uid})`} />}
    </svg>
  );
}
