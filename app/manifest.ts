import type { MetadataRoute } from 'next';

/** Telefona eklenince uygulama gibi açılması için (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mentoriva',
    short_name: 'Mentoriva',
    description: 'Sıkıştığın yerde, farklı zihinler. Zor bir kararı, söyleyemediğin bir sözü ya da içinden çıkamadığın bir hissi büyük düşünürlerin bakışıyla düşün.',
    lang: 'tr',
    dir: 'ltr',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#070b14',
    theme_color: '#070b14',
    categories: ['lifestyle', 'education'],
    icons: [
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Karar veriyorum', url: '/calismalar/karar' },
      { name: 'Bir konuşmam var', url: '/hazirla' },
      { name: 'Kendimi anlamak', url: '/kendim' },
    ],
  };
}
