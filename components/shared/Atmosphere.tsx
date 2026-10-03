/**
 * Sayfanın arkasında sabit duran atmosfer katmanı:
 * yavaşça sürüklenen aurora ışıkları, ince yıldız tozu, gren ve vinyet.
 * Tamamı CSS — JavaScript ve görsel dosyası yok. `prefers-reduced-motion`
 * açıkken animasyonlar globals.css tarafından durdurulur.
 */

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

const STARS = [
  'radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,0.35), transparent)',
  'radial-gradient(1px 1px at 72% 12%, rgba(255,255,255,0.25), transparent)',
  'radial-gradient(1.5px 1.5px at 38% 62%, rgba(95,228,234,0.35), transparent)',
  'radial-gradient(1px 1px at 86% 48%, rgba(255,255,255,0.3), transparent)',
  'radial-gradient(1px 1px at 22% 84%, rgba(255,255,255,0.2), transparent)',
  'radial-gradient(1.5px 1.5px at 58% 32%, rgba(212,165,116,0.35), transparent)',
  'radial-gradient(1px 1px at 92% 82%, rgba(255,255,255,0.25), transparent)',
  'radial-gradient(1px 1px at 6% 52%, rgba(255,255,255,0.2), transparent)',
].join(',');

export function Atmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-0">
      {/* Temel derinlik */}
      <div className="absolute inset-0" style={{ background: 'var(--atmo-base)' }} />

      {/* Aurora ışıkları (yoğunluk temaya göre) */}
      <div className="absolute inset-0" style={{ opacity: 'var(--atmo-glow)' }}>
        <div className="absolute -top-[20%] left-[5%] h-[60vmax] w-[60vmax] rounded-full bg-[radial-gradient(circle,rgba(0,188,212,0.16),transparent_60%)] blur-3xl animate-aurora-1" />
        <div className="absolute top-[30%] -right-[15%] h-[55vmax] w-[55vmax] rounded-full bg-[radial-gradient(circle,rgba(232,154,60,0.09),transparent_60%)] blur-3xl animate-aurora-2" />
        <div className="absolute -bottom-[25%] left-[20%] h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,rgba(120,90,220,0.10),transparent_60%)] blur-3xl animate-aurora-3" />
      </div>

      {/* Yıldız tozu */}
      <div className="absolute inset-0" style={{ backgroundImage: STARS, backgroundSize: '600px 600px', opacity: 'var(--atmo-stars)' }} />

      {/* İnce ızgara — üstte görünür, aşağı doğru kaybolur */}
      <div
        className="absolute inset-x-0 top-0 h-[80vh] opacity-[0.35] mask-fade-b"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--fg) / 0.03) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--fg) / 0.03) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Gren + vinyet */}
      <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: NOISE }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, var(--atmo-vignette) 100%)' }} />
    </div>
  );
}
