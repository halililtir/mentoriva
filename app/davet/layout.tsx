import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Arkadaşını davet et',
  description: 'Arkadaşını Mentoriva’ya davet et, ikiniz de bonus soru hakkı kazanın.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
