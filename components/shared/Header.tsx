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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mentoriva_session');
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);

  // Menü dışına tıklayınca kapat
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40',
        'border-b border-white/[0.06]',
        'bg-[#070b14]/85 backdrop-blur-md',
      )}
    >
      <div className="mx-auto max-w-content px-5 py-3 flex items-center justify-between gap-3">
        {/* Sol: Geri + Logo */}
        <div className="flex items-center gap-3 min-w-0">
          {showBack && (
            <button
              onClick={onBack}
              className="btn-ghost text-sm"
              aria-label="Geri dön"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline">Geri</span>
            </button>
          )}
          <Link href="/"><Logo /></Link>
          {title && (
            <span className="font-display text-lg text-white/50 hidden sm:inline truncate">
              {title}
            </span>
          )}
        </div>

        {/* Sağ: Desktop nav + Mobil hamburger */}
        <div className="flex items-center gap-2">
          {/* Desktop navigasyon */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link href="/test" className="btn-ghost text-xs">Testi Çöz</Link>
            <Link href="/hakkimizda" className="btn-ghost text-xs">Hakkımızda</Link>
            <Link href="/geri-bildirim" className="btn-ghost text-xs">Geri Bildirim</Link>
            {onNewQuestion && (
              <button onClick={onNewQuestion} className="btn-ghost text-xs">Yeni soru</button>
            )}
          </nav>

          {/* Giriş / Kullanıcı */}
          {session ? (
            <span className="text-[11px] text-white/30 pl-2 border-l border-white/[0.06]">
              {session.username.length > 15 ? session.username.slice(0, 15) + '...' : session.username}
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link href="/giris" className="px-2.5 py-1.5 rounded-lg text-white/40 text-xs hover:text-white/70 transition-colors hidden sm:inline-flex">
                Giriş
              </Link>
              <Link href="/kayit" className="px-3 py-1.5 rounded-lg bg-brand-500 text-[#070b14] text-xs font-medium hover:bg-brand-400 transition-colors">
                Kayıt Ol
              </Link>
            </div>
          )}

          {/* Mobil hamburger */}
          <div className="relative sm:hidden">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
              aria-label="Menü"
            >
              {menuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              )}
            </button>

            {/* Dropdown menü */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/[0.08] bg-[#0c1120]/95 backdrop-blur-xl shadow-xl py-2 animate-fade-up">
                <Link href="/test" className="block px-4 py-2.5 text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors">
                  Testi Çöz
                </Link>
                <Link href="/hakkimizda" className="block px-4 py-2.5 text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors">
                  Hakkımızda
                </Link>
                <Link href="/geri-bildirim" className="block px-4 py-2.5 text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors">
                  Geri Bildirim
                </Link>
                <Link href="/gizlilik" className="block px-4 py-2.5 text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors">
                  Gizlilik Politikası
                </Link>
                <Link href="/kullanim-sartlari" className="block px-4 py-2.5 text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors">
                  Kullanım Şartları
                </Link>
                {onNewQuestion && (
                  <>
                    <div className="border-t border-white/[0.06] my-1"></div>
                    <button onClick={() => { onNewQuestion(); setMenuOpen(false); }} className="block w-full text-left px-4 py-2.5 text-sm text-brand-400 hover:bg-white/[0.04] transition-colors">
                      Yeni soru sor
                    </button>
                  </>
                )}
                {!session && (
                  <>
                    <div className="border-t border-white/[0.06] my-1"></div>
                    <Link href="/giris" className="block px-4 py-2.5 text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors">
                      Giriş Yap
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
