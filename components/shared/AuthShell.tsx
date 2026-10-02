import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { ACTIVE_MENTORS, getAccent } from '@/lib/mentors/metadata';

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Giriş / kayıt / şifre sıfırlama sayfalarının ortak çerçevesi. */
export function AuthShell({ eyebrow, title, subtitle, children, footer }: Props) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <Link href="/" className="mb-8 animate-fade-down" aria-label="Ana sayfa">
        <Logo animated />
      </Link>

      <div className="glass relative w-full max-w-[420px] overflow-hidden rounded-3xl p-7 animate-scale-in sm:p-9">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/70 to-transparent" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />

        {/* Mentorlar — küçük portre dizisi */}
        <div className="relative mb-6 flex justify-center -space-x-2.5">
          {ACTIVE_MENTORS.map((m, i) => (
            <span
              key={m.id}
              className="relative h-9 w-9 overflow-hidden rounded-full border-2 animate-pop"
              style={{ borderColor: getAccent(m.accentColor).hex, animationDelay: `${150 + i * 70}ms`, boxShadow: '0 0 0 3px #0c1220' }}
            >
              <Image src={m.portraitUrl} alt="" fill sizes="36px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
            </span>
          ))}
        </div>

        <div className="relative text-center">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 className="mt-4 font-display text-[28px] leading-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-white/45">{subtitle}</p>}
        </div>

        <div className="relative mt-7">{children}</div>
      </div>

      {footer && <div className="mt-6 text-center text-[13px] text-white/40 animate-fade-up">{footer}</div>}
    </div>
  );
}

/** Form alanı + etiket. */
export function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-xs font-medium text-white/55">{label}</span>
      <input {...props} className="input-field" />
      {hint && <span className="mt-1.5 block text-[11px] text-white/30">{hint}</span>}
    </label>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/[0.07] px-3.5 py-2.5 text-sm text-red-200/90 animate-fade-down">
      {children}
    </p>
  );
}
