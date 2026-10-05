'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { CrisisNotice } from '@/components/mentors/CrisisNotice';
import { useSession } from '@/lib/session';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { PREPARE_DRAFT_KEY, PREPARE_LIMITS, PREPARE_STYLES, PREPARE_STYLE_IDS, type PrepareResult, type PrepareStyle } from '@/lib/prepare-public';

/**
 * "Söyleyeceğimi hazırla" — yazdığın saklanmaz. Sonuç bir öneridir; anlamı ve
 * itirazı korur, uzlaşmayı ya da özrü varsaymaz. Son söz senin.
 */
export default function HazirlaPage() {
  const { status, user, setRemaining } = useSession();
  const [to, setTo] = useState('');
  const [text, setText] = useState('');
  const [matters, setMatters] = useState('');
  const [styles, setStyles] = useState<PrepareStyle[]>(['sakin', 'net']);
  const [result, setResult] = useState<PrepareResult | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [crisis, setCrisis] = useState('');
  const [safety, setSafety] = useState(false);

  // "İçimde ne var?" kartından gelindiyse önemli olanı doldur
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PREPARE_DRAFT_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PREPARE_DRAFT_KEY);
      const d = JSON.parse(raw) as { matters?: string };
      if (d.matters) setMatters(d.matters.slice(0, PREPARE_LIMITS.matters));
    } catch {}
  }, []);

  const toggleStyle = (s: PrepareStyle) => setStyles((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const submit = async () => {
    if (status !== 'user') return;
    setLoading(true);
    setError('');
    setSafety(false);
    setResult(null);
    try {
      const res = await fetch('/api/v1/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, text, matters, styles }),
      });
      const data = (await res.json().catch(() => null)) as (PrepareResult & { remaining?: number; crisis?: string; error?: { code?: string; message?: string } }) | null;
      if (typeof data?.remaining === 'number') setRemaining(data.remaining);
      if (data?.crisis) return setCrisis(data.crisis);
      if (!res.ok) {
        if (data?.error?.code === 'QUOTA_EXCEEDED') setRemaining(0);
        return setError(data?.error?.message ?? 'Şu an hazırlanamadı. Biraz sonra tekrar dene.');
      }
      if (data?.safety) return setSafety(true);
      if (data?.versions?.length) {
        setResult(data);
        setEdits({});
        track('prepare_done', { styles: data.versions.length });
      }
    } catch {
      setError('Bağlantı kurulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const copy = async (style: string, value: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(style); setTimeout(() => setCopied(null), 1800); } catch {}
  };

  const canSubmit = text.trim().length >= 10 && styles.length > 0 && !loading;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-14 pt-10">
        {crisis ? (
          <CrisisNotice message={crisis} onBack={() => setCrisis('')} />
        ) : (
          <>
            <p className="eyebrow">Söyleyeceğimi hazırla</p>
            <h1 className="mt-3 font-display text-[clamp(1.9rem,4.5vw,2.6rem)] leading-tight text-balance">
              Söylemek istediğin <span className="italic text-gradient">kaybolmadan</span>, duyulabilecek hâliyle.
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-white/60">
              Birine söylemek istediğini olduğu gibi yaz. Anlamını ve itirazını koruyarak yeniden ifade edelim. Barışmayı, özür dilemeyi ya da
              susmayı varsaymıyoruz; ne söyleyeceğine sen karar verirsin.
            </p>

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm text-white/70">Kime? <span className="text-white/35">(isteğe bağlı: annem, iş arkadaşım…)</span></span>
                <input value={to} onChange={(e) => setTo(e.target.value.slice(0, PREPARE_LIMITS.to))} className="input-field mt-2 w-full text-base" />
              </label>
              <label className="block">
                <span className="text-sm text-white/70">Ne söylemek istiyorsun?</span>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, PREPARE_LIMITS.text))}
                  rows={5}
                  placeholder="Aklından geçtiği gibi yaz; sert ya da dağınık olabilir."
                  className="input-field mt-2 min-h-[140px] w-full resize-y text-base"
                />
                <span className="mt-1 block text-right text-[11px] text-white/30">{text.length}/{PREPARE_LIMITS.text}</span>
              </label>
              <label className="block">
                <span className="text-sm text-white/70">Bu konuşmada senin için önemli olan <span className="text-white/35">(isteğe bağlı)</span></span>
                <input value={matters} onChange={(e) => setMatters(e.target.value.slice(0, PREPARE_LIMITS.matters))} placeholder="Örneğin: anlaşılmak, kendi alanım" className="input-field mt-2 w-full text-base" />
              </label>
              <div>
                <span className="text-sm text-white/70">Nasıl bir hâli olsun?</span>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {PREPARE_STYLE_IDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleStyle(s)}
                      aria-pressed={styles.includes(s)}
                      className={cn('rounded-2xl border px-3.5 py-3 text-left transition', styles.includes(s) ? 'border-brand-400/50 bg-brand-500/[0.09]' : 'border-white/[0.08] hover:border-white/20')}
                    >
                      <span className="block text-[14.5px] text-white/90">{PREPARE_STYLES[s].label}</span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-white/45">{PREPARE_STYLES[s].hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {status === 'user' ? (
                <>
                  <button onClick={() => void submit()} disabled={!canSubmit || (user?.remaining ?? 0) <= 0} className="btn-primary">
                    {loading ? 'Hazırlanıyor…' : 'Hazırla'}
                  </button>
                  <span className="text-[12px] text-white/40">1 hak kullanır · kalan {user?.remaining ?? 0}. Yazdığın saklanmaz.</span>
                </>
              ) : status === 'guest' ? (
                <>
                  <Link href="/kayit?next=/hazirla" className="btn-primary">Ücretsiz üye ol ve hazırla</Link>
                  <span className="text-[12px] text-white/40">Bu araç üyelere açık.</span>
                </>
              ) : null}
            </div>
            {error && <p className="mt-4 text-sm text-red-300/90">{error}</p>}

            {safety && (
              <div role="alert" className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-5 text-[15px] leading-relaxed text-amber-100/85">
                Anlattıklarında karşındaki kişinin sana zarar verdiği ya da seni tehdit ettiği bir durum olabilir. Böyle bir durumda daha sakin bir mesaj
                hazırlamak doğru yardım olmayabilir; önce kendi güvenliğin önemli. Güvendiğin biriyle ya da bir uzmanla konuşmanı öneririz. Hakkın iade edildi.
              </div>
            )}

            {result && (
              <div className="mt-10 animate-fade-up">
                {result.kept && <p className="text-sm text-white/55">{result.kept}</p>}
                <div className="mt-4 space-y-4">
                  {result.versions.map((v) => {
                    const value = edits[v.style] ?? v.text;
                    return (
                      <div key={v.style} className="glass rounded-2xl p-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-300">{PREPARE_STYLES[v.style].label}</p>
                          <button onClick={() => void copy(v.style, value)} className="text-[12px] text-white/50 hover:text-white">
                            {copied === v.style ? 'Kopyalandı ✓' : 'Kopyala'}
                          </button>
                        </div>
                        <textarea
                          value={value}
                          onChange={(e) => setEdits((p) => ({ ...p, [v.style]: e.target.value }))}
                          rows={Math.min(8, Math.max(3, Math.ceil(value.length / 70)))}
                          className="mt-2 w-full resize-y bg-transparent text-[15.5px] leading-relaxed text-white/90 focus:outline-none"
                          aria-label={`${PREPARE_STYLES[v.style].label} hâli`}
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-[12.5px] leading-relaxed text-white/40">
                  Bunlar öneri; istediğin gibi değiştir. Söyleyip söylememek, ne zaman ve nasıl söyleyeceğin senin kararın.
                </p>
              </div>
            )}

            <p className="mt-12 text-center text-[12px] text-white/30">
              Ne hissettiğini önce kendine anlatmak istersen: <Link href="/icimde" className="underline underline-offset-2 hover:text-white/60">İçimde ne var?</Link>
            </p>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
