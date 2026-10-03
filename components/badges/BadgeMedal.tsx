'use client';

import { useId } from 'react';
import { BADGE_BY_ID } from '@/lib/badges-public';
import { cn } from '@/lib/cn';

/**
 * İşaret madalyası — saf SVG, her boyutta keskin.
 *
 * Katmanlar (dıştan içe): metalik kabartmalı kenar (verilen işaretlerde tırtıklı
 * mühür), guilloche örgü bandı, kazınmış yazı (büyük boyutta), derin renkli
 * iç disk, ışıldayan sembol ve parlama. Kazanılmamışsa tek renk, sönük.
 */

interface Look {
  /** Metal: açık, orta, koyu. */
  metal: [string, string, string];
  /** İç disk: merkez, kenar. */
  disc: [string, string];
  /** Sembol ve ışıma rengi. */
  ink: string;
  motif: React.ReactNode;
}

const L = { fill: 'none', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const T = { ...L, strokeWidth: 1.2 };

const LOOKS: Record<string, Look> = {
  'ilk-adim': {
    metal: ['#d5fbf5', '#2fb3a5', '#0b4d47'], disc: ['#12544f', '#04201e'], ink: '#bff7ee',
    motif: (
      <>
        <path d="M33 64h11v-9h11v-9h12" {...L} />
        <path d="M33 64v3M44 55v12M55 46v21" {...T} opacity="0.5" />
        <path d="M69 37l-2.5-4.5M71.5 41l4-2M66 33.5l1-5" {...T} />
        <circle cx="68" cy="39" r="2.2" fill="currentColor" />
      </>
    ),
  },
  'cok-sesli': {
    metal: ['#efe9ff', '#9b7be8', '#3b1f80'], disc: ['#3a1a7a', '#120629'], ink: '#e6dcff',
    motif: (
      <>
        <circle cx="50" cy="50" r="17" {...T} strokeDasharray="1.5 3" />
        <circle cx="50" cy="50" r="9" {...T} opacity="0.6" />
        {[0, 72, 144, 216, 288].map((a) => {
          const r = (a - 90) * (Math.PI / 180);
          const x = 50 + 17 * Math.cos(r);
          const y = 50 + 17 * Math.sin(r);
          return (
            <g key={a}>
              <path d={`M50 50L${x} ${y}`} {...T} opacity="0.45" />
              <circle cx={x} cy={y} r="3.6" fill="currentColor" />
            </g>
          );
        })}
        <circle cx="50" cy="50" r="2.6" fill="currentColor" />
      </>
    ),
  },
  derinlesen: {
    metal: ['#dbeaff', '#4f86e0', '#13306f'], disc: ['#163374', '#060f2b'], ink: '#d3e4ff',
    motif: (
      <>
        <path d="M50 50a2.5 2.5 0 0 1 2.5 2.5 5 5 0 0 1-5 5 7.5 7.5 0 0 1-7.5-7.5 10 10 0 0 1 10-10 12.5 12.5 0 0 1 12.5 12.5 15 15 0 0 1-15 15 17.5 17.5 0 0 1-17.5-17.5" {...L} />
        <circle cx="50" cy="50" r="1.6" fill="currentColor" />
      </>
    ),
  },
  'ice-bakis': {
    metal: ['#e4e6ff', '#7279e6', '#26286e'], disc: ['#22256a', '#0b0c2b'], ink: '#dfe2ff',
    motif: (
      <>
        <path d="M28 50c6-9.5 13.5-14 22-14s16 4.5 22 14c-6 9.5-13.5 14-22 14s-16-4.5-22-14z" {...L} />
        <circle cx="50" cy="50" r="8" {...L} />
        <circle cx="50" cy="50" r="3" fill="currentColor" />
        <path d="M50 30v-4M50 74v-4M36 34l-2-3M64 34l2-3M36 66l-2 3M64 66l2 3" {...T} opacity="0.6" />
      </>
    ),
  },
  'dusunme-aliskanligi': {
    metal: ['#f4f6fa', '#9aa6ba', '#3a4558'], disc: ['#243047', '#090e19'], ink: '#eef2f8',
    motif: (
      <>
        <path d="M57 31a19 19 0 1 0 13 29 15.5 15.5 0 1 1-13-29z" {...L} />
        <path d="M66 33l1.3 3.2 3.2 1.3-3.2 1.3L66 42l-1.3-3.2-3.2-1.3 3.2-1.3z" fill="currentColor" />
        <circle cx="71.5" cy="49" r="1.4" fill="currentColor" />
        <circle cx="63" cy="51" r="1" fill="currentColor" opacity="0.7" />
        {/* yedi gün: alttaki yedi nokta */}
        {Array.from({ length: 7 }, (_, i) => <circle key={i} cx={35 + i * 5} cy="72" r="1.2" fill="currentColor" opacity="0.75" />)}
      </>
    ),
  },
  kopru: {
    metal: ['#ddf3ff', '#3fa3d8', '#0c4466'], disc: ['#0e4466', '#041a29'], ink: '#d6f0ff',
    motif: (
      <>
        <path d="M25 57c6-14 14-21 25-21s19 7 25 21" {...L} />
        <path d="M23 57h54" {...L} />
        <path d="M33 57v-9M41.5 57v-15M50 57v-17.5M58.5 57v-15M67 57v-9" {...T} />
        <path d="M29 65c3.5-2.5 7-2.5 10.5 0s7 2.5 10.5 0 7-2.5 10.5 0 7 2.5 10.5 0" {...T} opacity="0.7" />
        <path d="M35 70c3-2 6-2 9 0s6 2 9 0 6-2 9 0" {...T} opacity="0.4" />
      </>
    ),
  },
  paylasan: {
    metal: ['#ffeedd', '#f08a3c', '#7a2a08'], disc: ['#6e2508', '#240b02'], ink: '#ffe4cc',
    motif: (
      <>
        <path d="M50 31c7 8.5 10.5 14 10.5 20.5a10.5 10.5 0 0 1-21 0c0-4.6 2.7-8.4 5.6-11.2 0 4.6 1.9 7.6 4.7 8.6-.9-6.6 0-12.2.2-17.9z" {...L} />
        <path d="M50 22.5v-4M33.5 31l-2.8-2.8M66.5 31l2.8-2.8M27 48h-4M73 48h4" {...T} />
        <path d="M42 70h16" {...L} />
        <path d="M45 75h10" {...T} opacity="0.6" />
      </>
    ),
  },
  kurucu: {
    metal: ['#fff6d6', '#e1b44c', '#7a5212'], disc: ['#3d2606', '#140c02'], ink: '#ffefc2',
    motif: (
      <>
        {/* Kemer ve kilit taşı */}
        <path d="M28 66V52a22 22 0 0 1 44 0v14" {...L} />
        <path d="M34 66V53a16 16 0 0 1 32 0v13" {...T} opacity="0.6" />
        <path d="M44.5 37.5l-2-9h15l-2 9z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
        <path d="M24 66h52" {...L} />
        <path d="M27 70.5h46" {...T} opacity="0.6" />
        <path d="M50 22l1 2.4 2.4 1-2.4 1L50 29l-1-2.6-2.4-1 2.4-1z" fill="currentColor" />
      </>
    ),
  },
  destekci: {
    metal: ['#ffe4ea', '#e0607e', '#6e1328'], disc: ['#5a0f22', '#1e040b'], ink: '#ffdce5',
    motif: (
      <>
        <path d="M33 31h34M36 35.5h28" {...L} />
        <path d="M34 31c0-3 3-4 5-2M66 31c0-3-3-4-5-2" {...T} />
        <path d="M41 35.5v28M50 35.5v28M59 35.5v28" {...L} strokeWidth={2} />
        <path d="M45.5 35.5v28M54.5 35.5v28" {...T} opacity="0.4" />
        <path d="M36 63.5h28M33 68h34M30 72.5h40" {...L} />
      </>
    ),
  },
  katki: {
    metal: ['#e2fbe8', '#3fbf6a', '#0f5226'], disc: ['#134d27', '#04190b'], ink: '#d4f8de',
    motif: (
      <>
        <path d="M69 27C53 29 41 41 37 61l-4 8.5 8.5-4c20-4 32-16 33.5-32-1.8-4-3.8-6.2-6-6.5z" {...L} />
        <path d="M37 61c8-10 16-18 26-24" {...T} />
        <path d="M46 52l-4-1M51 47l-4.5-1.2M56 42l-4.5-1.4M61 37.5l-4.2-1.6" {...T} opacity="0.55" />
        <path d="M30 75c6-2 12-1 18 1" {...T} opacity="0.6" />
      </>
    ),
  },
};

const FALLBACK = LOOKS['ilk-adim']!;
const GRAY: Pick<Look, 'metal' | 'disc' | 'ink'> = { metal: ['#e2e8f0', '#94a3b8', '#475569'], disc: ['#334155', '#151c28'], ink: '#cbd5e1' };

/** Tırtıklı mühür kenarı (verilen işaretler için). */
function scallopPath(points = 36, outer = 49, inner = 46.2): string {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / points - Math.PI / 2;
    d += `${i === 0 ? 'M' : 'L'}${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
  }
  return `${d}Z`;
}
const SCALLOP = scallopPath();

export function BadgeMedal({ id, earned = true, size = 72, className }: { id: string; earned?: boolean; size?: number; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const def = BADGE_BY_ID[id];
  const look = LOOKS[id] ?? FALLBACK;
  const { metal, disc, ink } = earned ? look : GRAY;
  const seal = def?.kind === 'grant';
  /** Küçük boyutlarda ince detaylar gürültü olur; yazı ve örgü yalnızca büyükte. */
  const detailed = size >= 88;
  const g = (n: string) => `${n}${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={cn('shrink-0 overflow-visible', !earned && 'opacity-50', className)} role="img" aria-label={def?.name}>
      <defs>
        <linearGradient id={g('m')} x1="0.15" y1="0.05" x2="0.85" y2="0.95">
          <stop offset="0" stopColor={metal[0]} />
          <stop offset="0.45" stopColor={metal[1]} />
          <stop offset="0.75" stopColor={metal[2]} />
          <stop offset="1" stopColor={metal[1]} />
        </linearGradient>
        <linearGradient id={g('mi')} x1="0.85" y1="0.95" x2="0.15" y2="0.05">
          <stop offset="0" stopColor={metal[0]} />
          <stop offset="0.5" stopColor={metal[1]} />
          <stop offset="1" stopColor={metal[2]} />
        </linearGradient>
        <radialGradient id={g('d')} cx="0.42" cy="0.36" r="0.75">
          <stop offset="0" stopColor={disc[0]} />
          <stop offset="1" stopColor={disc[1]} />
        </radialGradient>
        <radialGradient id={g('glow')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={ink} stopOpacity={earned ? 0.35 : 0} />
          <stop offset="1" stopColor={ink} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g('sheen')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
        </linearGradient>
        {/* Guilloche bandını halka içine kırp */}
        <clipPath id={g('band')}>
          <path d="M50 5.5a44.5 44.5 0 1 1 0 89 44.5 44.5 0 1 1 0-89zM50 16a34 34 0 1 0 0 68 34 34 0 1 0 0-68z" clipRule="evenodd" fillRule="evenodd" />
        </clipPath>
        <filter id={g('bl')} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <path id={g('top')} d="M16.6 50a33.4 33.4 0 0 1 66.8 0" />
        <path id={g('bot')} d="M14.2 50a35.8 35.8 0 0 0 71.6 0" />
      </defs>

      {/* Gölge */}
      {earned && <ellipse cx="50" cy="96" rx="30" ry="3" fill="#000" opacity="0.18" filter={`url(#${g('bl')})`} />}

      {/* Dış kenar: mühür (tırtıklı) ya da yuvarlak */}
      {seal ? <path d={SCALLOP} fill={`url(#${g('m')})`} /> : <circle cx="50" cy="50" r="48" fill={`url(#${g('m')})`} />}
      <circle cx="50" cy="50" r="44.5" fill={`url(#${g('mi')})`} />

      {/* Guilloche örgü bandı */}
      <g clipPath={`url(#${g('band')})`} opacity={detailed ? 0.55 : 0.35}>
        {Array.from({ length: detailed ? 40 : 24 }, (_, i) => (
          <ellipse
            key={i}
            cx="50"
            cy="50"
            rx="40"
            ry="27"
            fill="none"
            stroke={metal[0]}
            strokeWidth={0.35}
            transform={`rotate(${(i * 180) / (detailed ? 40 : 24)} 50 50)`}
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="44.5" fill="none" stroke={metal[0]} strokeOpacity="0.7" strokeWidth="0.6" />

      {/* Kazınmış yazı */}
      {detailed && def && (
        <g style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700 }} fontSize="6" letterSpacing="1.6" textAnchor="middle">
          {/* Kazıma: altta açık bir kopya (ışık), üstte koyu metin */}
          {[{ dy: 0.45, fill: metal[0], op: 0.8 }, { dy: 0, fill: metal[2], op: 0.95 }].map((l, i) => (
            <g key={i} transform={`translate(0 ${l.dy})`} fill={l.fill} opacity={l.op}>
              <text><textPath href={`#${g('top')}`} startOffset="50%">{def.name.toLocaleUpperCase('tr-TR')}</textPath></text>
              <text fontSize="4.6" letterSpacing="2.4"><textPath href={`#${g('bot')}`} startOffset="50%">✦ MENTORIVA ✦</textPath></text>
            </g>
          ))}
        </g>
      )}

      {/* İç disk */}
      <circle cx="50" cy="50" r={detailed ? 29.5 : 34} fill={`url(#${g('d')})`} stroke={metal[2]} strokeWidth="1.2" />
      <circle cx="50" cy="50" r={detailed ? 27.5 : 32} fill="none" stroke={ink} strokeOpacity="0.18" strokeWidth="0.5" strokeDasharray={earned ? undefined : '1.5 1.5'} />
      <circle cx="50" cy="50" r="22" fill={`url(#${g('glow')})`} />

      {/* Sembol: altında yumuşak ışıma, üstünde net çizgi */}
      <g transform={detailed ? 'translate(50 50) scale(0.8) translate(-50 -50)' : 'translate(50 50) scale(0.9) translate(-50 -50)'}>
        {earned && (
          <g color={ink} stroke="currentColor" opacity="0.55" filter={`url(#${g('bl')})`}>{look.motif}</g>
        )}
        <g color={ink} stroke="currentColor">{look.motif}</g>
      </g>

      {/* Parlama */}
      {earned && <circle cx="50" cy="50" r="48" fill={`url(#${g('sheen')})`} style={{ mixBlendMode: 'screen' }} />}
    </svg>
  );
}
