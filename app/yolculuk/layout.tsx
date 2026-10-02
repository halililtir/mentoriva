import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kendine Yolculuk',
  description:
    'Test değil, etiket yok. Duygularını, ihtiyaçlarını ve tekrar eden örüntülerini fark etmen için üç soru, üç pencere ve küçük bir adım.',
  alternates: { canonical: '/yolculuk' },
};

export default function YolculukLayout({ children }: { children: React.ReactNode }) {
  return children;
}
