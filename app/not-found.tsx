import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-5">
      <div className="text-center space-y-6 max-w-md">
        <Logo />
        <div className="space-y-3">
          <h1 className="font-display text-4xl text-paper">Yol burada değil</h1>
          <p className="text-muted text-pretty">
            Aradığın sayfa bulunamadı. Belki pusula seni başka bir yöne çağırıyor.
          </p>
        </div>
        <Link href="/" className="btn-primary inline-flex">
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
