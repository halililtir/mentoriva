'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';

export default function GirisPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username: email.trim().toLowerCase(), password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Giriş başarısız'); return; }

      localStorage.setItem('mentoriva_session', JSON.stringify({
        username: data.user.username,
        name: data.user.name || data.user.username,
        questionLimit: data.user.questionLimit,
        questionsUsed: data.user.questionsUsed,
        remaining: data.user.remaining,
        loginAt: new Date().toISOString(),
      }));

      router.push('/');
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-4">
          <Logo />
          <div className="space-y-2">
            <h1 className="font-display text-2xl">Giriş Yap</h1>
            <p className="text-sm text-white/35 leading-relaxed">
              Hesabınla giriş yap ve mentorlarla konuşmaya devam et.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="E-posta adresin"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40 transition-colors"
            autoFocus
            autoComplete="email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Şifre"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40 transition-colors"
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-red-400/80">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full py-3.5 rounded-xl bg-brand-500 text-[#070b14] text-sm font-medium hover:bg-brand-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş yap'}
          </button>
        </div>

        <div className="space-y-3 pt-2">
          <p className="text-[12px] text-white/25">
            Hesabın yok mu?{' '}
            <Link href="/kayit" className="text-brand-400/70 hover:text-brand-400 transition-colors font-medium">
              Ücretsiz kayıt ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
