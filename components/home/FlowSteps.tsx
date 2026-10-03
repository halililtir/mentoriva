import { cn } from '@/lib/cn';

const STEPS = ['Mentor seç', 'Soru yaz', 'Cevapları gör', 'Sohbet et'];

/**
 * Kullanıcının akışta nerede olduğunu gösteren küçük adım göstergesi.
 * `current` 0'dan başlar.
 */
export function FlowSteps({ current, className }: { current: number; className?: string }) {
  return (
    <nav aria-label="İlerleme" className={cn('mx-auto w-full max-w-xl px-5', className)}>
      <ol className="flex items-center">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className={cn('flex items-center', i < STEPS.length - 1 && 'flex-1')}>
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-all duration-500',
                    done && 'border-brand-500 bg-brand-500 text-onbrand',
                    active && 'border-brand-400 bg-brand-500/15 text-brand-200 shadow-[0_0_20px_-4px_rgba(0,188,212,0.8)]',
                    !done && !active && 'border-white/15 text-white/35',
                  )}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className={cn('whitespace-nowrap text-[10px] sm:text-[11px]', active ? 'text-white/80' : 'text-white/35')}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <span className="relative mx-1.5 mb-5 h-px flex-1 overflow-hidden bg-white/10 sm:mx-3">
                  <span
                    className="absolute inset-y-0 left-0 bg-brand-500 transition-[width] duration-700 ease-out-expo"
                    style={{ width: done ? '100%' : '0%' }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
