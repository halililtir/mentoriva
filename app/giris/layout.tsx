import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Giriş yap',
  description: 'Mentoriva hesabına giriş yap.',
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
