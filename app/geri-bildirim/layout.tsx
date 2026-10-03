import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Geri bildirim',
  description: 'Mentoriva hakkında düşünceni, önerini ya da karşılaştığın sorunu bize yaz.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
