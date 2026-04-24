import type { Metadata, Viewport } from 'next';
import './globals.css';

const SITE_URL =
  process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Mentoriva — Düşünce meclisin',
    template: '%s · Mentoriva',
  },
  description:
    'Tek sorunuza Jung, Nietzsche, Mevlânâ ve Marcus Aurelius\'tan dört farklı perspektif. ChatGPT bir cevap verir; Mentoriva bir düşünce meclisi kurar.',
  applicationName: 'Mentoriva',
  keywords: [
    'mentor',
    'felsefe',
    'Jung',
    'Nietzsche',
    'Mevlânâ',
    'Marcus Aurelius',
    'yapay zeka',
    'perspektif',
    'düşünce',
    'psikoloji',
  ],
  authors: [{ name: 'Mentoriva' }],
  creator: 'Mentoriva',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: SITE_URL,
    siteName: 'Mentoriva',
    title: 'Mentoriva — Düşünce meclisin',
    description:
      'Aynı soruya Jung, Nietzsche, Mevlânâ ve Marcus Aurelius\'tan dört farklı perspektif.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mentoriva — Düşünce meclisin',
    description:
      'Tek sorunuza dört farklı düşünürden bakış açısı.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark">
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-500 focus:text-ink-0 focus:rounded-card"
        >
          Ana içeriğe geç
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
