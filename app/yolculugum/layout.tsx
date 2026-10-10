import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yolculuğum',
  description: 'Hafızan, farkındalık kartların, kayıtlı sohbetlerin, yolculuk haritaların ve verilerin tek yerde.',
  robots: { index: false },
};

export default function YolculugumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
