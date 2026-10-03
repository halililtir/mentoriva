/**
 * Renk temaları. Değerler app/globals.css içinde html[data-theme] altında.
 *
 * Varsayılan: cihazın ayarı (prefers-color-scheme) — koyu moddaki cihaz Gece,
 * açık moddaki Gündüz görür. Kullanıcı düğmeyle seçerse seçimi localStorage'da
 * tutulur ve cihaz ayarının önüne geçer. THEME_INIT sayfa boyanmadan önce
 * çalışarak yanlış temanın bir an görünmesini (flaş) engeller.
 */

export const THEMES = [
  { id: 'gece', label: 'Gece', hint: 'Koyu lacivert' },
  { id: 'gunduz', label: 'Gündüz', hint: 'Beyaz ve açık mavi' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

/** Sunucuda basılan (JS çalışmazsa kalan) tema. */
export const DEFAULT_THEME: ThemeId = 'gunduz';
export const THEME_KEY = 'mentoriva_theme';
export const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Tarayıcı çubuğu rengi (meta theme-color). */
export const THEME_COLORS: Record<ThemeId, string> = {
  gece: '#070b14',
  gunduz: '#f4f8fb',
};

export function isThemeId(v: unknown): v is ThemeId {
  return THEMES.some((t) => t.id === v);
}

/** Kullanıcının kendi seçimi; yoksa null (cihaz ayarı geçerli). */
export function storedTheme(): ThemeId | null {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return isThemeId(t) ? t : null;
  } catch {
    return null;
  }
}

export function systemTheme(): ThemeId {
  return window.matchMedia?.(DARK_QUERY).matches ? 'gece' : 'gunduz';
}

/** Temayı uygular; `remember` ise kullanıcı seçimi olarak saklar. */
export function applyTheme(id: ThemeId, remember = true): void {
  document.documentElement.dataset['theme'] = id;
  if (remember) {
    try { localStorage.setItem(THEME_KEY, id); } catch {}
  }
}

/** <head> içinde satır içi çalışan başlangıç betiği: kayıtlı seçim > cihaz ayarı. */
export const THEME_INIT = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(${JSON.stringify(THEMES.map((t) => t.id))}.indexOf(t)<0){t=window.matchMedia&&window.matchMedia('${DARK_QUERY}').matches?'gece':'gunduz';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;
