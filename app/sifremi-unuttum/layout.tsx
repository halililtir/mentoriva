import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Şifremi unuttum',
  description: 'Mentoriva şifreni sıfırla.',
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
