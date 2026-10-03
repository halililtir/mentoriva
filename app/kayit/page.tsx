'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthShell, Field, FormError } from '@/components/shared/AuthShell';
import { CodeInput } from '@/components/ui/CodeInput';
import { useSession } from '@/lib/session';
import { readNextPath } from '@/lib/next-path';
import { REF_KEY } from '@/lib/flow-keys';
import { track } from '@/lib/analytics';
import { MIN_AGE } from '@/lib/legal';
import { DEFAULT_DAILY_LIMIT } from '@/lib/auth/limits';

const MIN_PASSWORD = 8;
/** "Kodu tekrar gönder" için bekleme (sunucu da e-posta başına sınırlar). */
const RESEND_COOLDOWN = 60;

function readRef(): string | null {
  try { return localStorage.getItem(REF_KEY); } catch { return null; }
}

export default function KayitPage() {
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [transfer, setTransfer] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  const { setUser } = useSession();

  const formValid = name.trim().length >= 2 && email.trim().includes('@') && password.length >= MIN_PASSWORD && accepted && transfer;

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formValid || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, ref: readRef(), adult: accepted, terms: accepted, transfer }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Kayıt başarısız'); return; }
      setNotice(step === 'verify' ? 'Yeni bir kod gönderildi. Önceki kod artık geçersiz.' : '');
      setCode('');
      setCooldown(RESEND_COOLDOWN);
      setStep('verify');
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (value = code) => {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Doğrulama başarısız');
        setCode(''); // yanlış kod silinsin, yeniden yazmak kolay olsun
        return;
      }
      setUser(data.user);
      track('signup_completed', { referred: !!data.referred });
      try { localStorage.removeItem(REF_KEY); } catch {}
      router.push(readNextPath());
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <AuthShell
        eyebrow="Son adım"
        title="E-postanı doğrula"
        subtitle={<><span className="text-white/75">{email}</span> adresine 6 haneli bir kod gönderdik. Gelen kutunu (ve spam klasörünü) kontrol et.</>}
      >
        <div className="space-y-5">
          <CodeInput value={code} onChange={setCode} onComplete={(v) => void handleVerify(v)} disabled={loading} />
          <FormError>{error}</FormError>
          {notice && !error && <p className="text-center text-[13px] text-emerald-400" role="status">{notice}</p>}
          <button onClick={() => void handleVerify()} disabled={loading || code.length !== 6} className="btn-primary w-full !py-3.5">
            {loading ? 'Doğrulanıyor…' : 'Hesabımı oluştur'}
          </button>
          <div className="flex items-center justify-between text-xs">
            <button onClick={() => { setStep('form'); setError(''); }} className="text-white/40 transition-colors hover:text-white/70">
              ← Bilgileri düzenle
            </button>
            <button onClick={() => void handleRegister()} disabled={loading || cooldown > 0} className="text-brand-300/80 transition-colors hover:text-brand-200 disabled:text-white/40">
              {cooldown > 0 ? `Tekrar gönder (${cooldown})` : 'Kodu tekrar gönder'}
            </button>
          </div>
          <details className="rounded-xl border border-white/[0.08] px-4 py-3 text-[13px] text-white/65">
            <summary className="cursor-pointer text-white/75">Kod gelmedi mi?</summary>
            <ul className="mt-2 list-disc space-y-1 pl-4 leading-relaxed">
              <li>Bir iki dakika bekle; bazen gecikebiliyor.</li>
              <li><b>Spam / Gereksiz</b> ve Gmail’de <b>Promosyonlar</b> klasörüne bak. Gönderen: <b>Mentoriva</b>.</li>
              <li>E-posta adresini doğru yazdığından emin ol: <span className="text-white/85">{email}</span></li>
              <li>Hâlâ gelmediyse <Link href="/geri-bildirim" className="text-brand-300 hover:underline">bize yaz</Link>; hesabını elle açalım.</li>
            </ul>
          </details>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Ücretsiz"
      title="Mentoriva’ya katıl"
      subtitle={`Hesabını oluştur, her gün ${DEFAULT_DAILY_LIMIT} soru hakkıyla mentorlarınla konuşmaya başla.`}
      footer={
        <>
          Zaten hesabın var mı?{' '}
          <Link href="/giris" className="font-medium text-brand-300 hover:text-brand-200">Giriş yap</Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="space-y-4" noValidate>
        <Field label="Adın" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sana nasıl hitap edelim?" autoComplete="given-name" maxLength={40} autoFocus />
        <Field label="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@eposta.com" autoComplete="email" />
        <div>
          <Field
            label="Şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`En az ${MIN_PASSWORD} karakter`}
            autoComplete="new-password"
          />
          <PasswordMeter value={password} />
        </div>

        <div className="space-y-2.5">
        <label className="flex cursor-pointer items-start gap-3 text-left">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-white/20 bg-white/[0.04] accent-brand-500"
          />
          <span className="text-xs leading-relaxed text-white/55">
            {MIN_AGE} yaşından büyüğüm.{' '}
            <Link href="/kullanim-sartlari" target="_blank" className="text-brand-300/80 underline-offset-2 hover:underline">Kullanım Şartları</Link>
            {'’'}nı kabul ediyorum,{' '}
            <Link href="/gizlilik" target="_blank" className="text-brand-300/80 underline-offset-2 hover:underline">Gizlilik ve Aydınlatma Metni</Link>
            {'’'}ni okudum.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-left">
          <input
            type="checkbox"
            checked={transfer}
            onChange={(e) => setTransfer(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-white/20 bg-white/[0.04] accent-brand-500"
          />
          <span className="text-xs leading-relaxed text-white/55">
            Yazdıklarımın, cevap üretilebilmesi için yurt dışındaki hizmet sağlayıcılara aktarılmasına{' '}
            <b className="font-medium text-white/75">açık rıza</b> veriyorum.{' '}
            <Link href="/gizlilik#yurt-disi" target="_blank" className="text-brand-300/80 underline-offset-2 hover:underline">Ayrıntılar</Link>
          </span>
        </label>
        </div>

        <FormError>{error}</FormError>
        <button type="submit" disabled={loading || !formValid} className="btn-primary w-full !py-3.5">
          {loading ? 'Gönderiliyor…' : 'Doğrulama kodu gönder'}
        </button>
      </form>
    </AuthShell>
  );
}

function PasswordMeter({ value }: { value: string }) {
  if (!value) return null;
  const score = [value.length >= MIN_PASSWORD, /[A-ZÇĞİÖŞÜ]/.test(value) && /[a-zçğıöşü]/.test(value), /\d/.test(value), /[^\w\s]/.test(value) || value.length >= 14]
    .filter(Boolean).length;
  const labels = ['Çok zayıf', 'Zayıf', 'İdare eder', 'İyi', 'Güçlü'];
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#00bcd4'];
  return (
    <div className="mt-2 flex items-center gap-2" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-500"
            style={{ background: i < score ? colors[score] : 'rgb(var(--fg) / 0.1)' }}
          />
        ))}
      </div>
      <span className="w-20 text-right text-[11px]" style={{ color: colors[score] }}>{labels[score]}</span>
    </div>
  );
}
