'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthShell, Field, FormError } from '@/components/shared/AuthShell';
import { CodeInput } from '@/components/ui/CodeInput';
import { useSession } from '@/lib/session';

const MIN_PASSWORD = 8;

export default function SifremiUnuttumPage() {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useSession();

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.includes('@') || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'İstek başarısız'); return; }
      setStep('reset');
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || password.length < MIN_PASSWORD || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Şifre güncellenemedi');
        setCode(''); // yanlış kod silinsin, yeniden yazmak kolay olsun
        return;
      }
      setUser(data.user);
      router.push('/');
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      Şifreni hatırladın mı? <Link href="/giris" className="font-medium text-brand-300 hover:text-brand-200">Giriş yap</Link>
    </>
  );

  if (step === 'reset') {
    return (
      <AuthShell
        title="Yeni şifre belirle"
        subtitle={<>Bu adrese kayıtlı bir hesap varsa <span className="text-white/75">{email}</span> adresine 6 haneli bir kod gönderdik.</>}
        footer={footer}
      >
        <form onSubmit={confirm} className="space-y-5" noValidate>
          <CodeInput value={code} onChange={setCode} disabled={loading} />
          <Field
            label="Yeni şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`En az ${MIN_PASSWORD} karakter`}
            autoComplete="new-password"
          />
          <FormError>{error}</FormError>
          <button type="submit" disabled={loading || code.length !== 6 || password.length < MIN_PASSWORD} className="btn-primary w-full !py-3.5">
            {loading ? 'Kaydediliyor…' : 'Şifremi güncelle'}
          </button>
          <button type="button" onClick={() => void requestCode()} disabled={loading} className="w-full text-center text-xs text-brand-300/80 hover:text-brand-200">
            Kodu tekrar gönder
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Şifreni mi unuttun?" subtitle="E-posta adresini yaz, sana bir sıfırlama kodu gönderelim." footer={footer}>
      <form onSubmit={requestCode} className="space-y-4" noValidate>
        <Field label="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@eposta.com" autoComplete="email" autoFocus />
        <FormError>{error}</FormError>
        <button type="submit" disabled={loading || !email.includes('@')} className="btn-primary w-full !py-3.5">
          {loading ? 'Gönderiliyor…' : 'Sıfırlama kodu gönder'}
        </button>
      </form>
    </AuthShell>
  );
}
