'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/cn';

interface HeaderProps {
  onNewQuestion?: () => void;
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
}

const NAV = [
  { href: '/yolculuk', label: 'Kendine Yolculuk' },
  { href: '/#nasil-calisir', label: 'Nasıl çalışır?' },
  { href: '/test', label: 'Kişilik Testi' },
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/geri-bildirim', label: 'Geri Bildirim' },
];

export function Header({ onNewQuestion, showBack, onBack, title }: HeaderProps) {
  const { status, user, logout } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Menü dışına tıklayınca / Escape ile kapat
  useEffect(() => {
    if (!menuOpen && !userMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
        setUserMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, userMenuOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setMenuOpen(false);
    await logout();
    router.push('/');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-500 ease-out-expo',
        scrolled
          ? 'border-b border-white/[0.06] bg-ink-0/75 backdrop-blur-xl shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)]'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div
        ref={menuRef}
        className={cn(
          'mx-auto max-w-content px-5 flex items-center justify-between gap-3 transition-all duration-500',
          scrolled ? 'py-2.5' : 'py-4',
        )}
      >
        {/* Sol: Geri + Logo */}
        <div className="flex items-center gap-3 min-w-0">
          {showBack && (
            <button
              onClick={onBack}
              className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition-all hover:border-white/20 hover:text-white"
              aria-label="Geri dön"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <Link href="/" aria-label="Mentoriva ana sayfa">
            <Logo size={30} />
          </Link>
          {title && (
            <span className="hidden sm:inline truncate border-l border-white/10 pl-3 font-display text-lg text-white/60 animate-fade-in">
              {title}
            </span>
          )}
        </div>

        {/* Sağ */}
        <div className="flex items-center gap-1.5">
          <nav className="hidden md:flex items-center gap-1" aria-label="Ana menü">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative rounded-lg px-3 py-2 text-[13px] transition-colors',
                    active ? 'text-white' : 'text-white/50 hover:text-white',
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      'absolute inset-x-3 -bottom-0.5 h-px origin-left bg-brand-400 transition-transform duration-300',
                      active ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                </Link>
              );
            })}
            {onNewQuestion && (
              <button onClick={onNewQuestion} className="rounded-lg px-3 py-2 text-[13px] text-brand-300 hover:text-brand-200 transition-colors">
                Yeni soru
              </button>
            )}
          </nav>

          {/* Kullanıcı */}
          {status === 'loading' ? (
            <span className="ml-2 h-9 w-24 rounded-full skeleton" aria-hidden="true" />
          ) : user ? (
            <div className="relative ml-2">
              <button
                onClick={(e) => { e.stopPropagation(); setUserMenuOpen((v) => !v); setMenuOpen(false); }}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-3 transition-colors hover:border-white/20"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <QuotaRing remaining={user.remaining} limit={user.dailyLimit} />
                <span className="hidden sm:inline max-w-[120px] truncate text-xs text-white/70">{user.name}</span>
              </button>
              {userMenuOpen && (
                <div role="menu" className="absolute right-0 top-full mt-2 w-60 glass rounded-2xl p-2 animate-fade-down">
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm text-white/85">{user.name}</p>
                    <p className="truncate text-xs text-white/35">{user.username}</p>
                  </div>
                  <div className="mx-3 my-1 rounded-xl bg-white/[0.03] px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-wider text-white/35">Bugünkü hakkın</p>
                    <p className="mt-1 text-sm text-white/80">
                      <span className="font-semibold text-brand-300">{user.remaining - user.bonus}</span> / {user.dailyLimit} soru
                      {user.bonus > 0 && <span className="ml-1.5 text-amber-300/90">+{user.bonus} bonus</span>}
                    </p>
                  </div>
                  <Link
                    href="/davet"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="mt-1 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-amber-200/90 transition-colors hover:bg-white/[0.05]"
                  >
                    Arkadaşını davet et
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">+5 soru</span>
                  </Link>
                  <button role="menuitem" onClick={handleLogout} className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white">
                    Çıkış yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="ml-2 flex items-center gap-1.5">
              <Link href="/giris" className="hidden sm:inline-flex rounded-lg px-3 py-2 text-[13px] text-white/60 hover:text-white transition-colors">
                Giriş
              </Link>
              <Link href="/kayit" className="btn-primary !rounded-full !px-4 !py-2 text-[13px]">
                Ücretsiz başla
              </Link>
            </div>
          )}

          {/* Mobil menü */}
          <div className="relative md:hidden">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); setUserMenuOpen(false); }}
              className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Menü"
              aria-expanded={menuOpen}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d={menuOpen ? 'M18 6L6 18M6 6l12 12' : 'M4 7h16M4 12h16M4 17h10'} className="transition-all" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 glass rounded-2xl p-2 animate-fade-down">
                {[...NAV, { href: '/gizlilik', label: 'Gizlilik' }, { href: '/kullanim-sartlari', label: 'Kullanım Şartları' }].map((item) => (
                  <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white">
                    {item.label}
                  </Link>
                ))}
                {onNewQuestion && (
                  <button
                    onClick={() => { onNewQuestion(); setMenuOpen(false); }}
                    className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-brand-300 hover:bg-white/[0.05]"
                  >
                    Yeni soru sor
                  </button>
                )}
                {status === 'guest' && (
                  <Link href="/giris" className="mt-1 block rounded-xl border-t border-white/[0.06] px-3 py-2.5 text-sm text-white/60 hover:bg-white/[0.05] hover:text-white">
                    Giriş yap
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/** Kalan günlük hakkı gösteren küçük halka. */
function QuotaRing({ remaining, limit }: { remaining: number; limit: number }) {
  const r = 13;
  const c = 2 * Math.PI * r;
  const ratio = limit > 0 ? Math.min(1, remaining / limit) : 0;
  const color = remaining === 0 ? '#f59e0b' : '#00bcd4';
  return (
    <span className="relative inline-flex h-8 w-8 items-center justify-center" title={`Bugün ${remaining}/${limit} soru hakkın kaldı`}>
      <svg width="32" height="32" viewBox="0 0 32 32" className="-rotate-90" aria-hidden="true">
        <circle cx="16" cy="16" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
        <circle
          cx="16"
          cy="16"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          className="transition-[stroke-dashoffset] duration-700 ease-out-expo"
        />
      </svg>
      <span className="absolute text-[11px] font-semibold" style={{ color }}>{remaining}</span>
      <span className="sr-only">Bugün {remaining} soru hakkın kaldı</span>
    </span>
  );
}
