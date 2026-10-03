'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_THEME, THEMES, applyTheme, isThemeId, type ThemeId } from '@/lib/theme';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';

const ICONS: Record<ThemeId, React.ReactNode> = {
  gece: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  aksam: (
    <>
      <path d="M17 18a5 5 0 0 0-10 0" />
      <path d="M12 9V2M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1" />
    </>
  ),
  gunduz: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </>
  ),
};

function Icon({ id }: { id: ThemeId }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[id]}
    </svg>
  );
}

/** Başlıktaki tema seçici: Gece / Akşam / Gündüz. */
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = document.documentElement.dataset['theme'];
    if (isThemeId(current)) setTheme(current);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  const choose = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
    setOpen(false);
    track('theme_change', { theme: id });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
        aria-label="Renk teması"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon id={theme} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-56 glass rounded-2xl p-2 animate-fade-down">
          <p className="px-3 pb-1.5 pt-1 text-[11px] uppercase tracking-wider text-white/40">Görünüm</p>
          {THEMES.map((t) => (
            <button
              key={t.id}
              role="menuitemradio"
              aria-checked={theme === t.id}
              onClick={() => choose(t.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                theme === t.id ? 'bg-brand-500/10 text-white' : 'text-white/65 hover:bg-white/[0.05] hover:text-white',
              )}
            >
              <span className={theme === t.id ? 'text-brand-400' : ''}><Icon id={t.id} /></span>
              <span className="min-w-0">
                <span className="block text-sm">{t.label}</span>
                <span className="block text-[11px] text-white/40">{t.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
