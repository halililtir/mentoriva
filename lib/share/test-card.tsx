/**
 * Kişilik testi sonuç kartı (1080×1920, hikâye boyutu) — next/og ile Edge'de.
 * Girdi yalnızca doğrulanmış sabit değerlerdir (mentor kimlikleri, yüzdeler,
 * hazır cümle havuzundan seçim); serbest metin almaz.
 */

import { ImageResponse } from 'next/og';
import { getAccent, getActiveMentor } from '@/lib/mentors/metadata';
import { DISPLAY_HOST } from '@/lib/site';
import { CARD_SIZE, loadGoogleFont, portraitSrc } from '@/lib/share/card';
import type { MentorId } from '@/types';

export interface TestCardInput {
  primary: MentorId;
  /** Yüksekten düşüğe: mentor ve yüzde. */
  results: Array<{ id: MentorId; pct: number }>;
  slap: string;
  origin: string;
}

export async function renderTestCard({ primary, results, slap, origin }: TestCardInput): Promise<ImageResponse> {
  const m = getActiveMentor(primary);
  const a = getAccent(m.accentColor);
  const top = results[0]?.pct ?? 0;
  const portrait = portraitSrc(m.portraitUrl, origin);
  const names = results.map((r) => getActiveMentor(r.id).shortName).join('');

  const serifText = `${m.name}${slap}%0123456789“”Seninki kim?`;
  const sansText = `mentoriva · testi çözKİŞİLİK TESTİZİHNİMİN MİMARISeninki kim?2 dakikalık test${m.tradition ?? ''}${names}%0123456789${DISPLAY_HOST === 'mentoriva' ? '' : DISPLAY_HOST + '/test'}→·`;
  const [serif, serifItalic, sans] = await Promise.all([
    loadGoogleFont('Playfair Display', 400, false, serifText),
    loadGoogleFont('Playfair Display', 400, true, serifText),
    loadGoogleFont('Outfit', 400, false, sansText + sansText.toLocaleLowerCase('tr-TR') + sansText.toLocaleUpperCase('tr-TR')),
  ]);
  const fonts = [
    serif && { name: 'Serif', data: serif, weight: 400 as const, style: 'normal' as const },
    serifItalic && { name: 'Serif', data: serifItalic, weight: 400 as const, style: 'italic' as const },
    sans && { name: 'Sans', data: sans, weight: 400 as const, style: 'normal' as const },
  ].filter(Boolean) as Array<{ name: string; data: ArrayBuffer; weight: 400; style: 'normal' | 'italic' }>;

  const slapSize = slap.length < 50 ? 60 : slap.length < 80 ? 52 : 46;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: '#070b14', color: '#f0f2f5', fontFamily: 'Sans' }}>
        {/* Portre: üst yarı, alta doğru erir */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={portrait} width={1080} height={1150} alt="" style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 1150, objectFit: 'cover', objectPosition: m.portraitPosition ?? 'center' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 1150, display: 'flex', backgroundImage: 'linear-gradient(180deg, rgba(7,11,20,0.55) 0%, rgba(7,11,20,0.05) 22%, rgba(7,11,20,0.55) 52%, rgba(7,11,20,0.92) 72%, #070b14 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 1920, display: 'flex', backgroundImage: `radial-gradient(circle at 50% 62%, ${a.glow}, transparent 55%)` }} />

        {/* Üst şerit */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '80px 80px 0', position: 'relative' }}>
          <div style={{ display: 'flex', fontSize: 46, letterSpacing: -1 }}>
            <span>mentor</span>
            <span style={{ color: '#33d4dc' }}>iva</span>
          </div>
          <div style={{ display: 'flex', fontSize: 24, letterSpacing: 5, color: '#f0f2f5', border: '2px solid rgba(255,255,255,0.35)', borderRadius: 999, padding: '12px 28px', backgroundColor: 'rgba(7,11,20,0.45)' }}>
            KİŞİLİK TESTİ
          </div>
        </div>

        {/* Sonuç */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 640, padding: '0 80px', position: 'relative' }}>
          <div style={{ display: 'flex', fontSize: 26, letterSpacing: 8, color: 'rgba(240,242,245,0.7)' }}>ZİHNİMİN MİMARI</div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 18 }}>
            <div style={{ display: 'flex', fontFamily: 'Serif', fontSize: 108, lineHeight: 1, color: a.hex }}>{m.name}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 26 }}>
            <div style={{ display: 'flex', height: 2, width: 90, backgroundColor: a.border }} />
            <div style={{ display: 'flex', fontFamily: 'Serif', fontStyle: 'italic', fontSize: 64, color: '#f0f2f5', margin: '0 28px' }}>%{top}</div>
            <div style={{ display: 'flex', height: 2, width: 90, backgroundColor: a.border }} />
          </div>
          {m.tradition && <div style={{ display: 'flex', fontSize: 26, letterSpacing: 6, marginTop: 10, color: 'rgba(240,242,245,0.55)' }}>{m.tradition.toLocaleUpperCase('tr-TR')}</div>}

          {/* Tek cümle */}
          <div style={{ display: 'flex', marginTop: 70, fontFamily: 'Serif', fontStyle: 'italic', fontSize: slapSize, lineHeight: 1.3, textAlign: 'center', justifyContent: 'center', color: '#f0f2f5' }}>
            “{slap}”
          </div>
        </div>

        {/* Dağılım */}
        <div style={{ display: 'flex', flexDirection: 'column', margin: '80px 120px 0', position: 'relative' }}>
          {results.map((r) => {
            const rm = getActiveMentor(r.id);
            const ra = getAccent(rm.accentColor);
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', width: 220, fontSize: 30, color: r.id === primary ? ra.hex : 'rgba(240,242,245,0.75)' }}>{rm.shortName}</div>
                <div style={{ display: 'flex', flexGrow: 1, height: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', width: `${Math.max(2, r.pct)}%`, height: 12, borderRadius: 999, backgroundColor: ra.hex }} />
                </div>
                <div style={{ display: 'flex', width: 100, justifyContent: 'flex-end', fontSize: 30, color: 'rgba(240,242,245,0.8)' }}>%{r.pct}</div>
              </div>
            );
          })}
        </div>

        {/* Alt çağrı */}
        <div style={{ display: 'flex', flexGrow: 1 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 80px 90px', paddingTop: 36, borderTop: '2px solid rgba(255,255,255,0.12)', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 44 }}>Seninki kim?</div>
            <div style={{ display: 'flex', fontSize: 26, marginTop: 6, color: 'rgba(240,242,245,0.55)' }}>2 dakikalık test</div>
          </div>
          <div style={{ display: 'flex', fontSize: 32, color: '#33d4dc' }}>{DISPLAY_HOST === 'mentoriva' ? 'mentoriva · testi çöz →' : `${DISPLAY_HOST}/test →`}</div>
        </div>
      </div>
    ),
    { ...CARD_SIZE, fonts: fonts.length ? fonts : undefined },
  );
}
