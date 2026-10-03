import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sohbetlerim',
  description: 'Kaydettiğin mentor sohbetleri.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
