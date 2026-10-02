'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { useSession } from '@/lib/session';
import { track } from '@/lib/analytics';
import { SITE_URL } from '@/lib/site';

interface ReferralInfo {
  code: string;
  rewarded: number;
  maxRewarded: number;
  referrerBonus: number;
  newUserBonus: number;
  bonus: number;
}

export default function DavetPage() {
  const { status } = useSession();
  const router = useRouter();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'guest') router.replace('/giris?next=/davet');
    if (status !== 'user') return;
    fetch('/api/v1/referral')
      .then((r) => (r.ok ? r.json() : null))
      .then(setInfo)
      .catch(() => setInfo(null));
  }, [status, router]);

  // Canlıda gerçek alan adı; yerelde de paylaşılabilir mutlak adres
  const link = info ? `${typeof window !== 'undefined' ? window.location.origin : SITE_URL}/?ref=${info.code}` : '';
  const message = 'Aklındaki soruyu Jung, Nietzsche, Mevlânâ, Marcus Aurelius ve Seneca’ya sorabildiğin bir uygulama buldum. Bu linkle katılırsan ikimize de bonus soru hakkı tanımlanıyor:';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      track('invite_copied');
    } catch {}
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mentoriva', text: message, url: link });
        track('invite_shared');
      } catch {}
    } else {
      void copy();
    }
  };

  const remainingRewards = info ? Math.max(0, info.maxRewarded - info.rewarded) : 0;

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
        <div className="text-center animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-amber-300">
            Davet et, kazan
          </span>
          <h1 className="mt-5 font-display text-[clamp(2rem,5vw,2.8rem)] leading-tight text-balance">
            Arkadaşını getir, <span className="italic text-gradient">ikiniz de kazanın.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/50">
            Linkinle kayıt olan her arkadaşın için sana <strong className="text-white/80">+{info?.referrerBonus ?? 5} soru</strong>, ona da{' '}
            <strong className="text-white/80">+{info?.newUserBonus ?? 2} soru</strong> hediye. Bonus hakların süresi dolmaz; günlük hakların bittiğinde kullanılır.
          </p>
        </div>

        <div className="glass mt-10 rounded-3xl p-6 animate-fade-up sm:p-8" style={{ animationDelay: '120ms' }}>
          <p className="text-xs uppercase tracking-[0.16em] text-white/40">Senin davet linkin</p>
          {info ? (
            <>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input readOnly value={link} className="input-field !py-3 font-mono text-sm" onFocus={(e) => e.target.select()} aria-label="Davet linki" />
                <button onClick={copy} className="btn-secondary flex-shrink-0 !py-3">{copied ? 'Kopyalandı ✓' : 'Kopyala'}</button>
              </div>
              <button onClick={share} className="btn-primary mt-3 w-full">Arkadaşlarınla paylaş</button>

              <dl className="mt-8 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-white/[0.03] p-4">
                  <dt className="text-[11px] text-white/40">Katılan arkadaş</dt>
                  <dd className="mt-1 font-display text-2xl text-white/90">{info.rewarded}</dd>
                </div>
                <div className="rounded-2xl bg-white/[0.03] p-4">
                  <dt className="text-[11px] text-white/40">Bonus hakkın</dt>
                  <dd className="mt-1 font-display text-2xl text-amber-300">{info.bonus}</dd>
                </div>
                <div className="rounded-2xl bg-white/[0.03] p-4">
                  <dt className="text-[11px] text-white/40">Kalan ödüllü davet</dt>
                  <dd className="mt-1 font-display text-2xl text-white/90">{remainingRewards}</dd>
                </div>
              </dl>
            </>
          ) : (
            <div className="mt-3 h-12 skeleton" />
          )}
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-white/35">
          Ödül, arkadaşın e-postasını doğrulayıp hesabını oluşturduğunda verilir. Kendi hesabını davet edemezsin; ödüllü davet sayısı
          kişi başı {info?.maxRewarded ?? 10} ile sınırlıdır. <Link href="/kullanim-sartlari" className="text-brand-300/80 hover:text-brand-200">Kullanım Şartları</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
