import Link from 'next/link';
import { LogoMark } from '@/components/shared/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="max-w-md text-center">
        <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-brand-500/20 blur-2xl animate-breathe" />
          <span className="absolute inset-0 rounded-full border border-dashed border-white/10 animate-spin-slow" />
          <span className="animate-float"><LogoMark size={72} animated /></span>
        </div>
        <p className="mt-8 font-display text-6xl text-white/10">404</p>
        <h1 className="mt-2 font-display text-4xl text-paper animate-fade-up">Yol burada değil</h1>
        <p className="mt-3 text-muted text-pretty animate-fade-up" style={{ animationDelay: '120ms' }}>
          Aradığın sayfa bulunamadı. Belki pusula seni başka bir yöne çağırıyor.
        </p>
        <Link href="/" className="btn-primary mt-8 inline-flex animate-fade-up" style={{ animationDelay: '220ms' }}>
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
