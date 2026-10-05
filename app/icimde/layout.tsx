import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'İçimde ne var?',
  description:
    'Ne hissettiğinin adını bilmen gerekmiyor. Yaşadığını kendi kelimelerinle anlatman için kısa bir keşif: duygular, aklından geçenler, senin için önemli olan ve kendi farkındalık kartın.',
  alternates: { canonical: '/icimde' },
};

export default function IcimdeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
