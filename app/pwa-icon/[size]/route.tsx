/**
 * Uygulama simgeleri (192, 512 ve maskable). Maskable sürümde zemin tam karedir,
 * Android şekli ne kırparsa kırpsın pusula güvenli alanda kalır.
 */

import { ImageResponse } from 'next/og';

// Node'da next/og Windows'ta font yolu hatası verir (bkz. paylaşım kartı).
export const runtime = 'edge';

const SIZES: Record<string, { px: number; scale: number; round: boolean }> = {
  '192': { px: 192, scale: 1, round: true },
  '512': { px: 512, scale: 1, round: true },
  maskable: { px: 512, scale: 0.72, round: false },
};

export function GET(_req: Request, { params }: { params: { size: string } }) {
  const s = SIZES[params.size];
  if (!s) return new Response('Bulunamadı', { status: 404 });
  const mark = Math.round(s.px * s.scale * (s.round ? 0.86 : 1));
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#070b14' }}>
        <svg width={mark} height={mark} viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="32" fill="#111b30" />
          <circle cx="32" cy="32" r="30.5" fill="none" stroke="#00bcd4" strokeOpacity="0.45" strokeWidth="1.5" />
          <g transform="translate(32 32) scale(0.74) translate(-32 -32)">
            <circle cx="32" cy="32" r="16" fill="none" stroke="#ffffff" strokeWidth="3" />
            <path d="M 32 4 L 36 32 L 32 30 Z" fill="#ffffff" />
            <path d="M 4 32 L 32 28 L 30 32 Z" fill="#ffffff" />
            <path d="M 32 60 L 28 32 L 32 34 Z" fill="#00bcd4" />
            <path d="M 60 32 L 32 36 L 34 32 Z" fill="#00bcd4" />
            <path d="M 32 18 L 34 32 L 32 46 L 30 32 Z" fill="#00bcd4" />
            <circle cx="32" cy="32" r="2.4" fill="#070b14" stroke="#ffffff" strokeWidth="1.2" />
          </g>
        </svg>
      </div>
    ),
    { width: s.px, height: s.px, headers: { 'Cache-Control': 'public, max-age=604800' } },
  );
}
