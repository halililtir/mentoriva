import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { StudyRunner } from '@/components/studies/StudyRunner';
import { GUIDED_BY_ID, GUIDED_STUDIES } from '@/lib/studies/guided-content';

export function generateStaticParams() {
  return GUIDED_STUDIES.map((s) => ({ id: s.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const s = GUIDED_BY_ID.get(params.id);
  if (!s) return {};
  return { title: s.title, description: s.tagline, alternates: { canonical: `/calismalar/${s.id}` } };
}

export default function StudyPage({ params }: { params: { id: string } }) {
  const study = GUIDED_BY_ID.get(params.id);
  if (!study) notFound();
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-8">
        <Link href="/calismalar" className="btn-ghost -ml-2 text-sm">← Çalışmalar</Link>
        <p className="eyebrow mt-6">Rehberli çalışma</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,5vw,2.7rem)] leading-tight">{study.title}</h1>
        <StudyRunner study={study} />
      </main>
      <Footer />
    </div>
  );
}
