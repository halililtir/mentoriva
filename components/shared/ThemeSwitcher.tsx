'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_THEME, applyTheme, isThemeId, type ThemeId } from '@/lib/theme';
import { track } from '@/lib/analytics';

/** Başlıktaki Gece / Gündüz düğmesi. Simge, geçilecek temayı gösterir. */
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);

  useEffect(() => {
    const current = document.documentElement.dataset['theme'];
    if (isThemeId(current)) setTheme(current);
  }, []);

  const next: ThemeId = theme === 'gece' ? 'gunduz' : 'gece';
  const label = next === 'gunduz' ? 'Gündüz moduna geç' : 'Gece moduna geç';

  const toggle = () => {
    setTheme(next);
    applyTheme(next);
    track('theme_change', { theme: next });
  };

  return (
    <button
      onClick={toggle}
      className="group inline-flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
      aria-label={label}
      title={label}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="transition-transform duration-500 ease-spring group-hover:rotate-[20deg]"
      >
        {next === 'gunduz' ? (
          <>
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 1.5v2M12 20.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M1.5 12h2M20.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
          </>
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </svg>
    </button>
  );
}
