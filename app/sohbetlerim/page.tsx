'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { getActiveMentor, getAccent, isActiveMentor } from '@/lib/mentors/metadata';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/cn';
import type { SavedChatMeta } from '@/lib/chats';

const DATE = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });

/**
 * Kaydedilen sohbetler. Yalnızca kullanıcının "Kaydet" dediği sohbetler burada;
 * ücretsiz üyelikte sınır var, dolunca Premium (yakında) bilgisi gösterilir.
 */
export default function SavedChatsPage() {
  const { status } = useSession();
  const [chats, setChats] = useState<SavedChatMeta[] | null>(null);
  const [limit, setLimit] = useState(5);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'user') return;
    fetch('/api/v1/chats', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { chats: [] }))
      .then((d: { chats?: SavedChatMeta[]; limit?: number }) => {
        setChats(d.chats ?? []);
        if (d.limit) setLimit(d.limit);
      })
      .catch(() => setChats([]));
  }, [status]);

  const remove = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/v1/chats/${id}`, { method: 'DELETE' });
      if (res.ok) setChats((c) => (c ?? []).filter((x) => x.id !== id));
    } finally {
      setBusy(null);
      setConfirming(null);
    }
  };

  const used = chats?.length ?? 0;
  const full = used >= limit;

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-10 sm:pt-14">
        {status === 'guest' ? (
          <div className="mx-auto mt-12 max-w-md text-center">
            <h1 className="font-display text-3xl">Sohbetlerim</h1>
            <p className="mt-3 text-white/70">Kaydettiğin sohbetleri görmek için giriş yap.</p>
            <Link href="/giris?next=/sohbetlerim" className="btn-primary mt-5 inline-flex">Giriş yap</Link>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-300">Sohbetlerim</p>
            <h1 className="mt-2 font-display text-[clamp(1.8rem,4vw,2.4rem)] leading-tight">Kaldığın yerden devam et.</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
              Bir sohbeti mentorun ekranındaki <b className="text-white/80">Kaydet</b> düğmesiyle saklarsın; sonra buradan açıp devam edebilirsin.
              Kayıtlı sohbetler yalnızca sana görünür, istediğin an silebilirsin.
            </p>

            {/* Kullanım */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex gap-1.5" aria-hidden="true">
                {Array.from({ length: limit }, (_, i) => (
                  <span key={i} className={cn('h-2 w-7 rounded-full', i < used ? 'bg-brand-400' : 'bg-white/[0.08]')} />
                ))}
              </div>
              <span className="text-[13px] tabular-nums text-white/55">{chats ? `${used}/${limit} kayıt` : '…'}</span>
            </div>

            {full && (
              <div className="mt-5 rounded-2xl border border-amber-300/25 bg-amber-300/[0.06] p-4 sm:p-5">
                <p className="text-sm font-medium text-amber-200">Kayıt alanın dolu</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/70">
                  Ücretsiz üyelikte {limit} sohbet saklayabilirsin. Sınırsız kayıt ve daha fazlası yakında gelecek{' '}
                  <b className="text-white/90">Premium üyelikle</b> açılacak. O zamana kadar yeni bir sohbet kaydetmek için eskilerden birini silebilirsin.
                </p>
              </div>
            )}

            <ul className="mt-6 space-y-3">
              {chats === null &&
                Array.from({ length: 2 }, (_, i) => <li key={i} className="skeleton h-24 rounded-2xl" />)}
              {chats?.length === 0 && (
                <li className="glass rounded-2xl p-6 text-center">
                  <p className="text-white/75">Henüz kaydettiğin bir sohbet yok.</p>
                  <p className="mt-1 text-[13px] text-white/50">Bir mentorla sohbet ederken üstteki yer imi simgesine dokun.</p>
                  <Link href="/" className="btn-primary mt-4 inline-flex">Bir soru sor</Link>
                </li>
              )}
              {chats?.map((c) => {
                if (!isActiveMentor(c.mentorId)) return null;
                const m = getActiveMentor(c.mentorId);
                const a = getAccent(m.accentColor);
                return (
                  <li key={c.id} className="glass flex items-start gap-4 rounded-2xl p-4 sm:p-5">
                    <span className="relative mt-0.5 h-11 w-11 shrink-0 overflow-hidden rounded-full border-2" style={{ borderColor: a.hex }}>
                      <Image src={m.portraitUrl} alt="" fill sizes="44px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px]" style={{ color: a.text }}>{m.name}</p>
                      <Link href={`/sohbetlerim/${c.id}`} className="mt-0.5 block font-display text-[17px] leading-snug text-white/90 hover:text-white">
                        {c.title}
                      </Link>
                      <p className="mt-1 text-[12px] text-white/45">
                        {Math.ceil(c.count / 2)} soru-cevap · {DATE.format(new Date(c.updatedAt))}
                      </p>
                      <div className="mt-3 flex items-center gap-4">
                        <Link href={`/sohbetlerim/${c.id}`} className="text-[13px] font-medium text-brand-300 hover:underline">Devam et →</Link>
                        {confirming === c.id ? (
                          <span className="flex items-center gap-3 text-[12.5px]">
                            <span className="text-white/55">Silinsin mi?</span>
                            <button onClick={() => void remove(c.id)} disabled={busy === c.id} className="font-medium text-red-400 hover:underline">
                              {busy === c.id ? 'Siliniyor…' : 'Evet, sil'}
                            </button>
                            <button onClick={() => setConfirming(null)} className="text-white/55 hover:text-white/80">Vazgeç</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirming(c.id)} className="text-[12.5px] text-white/45 hover:text-white/75">Sil</button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
