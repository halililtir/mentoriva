/**
 * Paylaşım kartı görseli (1080×1920, Instagram hikâyesi boyutu).
 * next/og (Satori) ile Edge ortamında PNG üretilir; Node API'si kullanılmaz.
 */

import { ImageResponse } from 'next/og';
import { getAccent, type MentorMetadata } from '@/lib/mentors/metadata';
import { DISPLAY_HOST } from '@/lib/site';

export const CARD_SIZE = { width: 1080, height: 1920 };

export interface CardInput {
  mentor: MentorMetadata;
  question: string;
  highlight: string;
  /** Doğrulanmış alıntı (varsa) — "metin" ve "kaynak" ayrı. */
  quote?: { text: string; source: string } | null;
  /** Kartın üst etiketi, ör. "Günün sorusu". */
  label?: string;
  /** Portrenin çekileceği site adresi (istek URL'sinden). */
  origin: string;
}

// -----------------------------------------------------------
// Fontlar — Google Fonts'tan yalnızca kullanılan karakterlerle (TTF) indirilir.
// Satori woff2 desteklemediği için eski bir tarayıcı kimliğiyle TTF istenir.
// -----------------------------------------------------------

const fontCache = new Map<string, ArrayBuffer>();

export async function loadGoogleFont(family: string, weight: number, italic: boolean, text: string): Promise<ArrayBuffer | null> {
  const chars = [...new Set(text)].join('');
  const cacheKey = `${family}:${weight}:${italic}:${chars}`;
  const cached = fontCache.get(cacheKey);
  if (cached) return cached;
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:ital,wght@${italic ? 1 : 0},${weight}&text=${encodeURIComponent(chars)}`;
    const css = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30' } })).text();
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const data = await (await fetch(src)).arrayBuffer();
    if (fontCache.size > 200) fontCache.clear();
    fontCache.set(cacheKey, data);
    return data;
  } catch {
    return null; // Font gelmezse Satori'nin varsayılan fontu kullanılır
  }
}

/** Portrenin mutlak adresi — Satori görseli kendisi indirir (Edge'de dosya sistemi yok). */
export function portraitSrc(portraitUrl: string, origin: string): string {
  return new URL(portraitUrl, origin).toString();
}

export async function renderShareCard({ mentor, question, highlight, quote, label, origin }: CardInput): Promise<ImageResponse> {
  const a = getAccent(mentor.accentColor);
  const portrait = portraitSrc(mentor.portraitUrl, origin);

  const serifText = `${highlight}${question}${mentor.name}“”`;
  const sansText = `${label ?? ''}${quote?.text ?? ''}${quote?.source ?? ''}${mentor.tradition ?? ''}${DISPLAY_HOST}mentorivaSen de sor →Sorum—`;
  const [serif, serifItalic, sans] = await Promise.all([
    loadGoogleFont('Playfair Display', 400, false, serifText),
    loadGoogleFont('Playfair Display', 400, true, serifText),
    loadGoogleFont('Outfit', 400, false, sansText + sansText.toUpperCase()),
  ]);
  const fonts = [
    serif && { name: 'Serif', data: serif, weight: 400 as const, style: 'normal' as const },
    serifItalic && { name: 'Serif', data: serifItalic, weight: 400 as const, style: 'italic' as const },
    sans && { name: 'Sans', data: sans, weight: 400 as const, style: 'normal' as const },
  ].filter(Boolean) as Array<{ name: string; data: ArrayBuffer; weight: 400; style: 'normal' | 'italic' }>;

  // Uzun cümlelerde yazı küçülür
  const hl = highlight.length;
  const highlightSize = hl < 70 ? 72 : hl < 120 ? 62 : hl < 170 ? 54 : 46;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '110px 90px 100px',
          backgroundColor: '#070b14',
          backgroundImage: `radial-gradient(circle at 20% 8%, ${a.glow}, transparent 45%), radial-gradient(circle at 90% 95%, rgba(0,188,212,0.16), transparent 45%)`,
          color: '#f0f2f5',
          fontFamily: 'Sans',
        }}
      >
        {/* Üst: marka + etiket */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 44, letterSpacing: -1 }}>
            <span>mentor</span>
            <span style={{ color: '#00bcd4' }}>iva</span>
          </div>
          {label && (
            <div style={{ display: 'flex', fontSize: 28, color: a.hex, border: `2px solid ${a.border}`, borderRadius: 999, padding: '10px 26px', textTransform: 'uppercase', letterSpacing: 3 }}>
              {label}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
        {/* Soru */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 28, color: 'rgba(240,242,245,0.45)', letterSpacing: 4, textTransform: 'uppercase' }}>Sorum</div>
          <div style={{ display: 'flex', marginTop: 22, fontSize: 50, lineHeight: 1.25, fontFamily: 'Serif', fontStyle: 'italic', color: 'rgba(240,242,245,0.85)' }}>
            “{question}”
          </div>
        </div>

        {/* Mentor */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 110 }}>
          {portrait && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portrait} width={150} height={150} style={{ borderRadius: 999, border: `5px solid ${a.hex}`, objectFit: 'cover' }} alt="" />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 36 }}>
            <div style={{ display: 'flex', fontSize: 52, fontFamily: 'Serif', color: a.hex }}>{mentor.name}</div>
            {mentor.tradition && (
              <div style={{ display: 'flex', fontSize: 28, marginTop: 6, color: 'rgba(240,242,245,0.5)', letterSpacing: 3, textTransform: 'uppercase' }}>{mentor.tradition}</div>
            )}
          </div>
        </div>

        {/* Öne çıkan cümle */}
        <div style={{ display: 'flex', marginTop: 60, paddingLeft: 40, borderLeft: `6px solid ${a.hex}`, fontSize: highlightSize, lineHeight: 1.3, fontFamily: 'Serif' }}>
          {highlight}
        </div>

        {/* Doğrulanmış alıntı */}
        {quote && (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 70, padding: '36px 40px', borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', fontSize: 34, lineHeight: 1.4, color: 'rgba(240,242,245,0.8)' }}>“{quote.text}”</div>
            <div style={{ display: 'flex', marginTop: 16, fontSize: 26, color: 'rgba(240,242,245,0.45)' }}>— {quote.source}</div>
          </div>
        )}

        </div>

        {/* Alt: çağrı */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 40, borderTop: '2px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', fontSize: 34, color: 'rgba(240,242,245,0.75)' }}>Sen de sor →</div>
          <div style={{ display: 'flex', fontSize: 34, color: '#33d4dc' }}>{DISPLAY_HOST}</div>
        </div>
      </div>
    ),
    { ...CARD_SIZE, fonts: fonts.length ? fonts : undefined },
  );
}
