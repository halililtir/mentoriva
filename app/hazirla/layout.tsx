import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Söyleyeceğimi hazırla',
  description:
    'Birine söylemek istediğini anlamını ve itirazını kaybetmeden daha sakin, daha net ya da sınırını koruyarak ifade etmene yardım eden araç.',
  alternates: { canonical: '/hazirla' },
};

export default function HazirlaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
