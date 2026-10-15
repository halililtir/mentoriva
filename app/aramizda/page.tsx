'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { CrisisNotice } from '@/components/mentors/CrisisNotice';
import { BridgeRules } from '@/components/bridge/BridgeRules';
import { useSession } from '@/lib/session';
import { track } from '@/lib/analytics';

interface RoomRow { id: string; topic: string; other: string | null; waiting: boolean; updatedAt: string }

const DATE = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' });

/** Aramızda: tanıtım, açık konuşmalar ve yeni konuşma açma. */
export default function AramizdaPage() {
  const router = useRouter();
  const { status } = useSession();
  const [rooms, setRooms] = useState<RoomRow[] | null>(null);
  const [max, setMax] = useState(3);
  const [topic, setTopic] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [crisis, setCrisis] = useState('');

  const load = useCallback(() => {
    fetch('/api/v1/bridge').then((r) => (r.ok ? r.json() : null)).then((d: { rooms?: RoomRow[]; max?: number } | null) => {
      setRooms(d?.rooms ?? []);
      if (d?.max) setMax(d.max);
    }).catch(() => setRooms([]));
  }, []);

  useEffect(() => { if (status === 'user') load(); }, [status, load]);

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/v1/bridge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, consent }) });
      const d = (await res.json().catch(() => null)) as { id?: string; inviteUrl?: string; error?: string; crisis?: string } | null;
      if (d?.crisis) return setCrisis(d.crisis);
      if (!res.ok || !d?.id) return setError(d?.error ?? 'Konuşma açılamadı.');
      try { if (d.inviteUrl) sessionStorage.setItem(`mentoriva_invite_${d.id}`, d.inviteUrl); } catch {}
      track('bridge_create');
      router.push(`/aramizda/${d.id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-10">
        {crisis ? <CrisisNotice message={crisis} onBack={() => setCrisis('')} /> : (
          <>
            <p className="eyebrow">Aramızda</p>
            <h1 className="mt-3 font-display text-[clamp(2rem,5vw,2.8rem)] leading-tight text-balance">
              Birbirinizi <span className="italic text-gradient">duyabileceğiniz</span> bir konuşma.
            </h1>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/60">
              Biriyle konuşmak istediğin bir mesele var ama her konuşma kavgaya mı dönüyor? Bir konuşma aç, bağlantıyı o kişiye gönder.
              İkiniz de söylemek istediğinizi önce kendi özel alanınızda Mentoriva&apos;ya yazarsınız; Mentoriva bunu anlamını ve itirazını
              koruyarak karşı tarafın duyabileceği hâle getirir. Karşı tarafa yalnızca senin onayladığın hâl gider.
            </p>

            <div className="mt-8 rounded-3xl border border-white/[0.08] p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Kurallar</p>
              <BridgeRules className="mt-3" />
            </div>

            {status === 'guest' && (
              <div className="mt-8 text-center">
                <Link href="/kayit?next=/aramizda" className="btn-primary inline-flex">Ücretsiz üye ol ve başla</Link>
              </div>
            )}

            {status === 'user' && (
              <>
                <section className="glass mt-8 rounded-3xl p-5 sm:p-6">
                  <h2 className="font-display text-xl">Yeni bir konuşma aç</h2>
                  <label className="mt-4 block">
                    <span className="text-sm text-white/65">Konu (ikiniz de görürsünüz)</span>
                    <input value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 80))} placeholder="Örneğin: Hafta sonları ve çocuklar" className="input-field mt-2 w-full text-base" />
                  </label>
                  <label className="mt-4 flex cursor-pointer items-start gap-3">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-500" />
                    <span className="text-[13px] leading-relaxed text-white/60">Yukarıdaki kuralları okudum ve kabul ediyorum.</span>
                  </label>
                  {error && <p className="mt-3 text-sm text-red-300/90">{error}</p>}
                  <button onClick={() => void create()} disabled={busy || topic.trim().length < 3 || !consent} className="btn-primary mt-5">
                    {busy ? 'Açılıyor…' : 'Konuşmayı aç ve davet bağlantısı al'}
                  </button>
                  <p className="mt-2 text-[12px] text-white/35">Aynı anda en fazla {max} açık konuşman olabilir. Her hazırlanan mesaj 1 hak kullanır.</p>
                </section>

                {rooms && rooms.length > 0 && (
                  <section className="mt-10">
                    <h2 className="font-display text-xl">Konuşmaların</h2>
                    <ul className="mt-3 space-y-2">
                      {rooms.map((r) => (
                        <li key={r.id}>
                          <Link href={`/aramizda/${r.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] px-4 py-3 transition hover:border-white/20">
                            <span className="min-w-0">
                              <span className="block truncate text-[15px] text-white/85">{r.topic}</span>
                              <span className="text-[12px] text-white/40">
                                {r.waiting ? 'Davet bekliyor' : `${r.other} ile`} · {DATE.format(new Date(r.updatedAt))}
                              </span>
                            </span>
                            <span className="text-white/35">›</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
