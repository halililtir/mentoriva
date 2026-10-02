'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthShell, Field, FormError } from '@/components/shared/AuthShell';
import { useSession } from '@/lib/session';
import { readNextPath } from '@/lib/next-path';

export default function GirisPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useSession();

  const canSubmit = email.trim().length > 3 && password.length > 0 && !loading;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Giriş başarısız');
        return;
      }
      setUser(data.user);
      router.push(readNextPath());
    } catch {
      setError('Bağlantı hatası. İnternetini kontrol edip tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Tekrar hoş geldin"
      subtitle="Mentorların seni bekliyor. Kaldığın yerden devam et."
      footer={
        <>
          Hesabın yok mu?{' '}
          <Link href="/kayit" className="font-medium text-brand-300 hover:text-brand-200">Ücretsiz kayıt ol</Link>
        </>
      }
    >
      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        <Field
          label="E-posta"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@eposta.com"
          autoComplete="email"
          autoFocus
          required
        />
        <div>
          <Field
            label="Şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <div className="mt-2 text-right">
            <Link href="/sifremi-unuttum" className="text-xs text-white/40 transition-colors hover:text-brand-300">
              Şifremi unuttum
            </Link>
          </div>
        </div>
        <FormError>{error}</FormError>
        <button type="submit" disabled={!canSubmit} className="btn-primary w-full !py-3.5">
          {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
      </form>
    </AuthShell>
  );
}
