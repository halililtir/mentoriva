import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aramızda',
  description:
    'İki kişinin kendi isteğiyle girdiği bir konuşma alanı: söylemek istediğini önce Mentoriva ile hazırlarsın, karşı tarafa yalnızca senin onayladığın hâl gider.',
  robots: { index: false },
};

export default function AramizdaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
