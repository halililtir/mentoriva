'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { BridgeRules } from '@/components/bridge/BridgeRules';
import { useSession } from '@/lib/session';
import { track } from '@/lib/analytics';

/** Davet bağlantısı: kim, hangi konuda davet ediyor; kuralları onaylayıp katıl. */
function Join() {
  const router = useRouter();
  const q = useSearchParams();
  const id = q.get('r') ?? '';
  const token = q.get('t') ?? '';
  const { status } = useSession();
  const [info, setInfo] = useState<{ topic: string; from: string } | null | 'invalid'>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/bridge/join?id=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : 'invalid'))
      .then((d) => setInfo(d))
      .catch(() => setInfo('invalid'));
  }, [id, token]);

  const join = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/v1/bridge/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, token, consent }) });
      const d = (await res.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (!res.ok || !d?.id) return setError(d?.error ?? 'Katılınamadı.');
      track('bridge_join');
      router.replace(`/aramizda/${d.id}`);
    } finally {
      setBusy(false);
    }
  };

  const next = `/aramizda/katil?r=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 pb-16 pt-12">
      <p className="eyebrow">Aramızda</p>
      {info === null && <div className="skeleton mt-6 h-32 rounded-3xl" />}
      {info === 'invalid' && (
        <p className="mt-6 text-white/65">Bu davet bulunamadı ya da süresi dolmuş. Daveti gönderen kişiden yeni bir bağlantı isteyebilirsin.</p>
      )}
      {info && info !== 'invalid' && (
        <>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,4.5vw,2.4rem)] leading-tight">
            {info.from} seninle &ldquo;{info.topic}&rdquo; hakkında konuşmak istiyor.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            Burada ikiniz de söylemek istediğinizi önce kendi özel alanınızda Mentoriva&apos;ya yazarsınız. Mentoriva bunu anlamını koruyarak
            karşı tarafın duyabileceği hâle getirir; yalnızca onaylanan hâl iletilir.
          </p>
          <div className="mt-6 rounded-3xl border border-white/[0.08] p-5">
            <BridgeRules />
          </div>
          {status === 'user' ? (
            <>
              <label className="mt-6 flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-500" />
                <span className="text-[13px] leading-relaxed text-white/60">Kuralları okudum, kendi isteğimle katılıyorum.</span>
              </label>
              {error && <p className="mt-3 text-sm text-red-300/90">{error}</p>}
              <button onClick={() => void join()} disabled={!consent || busy} className="btn-primary mt-5">{busy ? 'Katılınıyor…' : 'Konuşmaya katıl'}</button>
              <p className="mt-3 text-[12px] text-white/35">Katılmak zorunda değilsin; bu sayfayı kapatman yeterli.</p>
            </>
          ) : status === 'guest' ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/kayit?next=${encodeURIComponent(next)}`} className="btn-primary">Ücretsiz üye ol</Link>
              <Link href={`/giris?next=${encodeURIComponent(next)}`} className="btn-secondary">Giriş yap</Link>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}

export default function KatilPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <Suspense fallback={<div className="skeleton mx-auto mt-12 h-32 w-full max-w-xl rounded-3xl" />}>
        <Join />
      </Suspense>
      <Footer />
    </div>
  );
}
