import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Outfit, Playfair_Display } from 'next/font/google';
import { Atmosphere } from '@/components/shared/Atmosphere';
import { SessionProvider } from '@/lib/session';
import { SITE_URL } from '@/lib/site';
import { ANALYTICS_INIT } from '@/lib/analytics';
import { DEFAULT_THEME, THEME_INIT } from '@/lib/theme';
import './globals.css';

const display = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Outfit({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Mentoriva — Tek soru, farklı zihinler',
    template: '%s · Mentoriva',
  },
  description:
    'Aklındaki soruya Jung, Nietzsche, Mevlânâ, Marcus Aurelius ve Seneca\'nın bakış açısından farklı cevaplar. Kararlar, ilişkiler ve anlam arayışı için yapay zekâ destekli bir düşünme aracı.',
  applicationName: 'Mentoriva',
  keywords: ['mentor', 'felsefe', 'Jung', 'Nietzsche', 'Mevlânâ', 'Marcus Aurelius', 'Seneca', 'stoacılık', 'yapay zeka', 'perspektif', 'düşünce', 'psikoloji'],
  authors: [{ name: 'Mentoriva' }],
  creator: 'Mentoriva',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: SITE_URL,
    siteName: 'Mentoriva',
    title: 'Mentoriva — Tek soru, farklı zihinler',
    description: 'Aynı soruya Jung, Nietzsche, Mevlânâ, Marcus Aurelius ve Seneca\'dan farklı perspektifler.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mentoriva — Tek soru, farklı zihinler',
    description: 'Tek sorunuza farklı düşünce geleneklerinden bakış açıları.',
  },
  robots: { index: true, follow: true },
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
};

export const viewport: Viewport = {
  themeColor: '#070b14',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-theme={DEFAULT_THEME} className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        {/* Kayıtlı temayı ilk boyamadan önce uygula (lib/theme.ts) */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-500 focus:text-onbrand focus:rounded-card"
        >
          Ana içeriğe geç
        </a>
        <Atmosphere />
        <SessionProvider>
          <main id="main-content">{children}</main>
        </SessionProvider>
        {/* Vercel Web Analytics — çerezsiz; yalnızca production'da */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <Script id="va-init" strategy="afterInteractive">{ANALYTICS_INIT}</Script>
            <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
          </>
        )}
      </body>
    </html>
  );
}
