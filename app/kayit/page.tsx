'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';

export default function KayitPage() {
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim() || !accepted) return;
    if (password.trim().length < 6) { setError('Şifre en az 6 karakter olmalı'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username.trim(), email: email.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Kayıt başarısız'); return; }
      setStep('verify');
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Doğrulama başarısız'); return; }

      localStorage.setItem('mentoriva_session', JSON.stringify({
        username: data.user.username,
        name: data.user.name,
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

  const formValid = username.trim().length >= 3 && email.trim().includes('@') && password.trim().length >= 6 && accepted;

  return (
    <div className="min-h-dvh flex items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-4">
          <Logo />
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-medium bg-brand-500/8 border border-brand-500/15 text-brand-400 uppercase tracking-wider">
              Ücretsiz kayıt
            </span>
            <h1 className="font-display text-2xl">
              {step === 'form' ? 'Mentoriva\'ya Katıl' : 'E-postanı Doğrula'}
            </h1>
            <p className="text-sm text-white/35 leading-relaxed">
              {step === 'form'
                ? 'Hesap oluştur ve günlük 5 soru hakkıyla mentorlarla konuşmaya başla.'
                : `${email} adresine 6 haneli bir doğrulama kodu gönderdik.`
              }
            </p>
          </div>
        </div>

        {step === 'form' ? (
          <div className="space-y-3">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adı (en az 3 karakter)"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40 transition-colors"
              autoFocus
              minLength={3}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresin"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40 transition-colors"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && formValid && handleRegister()}
              placeholder="Şifre (en az 6 karakter)"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40 transition-colors"
              minLength={6}
            />

            {/* Onay checkbox */}
            <label className="flex items-start gap-3 text-left cursor-pointer py-2">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-brand-500 flex-shrink-0"
              />
              <span className="text-[11px] text-white/30 leading-relaxed">
                <Link href="/kullanim-sartlari" target="_blank" className="text-brand-400/70 hover:text-brand-400 underline">Kullanım Şartları</Link>
                {"'"}nı ve{' '}
                <Link href="/gizlilik" target="_blank" className="text-brand-400/70 hover:text-brand-400 underline">Gizlilik Politikası</Link>
                {"'"}nı okudum ve kabul ediyorum.
              </span>
            </label>

            {error && <p className="text-sm text-red-400/80">{error}</p>}
            <button
              onClick={handleRegister}
              disabled={loading || !formValid}
              className="w-full py-3.5 rounded-xl bg-brand-500 text-[#070b14] text-sm font-medium hover:bg-brand-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? 'Gönderiliyor...' : 'Doğrulama kodu gönder'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="6 haneli kod"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-lg text-white/90 text-center tracking-[0.3em] placeholder:text-white/20 placeholder:tracking-normal focus:outline-none focus:border-brand-500/40 transition-colors"
              autoFocus
              maxLength={6}
              inputMode="numeric"
            />
            {error && <p className="text-sm text-red-400/80">{error}</p>}
            <button
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className="w-full py-3.5 rounded-xl bg-brand-500 text-[#070b14] text-sm font-medium hover:bg-brand-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? 'Doğrulanıyor...' : 'Hesabı oluştur'}
            </button>
            <button
              onClick={() => { setStep('form'); setCode(''); setError(''); }}
              className="text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              Geri dön
            </button>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <p className="text-[12px] text-white/25">
            Zaten hesabın var mı?{' '}
            <Link href="/giris" className="text-brand-400/70 hover:text-brand-400 transition-colors font-medium">
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
