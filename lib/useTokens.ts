'use client';

import { useCallback, useEffect, useState } from 'react';

interface Session {
  username: string;
  questionLimit: number;
  questionsUsed: number;
  remaining: number;
  loginAt: string;
}

/**
 * Kapalı beta jeton sistemi hook'u.
 *
 * localStorage'daki session'ı okur, server'dan doğrular.
 * Her soru sorulduğunda server'a bildirir ve limiti günceller.
 */
export function useTokens() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mentoriva_session');
      if (raw) {
        const s = JSON.parse(raw) as Session;
        setSession(s);
      }
    } catch {}
    setReady(true);
  }, []);

  const isLoggedIn = !!session;
  const remaining = session ? Math.max(0, session.questionLimit - session.questionsUsed) : 0;
  const used = session?.questionsUsed ?? 0;
  const limit = session?.questionLimit ?? 0;
  const canAsk = remaining > 0;
  const showLimitReached = isLoggedIn && !canAsk;

  const warningMessage = (() => {
    if (!session) return null;
    const left = session.questionLimit - session.questionsUsed;
    if (left > 2) return null;
    if (left === 2) return 'Bugün 2 perspektif daha alabilirsin';
    if (left === 1) return 'Son perspektifin';
    return null;
  })();

  const consumeToken = useCallback(async (): Promise<boolean> => {
    if (!session) return false;

    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'use_token', username: session.username }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'limit_reached') {
          const updated = { ...session, questionsUsed: session.questionLimit, remaining: 0 };
          setSession(updated);
          localStorage.setItem('mentoriva_session', JSON.stringify(updated));
          return false;
        }
        return false;
      }

      const updated = {
        ...session,
        questionsUsed: data.questionsUsed,
        remaining: data.remaining,
      };
      setSession(updated);
      localStorage.setItem('mentoriva_session', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  }, [session]);

  const logout = useCallback(() => {
    localStorage.removeItem('mentoriva_session');
    setSession(null);
    window.location.href = '/giris';
  }, []);

  const refreshSession = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username: session.username, password: '' }),
      });
      // Sessiz hata — sadece local session kullan
    } catch {}
  }, [session]);

  return {
    session,
    isLoggedIn,
    remaining,
    used,
    limit,
    canAsk,
    showLimitReached,
    warningMessage,
    consumeToken,
    logout,
    ready,
    username: session?.username ?? null,
  };
}
