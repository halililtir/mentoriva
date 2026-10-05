/** "Söyleyeceğimi hazırla" — istemci ve sunucunun ortak sabitleri ve tipleri. */

export const PREPARE_STYLES = {
  sakin: { label: 'Daha sakin', hint: 'Öfken değil, söylemek istediğin duyulsun.' },
  net: { label: 'Kısa ve net', hint: 'Bir iki cümle; dolambaç yok.' },
  sinir: { label: 'Sınırımı koruyan', hint: 'Neyi kabul edip neyi etmediğin açık olsun.' },
} as const;

export type PrepareStyle = keyof typeof PREPARE_STYLES;
export const PREPARE_STYLE_IDS = Object.keys(PREPARE_STYLES) as PrepareStyle[];

export const PREPARE_LIMITS = { to: 60, text: 1500, matters: 300 } as const;

export interface PrepareResult {
  versions: Array<{ style: PrepareStyle; text: string }>;
  /** Neyin korunduğu (anlam, istek, itiraz) — tek cümle. */
  kept: string;
  safety: boolean;
}

/** "İçimde ne var?" kartından hazırla sayfasına taslak (sessionStorage). */
export const PREPARE_DRAFT_KEY = 'mentoriva_prepare_draft';
