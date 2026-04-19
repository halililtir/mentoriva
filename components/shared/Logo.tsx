/**
 * Mentoriva Logosu
 *
 * Senin orijinal logonun yeniden yorumu: pusula + yarı-cyan renk şeması.
 * Public/logo.svg yerine bileşen tercih ettik ki tema reaktif olsun ve
 * boyut/renk prop'larıyla kolayca ayarlanabilsin.
 */

import { cn } from '@/lib/cn';

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}

export function Logo({ className, showWordmark = true, size = 32 }: LogoProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 select-none',
        className,
      )}
    >
      <LogoMark size={size} />
      {showWordmark && (
        <span className="font-sans text-xl font-medium tracking-tight">
          <span className="text-paper">mentor</span>
          <span className="text-brand-500">iva</span>
        </span>
      )}
    </div>
  );
}

/**
 * Sadece pusula iconu — header'da veya küçük yerlerde kullanılabilir.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Dış halka */}
      <circle
        cx="32"
        cy="32"
        r="16"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
      />
      {/* Pusula ucu — beyaz (batı/kuzeybatı) */}
      <path
        d="M 32 4 L 36 32 L 32 30 Z"
        fill="#ffffff"
      />
      <path
        d="M 4 32 L 32 28 L 30 32 Z"
        fill="#ffffff"
      />
      {/* Pusula ucu — cyan (doğu/güneydoğu) */}
      <path
        d="M 32 60 L 28 32 L 32 34 Z"
        fill="#00bcd4"
      />
      <path
        d="M 60 32 L 32 36 L 34 32 Z"
        fill="#00bcd4"
      />
      {/* İç iğne */}
      <path
        d="M 32 18 L 34 32 L 32 46 L 30 32 Z"
        fill="#00bcd4"
        opacity="0.9"
      />
      {/* Merkez nokta */}
      <circle cx="32" cy="32" r="2" fill="#0a0c12" stroke="#ffffff" strokeWidth="1" />
    </svg>
  );
}
