'use client';

import { useEffect, useState } from 'react';
import { Logo } from '@/components/shared/Logo';
import Link from 'next/link';
import { cn } from '@/lib/cn';

interface HeaderProps {
  onNewQuestion?: () => void;
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
}

export function Header({ onNewQuestion, showBack, onBack, title }: HeaderProps) {
  const [session, setSession] = useState<{ username: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mentoriva_session');
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40',
        'border-b border-white/[0.06]',
        'bg-[#070b14]/85 backdrop-blur-md',
      )}
    >
      <div className="mx-auto max-w-content px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {showBack && (
            <button
              onClick={onBack}
              className="btn-ghost text-sm"
              aria-label="Geri dön"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Geri</span>
            </button>
          )}
          <Link href="/"><Logo /></Link>
          {title && (
            <>
              <span className="text-white/15 hidden sm:inline" aria-hidden>·</span>
              <span className="font-display text-lg text-white/50 hidden sm:inline truncate">
                {title}
              </span>
            </>
          )}
        </div>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/test" className="btn-ghost text-xs sm:text-sm">Testi Çöz</Link>
          <Link href="/hakkimizda" className="hidden sm:inline-flex btn-ghost text-xs sm:text-sm">Hakkımızda</Link>
          <Link href="/geri-bildirim" className="hidden sm:inline-flex btn-ghost text-xs sm:text-sm">Geri Bildirim</Link>
          {onNewQuestion && (
            <button onClick={onNewQuestion} className="btn-ghost text-xs sm:text-sm">
              Yeni soru
            </button>
          )}

          {/* Giriş / Kullanıcı */}
          {session ? (
            <span className="text-[11px] text-white/30 pl-2 border-l border-white/[0.06] ml-1">
              {session.username}
            </span>
          ) : (
            <Link
              href="/giris"
              className="ml-1 px-3.5 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium hover:bg-brand-500/20 transition-colors"
            >
              Giriş Yap
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
