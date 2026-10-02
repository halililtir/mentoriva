import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Mentoriva — Tek soru, dört farklı zihin';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const MENTORS = [
  { name: 'Jung', color: '#00bcd4' },
  { name: 'Nietzsche', color: '#e89a3c' },
  { name: 'Mevlânâ', color: '#d4a574' },
  { name: 'Marcus Aurelius', color: '#8b9bb4' },
  { name: 'Seneca', color: '#c4816e' },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          // Satori kısayol `background` içinde renk + gradient karışımını desteklemiyor
          backgroundColor: '#070b14',
          backgroundImage:
            'radial-gradient(circle at 15% 10%, rgba(0,188,212,0.28), transparent 45%), radial-gradient(circle at 90% 90%, rgba(232,154,60,0.18), transparent 45%)',
          color: '#f0f2f5',
        }}
      >
        <div style={{ display: 'flex', fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>
          <span>mentor</span>
          <span style={{ color: '#00bcd4' }}>iva</span>
        </div>
        <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, lineHeight: 1.05, marginTop: 36, maxWidth: 900 }}>
          Tek bir soru, dört farklı zihin.
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: 'rgba(240,242,245,0.6)', marginTop: 24 }}>
          Tek bir cevap yerine, dört farklı bakış açısı.
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 56 }}>
          {MENTORS.map((m) => (
            <div
              key={m.name}
              style={{
                display: 'flex',
                padding: '10px 22px',
                borderRadius: 999,
                border: `2px solid ${m.color}`,
                color: m.color,
                fontSize: 26,
              }}
            >
              {m.name}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
