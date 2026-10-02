/**
 * Mentoriva Logosu — pusula + yarı-cyan renk şeması.
 * Bileşen olarak tutuldu ki tema reaktif olsun ve boyut prop'la ayarlansın.
 */

import { cn } from '@/lib/cn';

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: number;
  /** İğne ilk yüklemede yerine oturur. */
  animated?: boolean;
}

export function Logo({ className, showWordmark = true, size = 32, animated = false }: LogoProps) {
  return (
    <div className={cn('group/logo inline-flex items-center gap-2.5 select-none', className)}>
      <LogoMark size={size} animated={animated} />
      {showWordmark && (
        <span className="font-sans text-xl font-medium tracking-tight">
          <span className="text-paper">mentor</span>
          <span className="text-brand-500">iva</span>
        </span>
      )}
    </div>
  );
}

/** Sadece pusula ikonu. */
export function LogoMark({ size = 32, className, animated = false }: { size?: number; className?: string; animated?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="16" fill="none" stroke="#ffffff" strokeWidth="2.5" />
      <g
        className={cn(
          'origin-center transition-transform duration-700 ease-spring group-hover/logo:rotate-[22deg]',
          animated && 'animate-needle',
        )}
        style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
      >
        <path d="M 32 4 L 36 32 L 32 30 Z" fill="#ffffff" />
        <path d="M 4 32 L 32 28 L 30 32 Z" fill="#ffffff" />
        <path d="M 32 60 L 28 32 L 32 34 Z" fill="#00bcd4" />
        <path d="M 60 32 L 32 36 L 34 32 Z" fill="#00bcd4" />
        <path d="M 32 18 L 34 32 L 32 46 L 30 32 Z" fill="#00bcd4" opacity="0.9" />
      </g>
      <circle cx="32" cy="32" r="2" fill="#0a0c12" stroke="#ffffff" strokeWidth="1" />
    </svg>
  );
}
