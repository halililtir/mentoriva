/** Giriş sonrası dönülecek yolu ?next= parametresinden güvenle okur (yalnızca site içi). */
export function readNextPath(fallback = '/'): string {
  if (typeof window === 'undefined') return fallback;
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
