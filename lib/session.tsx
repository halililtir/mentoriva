'use client';

/**
 * İstemci tarafı oturum durumu.
 *
 * Gerçek oturum httpOnly çerezdedir; burada yalnızca /api/v1/auth/me'den
 * gelen görünür bilgiler (ad, kalan hak) tutulur. Kalan hak, mentor
 * uçlarının SSE `quota` olaylarıyla güncellenir — istemci kotayı kendisi
 * hesaplamaz, sunucunun söylediğini gösterir.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { REF_KEY } from '@/lib/flow-keys';

export interface SessionUser {
  username: string;
  name: string;
  dailyLimit: number;
  usedToday: number;
  /** Davetlerden gelen kullanılmamış bonus haklar. */
  bonus: number;
  /** Toplam kullanılabilir hak (günlük kalan + bonus). */
  remaining: number;
}

type Status = 'loading' | 'guest' | 'user';

interface SessionValue {
  status: Status;
  user: SessionUser | null;
  /** Giriş/kayıt yanıtındaki kullanıcıyı oturuma yazar. */
  setUser: (user: SessionUser | null) => void;
  /** SSE `quota` olayı geldiğinde çağrılır. */
  setRemaining: (remaining: number) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const setUser = useCallback((u: SessionUser | null) => {
    setUserState(u);
    setStatus(u ? 'user' : 'guest');
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/auth/me', { cache: 'no-store' });
      const data = (await res.json().catch(() => null)) as { user?: SessionUser | null } | null;
      setUser(res.ok && data?.user ? data.user : null);
    } catch {
      setUser(null);
    }
  }, [setUser]);

  useEffect(() => {
    // Eski sürüm oturumu localStorage'da tutuyordu; artık kullanılmıyor.
    try { localStorage.removeItem('mentoriva_session'); } catch {}
    // Davet linkiyle gelindiyse kodu kayıt olunana kadar sakla
    try {
      const ref = new URLSearchParams(window.location.search).get('ref');
      if (ref && /^[A-Za-z2-9]{8}$/.test(ref)) localStorage.setItem(REF_KEY, ref.toUpperCase());
    } catch {}
    void refresh();
  }, [refresh]);

  const setRemaining = useCallback((remaining: number) => {
    // Kalan hak sunucudan gelir; bonus önce bitmez, günlük hak önce harcanır
    setUserState((u) => {
      if (!u) return u;
      const dailyLeft = Math.max(0, remaining - u.bonus);
      const bonus = Math.min(u.bonus, remaining);
      return { ...u, remaining, bonus, usedToday: Math.max(0, u.dailyLimit - dailyLeft) };
    });
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  }, [setUser]);

  const value = useMemo(
    () => ({ status, user, setUser, setRemaining, refresh, logout }),
    [status, user, setUser, setRemaining, refresh, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession, SessionProvider içinde kullanılmalı');
  return ctx;
}
