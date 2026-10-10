'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { MemoryPanel } from '@/components/me/MemoryPanel';
import { SavedCards } from '@/components/feelings/SavedCards';
import { useSession } from '@/lib/session';
import { getActiveMentor, getAccent } from '@/lib/mentors/metadata';
import { MAP_FIELDS } from '@/lib/journey/content';
import type { SavedJourney, SavedStep } from '@/lib/journey/store';
import type { SavedChatMeta } from '@/lib/chats';

const DATE = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
const fmt = (iso: string) => DATE.format(new Date(iso));

/**
 * Yolculuğum — kişinin hesabında tutulan her şey tek sayfada: hafıza (onaylı
 * notlar), bekleyen adım, farkındalık kartları, kayıtlı sohbetler, yolculuk
 * haritaları ve verilerim (indir / hesabı sil). Gizli bir değerlendirme ya da
 * "gelişim puanı" yoktur; yalnızca kişinin kendi kaydettikleri.
 */
export default function YolculugumPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'guest') router.replace('/giris?next=/yolculugum');
  }, [status, router]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-10">
        <p className="eyebrow">Yolculuğum</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,5vw,2.8rem)] leading-tight">
          Kaydettiklerin, <span className="italic text-gradient">tek yerde.</span>
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/55">
          Burada yalnızca senin kaydetmeyi seçtiklerin var. Hakkında bir puan, rapor ya da gizli bir profil tutulmaz.
        </p>

        {status === 'user' && (
          <div className="mt-10 space-y-12">
            <Section title="Hafızam" id="hafiza">
              <MemoryPanel />
            </Section>
            <Section title="Seçtiğim adım" id="adim">
              <StepSection />
            </Section>
            <Section title="Farkındalık kartlarım" id="kartlar">
              <SavedCards />
              <EmptyHint kind="cards" />
            </Section>
            <Section title="Kayıtlı sohbetlerim" id="sohbetler">
              <ChatsSection />
            </Section>
            <Section title="Yolculuk haritalarım" id="haritalar">
              <JourneysSection />
            </Section>
            <Section title="Verilerim" id="veriler">
              <DataSection />
            </Section>
          </div>
        )}
        {status === 'loading' && <div className="skeleton mt-10 h-40 rounded-3xl" />}
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <h2 id={`${id}-title`} className="font-display text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Kart listesi boşsa SavedCards hiçbir şey çizmez; bu nazik bir yönlendirme gösterir. */
function EmptyHint({ kind }: { kind: 'cards' }) {
  const [empty, setEmpty] = useState(false);
  useEffect(() => {
    if (kind !== 'cards') return;
    fetch('/api/v1/cards').then((r) => (r.ok ? r.json() : { cards: [] })).then((d: { cards?: unknown[] }) => setEmpty(!d.cards?.length)).catch(() => {});
  }, [kind]);
  if (!empty) return null;
  return (
    <p className="text-[13.5px] text-white/45">
      Henüz kartın yok. <Link href="/icimde" className="text-brand-300/90 hover:underline">İçimde ne var?</Link> ile ilkini oluşturabilirsin.
    </p>
  );
}

function StepSection() {
  const [step, setStep] = useState<SavedStep | null | undefined>(undefined);
  useEffect(() => {
    fetch('/api/v1/journey/step').then((r) => (r.ok ? r.json() : { step: null })).then((d: { step?: SavedStep | null }) => setStep(d.step ?? null)).catch(() => setStep(null));
  }, []);

  const update = async (status: SavedStep['status']) => {
    const res = await fetch('/api/v1/journey/step', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res.ok) setStep(((await res.json()) as { step: SavedStep }).step);
  };
  const remove = async () => {
    if ((await fetch('/api/v1/journey/step', { method: 'DELETE' })).ok) setStep(null);
  };

  if (step === undefined) return <div className="skeleton h-16 rounded-2xl" />;
  if (!step) {
    return (
      <p className="text-[13.5px] text-white/45">
        Şu an seçtiğin bir adım yok. Bir kartın ya da <Link href="/yolculuk" className="text-brand-300/90 hover:underline">Kendine Yolculuk</Link> sonunda küçük bir adım seçebilirsin.
      </p>
    );
  }
  const label = { pending: 'Bekliyor', done: 'Yaptım', skipped: 'Olmadı' }[step.status];
  return (
    <div className="rounded-2xl border border-white/[0.08] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[15px] text-white/90">{step.label}</p>
          {step.detail && <p className="mt-0.5 text-[13.5px] text-white/55">{step.detail}</p>}
          <p className="mt-1 text-[11.5px] text-white/35">{fmt(step.createdAt)} · {label}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[12.5px]">
          {step.status !== 'done' && <button onClick={() => void update('done')} className="btn-secondary !py-1.5 text-[12.5px]">Yaptım</button>}
          {step.status === 'pending' && <button onClick={() => void update('skipped')} className="rounded-full border border-white/10 px-3 py-1.5 text-white/55">Olmadı</button>}
          <button onClick={() => void remove()} className="px-2 text-white/35 hover:text-red-300">Sil</button>
        </div>
      </div>
    </div>
  );
}

function ChatsSection() {
  const [chats, setChats] = useState<SavedChatMeta[] | null>(null);
  useEffect(() => {
    fetch('/api/v1/chats').then((r) => (r.ok ? r.json() : { chats: [] })).then((d: { chats?: SavedChatMeta[] }) => setChats(d.chats ?? [])).catch(() => setChats([]));
  }, []);
  if (!chats) return <div className="skeleton h-16 rounded-2xl" />;
  if (!chats.length) return <p className="text-[13.5px] text-white/45">Kayıtlı sohbetin yok. Bir sohbetin başlığındaki &ldquo;Kaydet&rdquo; ile buraya eklenir.</p>;
  return (
    <ul className="space-y-2">
      {chats.map((c) => {
        const m = getActiveMentor(c.mentorId);
        return (
          <li key={c.id}>
            <Link href={`/sohbetlerim/${c.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] px-4 py-3 transition hover:border-white/20">
              <span className="min-w-0">
                <span className="block truncate text-[15px] text-white/85">{c.title}</span>
                <span className="text-[12px] text-white/35">
                  <span style={{ color: getAccent(m.accentColor).text }}>{m.shortName}</span> · {fmt(c.updatedAt)}
                </span>
              </span>
              <span className="text-white/35">›</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function JourneysSection() {
  const [items, setItems] = useState<SavedJourney[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/v1/journey/saved').then((r) => (r.ok ? r.json() : { journeys: [] })).then((d: { journeys?: SavedJourney[] }) => setItems(d.journeys ?? [])).catch(() => setItems([]));
  }, []);
  if (!items) return <div className="skeleton h-16 rounded-2xl" />;
  if (!items.length) return <p className="text-[13.5px] text-white/45">Kayıtlı yolculuk haritan yok. <Link href="/yolculuk" className="text-brand-300/90 hover:underline">Kendine Yolculuk</Link> sonunda haritanı kaydedebilirsin.</p>;
  return (
    <ul className="space-y-2">
      {items.map((j) => (
        <li key={j.id} className="rounded-2xl border border-white/[0.08]">
          <button onClick={() => setOpen(open === j.id ? null : j.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" aria-expanded={open === j.id}>
            <span>
              <span className="block text-[15px] text-white/85">{j.map.topic || j.startingPoint}</span>
              <span className="text-[12px] text-white/35">{fmt(j.createdAt)}</span>
            </span>
            <span className="text-white/35">{open === j.id ? '−' : '+'}</span>
          </button>
          {open === j.id && (
            <dl className="space-y-2 border-t border-white/[0.06] px-4 py-3 text-[13.5px]">
              {MAP_FIELDS.filter((f) => j.map[f.key]).map((f) => (
                <div key={f.key}>
                  <dt className="text-white/40">{f.label}</dt>
                  <dd className="text-white/75">{j.map[f.key]}</dd>
                </div>
              ))}
            </dl>
          )}
        </li>
      ))}
    </ul>
  );
}

function DataSection() {
  const router = useRouter();
  const { refresh } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const removeAccount = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/v1/me/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) return setError(data?.error ?? 'Hesap silinemedi.');
      await refresh();
      router.replace('/?hesap-silindi=1');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/[0.08] p-4">
        <p className="text-[15px] text-white/85">Verilerimi indir</p>
        <p className="mt-0.5 text-[13px] text-white/50">Hesabın, notların, kartların, kayıtlı sohbetlerin, haritaların ve işaretlerin tek bir dosyada (JSON).</p>
        <a href="/api/v1/me/export" className="btn-secondary mt-3 inline-flex text-sm">İndir</a>
      </div>
      <div className="rounded-2xl border border-red-400/15 p-4">
        <p className="text-[15px] text-white/85">Hesabımı sil</p>
        <p className="mt-0.5 text-[13px] text-white/50">Hesabın ve ona bağlı bütün kişisel verilerin kalıcı olarak silinir. Bu işlem geri alınamaz.</p>
        {!confirming ? (
          <button onClick={() => setConfirming(true)} className="mt-3 text-sm text-red-300/90 hover:text-red-200">Hesabımı silmek istiyorum</button>
        ) : (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Onaylamak için şifren"
              autoComplete="current-password"
              className="input-field flex-1 text-base"
              aria-label="Şifren"
            />
            <button onClick={() => void removeAccount()} disabled={!password || busy} className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-200 disabled:opacity-50">
              {busy ? 'Siliniyor…' : 'Kalıcı olarak sil'}
            </button>
            <button onClick={() => { setConfirming(false); setPassword(''); }} className="px-2 text-sm text-white/40">Vazgeç</button>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-300/90">{error}</p>}
      </div>
    </div>
  );
}
