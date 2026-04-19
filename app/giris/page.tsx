'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Giriş başarısız');
        return;
      }

      // Session'ı localStorage'a kaydet
      localStorage.setItem('mentoriva_session', JSON.stringify({
        username: data.user.username,
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
        {/* Logo + başlık */}
        <div className="space-y-4">
          <Logo />
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-medium bg-amber-500/8 border border-amber-500/15 text-amber-400 uppercase tracking-wider">
              Beta erişim
            </span>
            <h1 className="font-display text-2xl">Mentoriva Beta</h1>
            <p className="text-sm text-white/35 leading-relaxed">
              Giriş yap ve mentorlarını seçerek farklı bakış açılarını karşılaştır.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Kullanıcı adı"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40 transition-colors"
            autoFocus
            autoComplete="username"
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

          {error && (
            <p className="text-sm text-red-400/80">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full py-3.5 rounded-xl bg-brand-500 text-[#070b14] text-sm font-medium hover:bg-brand-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş yap'}
          </button>
        </div>

        {/* Alt bilgi */}
        <div className="space-y-3 pt-4">
          <p className="text-[11px] text-white/20 leading-relaxed">
            Henüz erişim kodun yok mu?<br />
            <a href="mailto:info@mentoriva.com.tr" className="text-brand-400/60 hover:text-brand-400 transition-colors">
              info@mentoriva.com.tr
            </a>
            {' '}adresinden bize ulaş.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a href="https://instagram.com/mentoriva_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] text-white/20 hover:text-white/40 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              @mentoriva_
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
