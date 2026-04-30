'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';

export default function KayitPage() {
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password: password.trim() }),
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

      // Session kaydet
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adın"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40 transition-colors"
              autoFocus
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
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              placeholder="Şifre (en az 4 karakter)"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40 transition-colors"
            />
            {error && <p className="text-sm text-red-400/80">{error}</p>}
            <button
              onClick={handleRegister}
              disabled={loading || !name.trim() || !email.trim() || !password.trim()}
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
            <Link href="/giris" className="text-brand-400/70 hover:text-brand-400 transition-colors">
              Giriş yap
            </Link>
          </p>
          <p className="text-[10px] text-white/15 leading-relaxed">
            Kayıt olarak{' '}
            <Link href="/kullanim-sartlari" className="underline hover:text-white/30">Kullanım Şartları</Link>
            {' '}ve{' '}
            <Link href="/gizlilik" className="underline hover:text-white/30">Gizlilik Politikası</Link>
            {"'"}nı kabul etmiş olursun.
          </p>
        </div>
      </div>
    </div>
  );
}
