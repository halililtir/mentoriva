import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kişilik Testi: Zihninin mimarı kim?',
  description:
    '7 soruluk eğlenceli test: düşünme tarzın hangi düşünüre daha yakın? Kayıt gerekmez.',
  alternates: { canonical: '/test' },
};

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
