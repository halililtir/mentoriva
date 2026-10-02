import Link from 'next/link';

/**
 * Moderasyon kriz ya da zararlı içerik algıladığında mentor cevabı yerine
 * gösterilen sakin, destekleyici kart. Metin sunucudan gelir (CRISIS_RESPONSE).
 */
export function CrisisNotice({ message, onBack }: { message: string; onBack?: () => void }) {
  return (
    <div role="alert" className="glass relative mx-auto mt-10 max-w-xl overflow-hidden rounded-3xl p-7 text-center animate-scale-in sm:p-9">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber-300/25 bg-amber-300/[0.08] text-amber-200">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
      </span>
      <p className="mt-5 text-[15px] leading-relaxed text-white/80">{message}</p>
      <p className="mt-3 text-sm leading-relaxed text-white/45">
        Yalnız değilsin. Güvendiğin biriyle konuşmak ya da bir uzmana ulaşmak iyi bir ilk adım olabilir.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {onBack && <button onClick={onBack} className="btn-secondary">Geri dön</button>}
        <Link href="/hakkimizda" className="btn-ghost text-sm">Mentoriva hakkında</Link>
      </div>
    </div>
  );
}
