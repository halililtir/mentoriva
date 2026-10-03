/**
 * Renk temaları. Değerler app/globals.css içinde html[data-theme] altında.
 * Seçim localStorage'da tutulur; THEME_INIT sayfa boyanmadan önce
 * çalışarak yanlış temanın bir an görünmesini (flaş) engeller.
 */

export const THEMES = [
  { id: 'gece', label: 'Gece', hint: 'Lacivert, parlak' },
  { id: 'aksam', label: 'Akşam', hint: 'Yumuşak koyu, göz yormaz' },
  { id: 'gunduz', label: 'Gündüz', hint: 'Açık, krem zemin' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export const DEFAULT_THEME: ThemeId = 'gece';
export const THEME_KEY = 'mentoriva_theme';

/** Tarayıcı çubuğu rengi (meta theme-color). */
export const THEME_COLORS: Record<ThemeId, string> = {
  gece: '#070b14',
  aksam: '#101114',
  gunduz: '#f6f3ee',
};

export function isThemeId(v: unknown): v is ThemeId {
  return THEMES.some((t) => t.id === v);
}

export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset['theme'] = id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[id]);
  try { localStorage.setItem(THEME_KEY, id); } catch {}
}

/** <head> içinde satır içi çalışan başlangıç betiği. */
export const THEME_INIT = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(${JSON.stringify(THEMES.map((t) => t.id))}.indexOf(t)>-1){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
