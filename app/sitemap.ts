import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { allQuotes } from '@/lib/quote-pages';

const PAGES: Array<{ path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }> = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/yolculuk', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/test', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/alintilar', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/hakkimizda', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/kayit', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/giris', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/geri-bildirim', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/gizlilik', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/kullanim-sartlari', priority: 0.3, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const quotes = allQuotes().map((q) => ({
    url: `${SITE_URL}/alintilar/${q.quote.id}`,
    lastModified,
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }));
  return [
    ...PAGES.map(({ path, priority, changeFrequency }) => ({ url: `${SITE_URL}${path}`, lastModified, changeFrequency, priority })),
    ...quotes,
  ];
}
