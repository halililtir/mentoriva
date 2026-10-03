/**
 * Misafir denemesinin tarayıcı tarafı: bugün kullanıldı mı, onay verildi mi.
 * Yalnızca arayüzü yönlendirmek için; asıl sınır sunucuda (lib/auth/guest.ts).
 */

import { GUEST_CONSENT_KEY, GUEST_TRIAL_KEY } from '@/lib/flow-keys';
import { todayKey } from '@/lib/time';

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
}

export const guestTrialUsedToday = (): boolean => read(GUEST_TRIAL_KEY) === todayKey();
export const markGuestTrialUsed = (): void => write(GUEST_TRIAL_KEY, todayKey());
export const hasGuestConsent = (): boolean => read(GUEST_CONSENT_KEY) === '1';
export const setGuestConsent = (ok: boolean): void => write(GUEST_CONSENT_KEY, ok ? '1' : null);
