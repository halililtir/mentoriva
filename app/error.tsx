'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { reportClientError } from '@/components/shared/ErrorReporter';

/** Sayfa çizilirken oluşan hatalarda gösterilir; hata admin paneline raporlanır. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError('render', error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <p className="eyebrow">Bir şeyler ters gitti</p>
      <h1 className="mt-5 font-display text-3xl text-balance sm:text-4xl">Bu sayfa şu an açılamadı.</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/60">
        Sorunu kaydettik. Sayfayı yeniden denemek çoğu zaman işe yarar; olmazsa ana sayfaya dönebilirsin.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button onClick={reset} className="btn-primary">Yeniden dene</button>
        <Link href="/" className="btn-secondary">Ana sayfa</Link>
      </div>
    </main>
  );
}
