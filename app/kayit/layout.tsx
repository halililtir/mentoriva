import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ücretsiz üye ol',
  description: 'Ücretsiz üye ol; her gün sorularını farklı düşünce geleneklerinden mentorlara sor.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
