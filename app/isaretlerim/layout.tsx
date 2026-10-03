import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'İşaretlerim',
  description: 'Mentoriva’daki yolculuğunda bıraktığın izler.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
