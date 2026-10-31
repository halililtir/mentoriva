'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { CrisisNotice } from '@/components/mentors/CrisisNotice';
import { useSession } from '@/lib/session';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';

interface RoomView { id: string; topic: string; me: 0 | 1; myName: string; other: string | null; waiting: boolean; muted?: boolean }
interface Msg { id: string; mine: boolean; text: string; at: string }
interface Draft { text: string; kept: string; heard: string; token: string }
type Help = { meaning: string; ask: string } | 'loading';

const INSTRUCTIONS = [
  { id: 'guclu', label: 'Öfkem daha çok belli olsun' },
  { id: 'net', label: 'Daha net' },
  { id: 'kisa', label: 'Daha kısa' },
  { id: 'yumusak', label: 'Daha yumuşak' },
] as const;
const CLOCK = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' });
const DAY = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' });
const MESSAGE_MAX = 1200;
const POLL_MS = 6000;

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  return days === 0 ? 'Bugün' : days === 1 ? 'Dün' : DAY.format(d);
};

/**
 * Aramızda konuşma ekranı. Ortak alanda yalnızca onaylanmış mesajlar görünür.
 * Özel alanda yazılan ham metin sunucuda saklanmaz; öneri onaylanırsa birebir
 * gönderilir (öneri elle değiştirilemez, metin düzenlenip yeniden hazırlatılır).
 */
export default function RoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { status, user, setRemaining } = useSession();
  const [room, setRoom] = useState<RoomView | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [gone, setGone] = useState('');
  const [raw, setRaw] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [regen, setRegen] = useState('');
  const [busy, setBusy] = useState<'draft' | 'send' | null>(null);
  const [error, setError] = useState('');
  const [safety, setSafety] = useState(false);
  const [crisis, setCrisis] = useState('');
  const [help, setHelp] = useState<Record<string, Help>>({});
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [menu, setMenu] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const lastCount = useRef(0);

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/bridge/${params.id}`).catch(() => null);
    if (!res) return;
    if (res.status === 404 || res.status === 401) {
      const d = (await res.json().catch(() => null)) as { error?: string } | null;
      setGone(d?.error ?? 'Bu konuşma artık yok.');
      return;
    }
    if (!res.ok) return;
    const d = (await res.json()) as { room: RoomView; messages: Msg[] };
    setRoom(d.room);
    setMessages(d.messages);
  }, [params.id]);

  useEffect(() => {
    if (status !== 'user' || gone) return;
    void load();
    try { const u = sessionStorage.getItem(`mentoriva_invite_${params.id}`); if (u) setInviteUrl(u); } catch {}
    const t = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, POLL_MS);
    return () => clearInterval(t);
  }, [status, load, params.id, gone]);

  // Yeni mesajda aşağı in; kişi eski mesajları okuyorsa (kendi mesajı değilse) yerinden oynatma.
  useEffect(() => {
    if (messages.length === lastCount.current) return;
    const first = lastCount.current === 0;
    lastCount.current = messages.length;
    const el = listRef.current;
    const nearEnd = !!el && el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    if (first || nearEnd || messages[messages.length - 1]?.mine) endRef.current?.scrollIntoView({ behavior: first ? 'auto' : 'smooth', block: 'end' });
  }, [messages]);

  // Öneri kartı açılınca liste daralır; cevaplanan son mesaj görünür kalsın.
  useEffect(() => {
    if (draft) endRef.current?.scrollIntoView({ block: 'end' });
  }, [draft]);

  const edit = (v: string) => {
    setRaw(v.slice(0, MESSAGE_MAX));
    setDraft(null);
    setRegen('');
    setSafety(false);
  };

  const prepare = async (instruction?: string) => {
    setBusy('draft');
    setError('');
    setSafety(false);
    try {
      const res = await fetch(`/api/v1/bridge/${params.id}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: raw, ...(instruction ? { instruction } : {}), ...(regen ? { regen } : {}) }),
      });
      const d = (await res.json().catch(() => null)) as (Partial<Draft> & { safety?: boolean; crisis?: string; remaining?: number; regen?: string; error?: string }) | null;
      if (typeof d?.remaining === 'number') setRemaining(d.remaining);
      if (d?.regen) setRegen(d.regen);
      if (d?.crisis) return setCrisis(d.crisis);
      if (d?.safety) { setDraft(null); return setSafety(true); }
      if (!res.ok || !d?.token || !d.text) return setError(d?.error ?? 'Hazırlanamadı.');
      setDraft({ text: d.text, kept: d.kept ?? '', heard: d.heard ?? '', token: d.token });
    } catch {
      setError('Bağlantı kurulamadı. Hak düşmüşse sunucu hata verdiğinde iade edilir; biraz sonra tekrar dene.');
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    if (!draft) return;
    setBusy('send');
    setError('');
    try {
      const res = await fetch(`/api/v1/bridge/${params.id}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: draft.text, token: draft.token }) });
      const d = (await res.json().catch(() => null)) as { message?: Msg; error?: string } | null;
      if (!res.ok || !d?.message) return setError(d?.error ?? 'Gönderilemedi.');
      setMessages((m) => [...m, d.message!]);
      setDraft(null);
      setRegen('');
      setRaw('');
      track('bridge_send');
    } catch {
      setError('Bağlantı kurulamadı; mesaj gitmemiş olabilir. Sayfayı yenileyip konuşmaya bak.');
    } finally {
      setBusy(null);
    }
  };

  const explain = async (id: string) => {
    setHelp((h) => ({ ...h, [id]: 'loading' }));
    const res = await fetch(`/api/v1/bridge/${params.id}/explain`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId: id }) }).catch(() => null);
    const d = res?.ok ? ((await res.json()) as { meaning: string; ask: string }) : null;
    setHelp((h) => {
      const next = { ...h };
      if (d) next[id] = d;
      else delete next[id];
      return next;
    });
    if (!d) setError('Şu an yardımcı olamadım; biraz sonra tekrar dene.');
  };

  const newInvite = async () => {
    const res = await fetch(`/api/v1/bridge/${params.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invite: true }) }).catch(() => null);
    const d = (await res?.json().catch(() => null)) as { inviteUrl?: string } | null;
    if (d?.inviteUrl) setInviteUrl(d.inviteUrl);
    else setError('Davet bağlantısı oluşturulamadı.');
  };

  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const toggleMute = async () => {
    setMenu(false);
    const muted = !room?.muted;
    const res = await fetch(`/api/v1/bridge/${params.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mute: muted }) }).catch(() => null);
    if (res?.ok) setRoom((r) => (r ? { ...r, muted } : r));
    else setError('Bildirim ayarı değiştirilemedi; biraz sonra tekrar dene.');
  };

  const close = async () => {
    setMenu(false);
    if (!confirm('Konuşma iki taraf için de kapanacak ve içindeki bütün mesajlar silinecek. Emin misin?')) return;
    const res = await fetch(`/api/v1/bridge/${params.id}`, { method: 'DELETE' }).catch(() => null);
    if (!res?.ok) return setError('Konuşma kapatılamadı; biraz sonra tekrar dene.');
    track('bridge_close');
    router.replace('/aramizda');
  };

  if (status === 'guest') {
    return (
      <Centered>
        <p className="text-white/65">Bu konuşmayı görmek için giriş yapmalısın.</p>
        <Link href={`/giris?next=/aramizda/${params.id}`} className="btn-primary mt-4 inline-flex">Giriş yap</Link>
      </Centered>
    );
  }
  if (gone) {
    return (
      <Centered>
        <p className="text-white/65">{gone}</p>
        <Link href="/aramizda" className="btn-secondary mt-4 inline-flex">Konuşmalarım</Link>
      </Centered>
    );
  }
  if (crisis) return <Centered><CrisisNotice message={crisis} onBack={() => setCrisis('')} /></Centered>;
  if (!room) return <Centered><div className="skeleton h-64 rounded-3xl" /></Centered>;

  const initial = (room.other ?? '?').trim().charAt(0).toLocaleUpperCase('tr-TR');

  return (
    <div className="flex h-dvh flex-col">
      <Header />

      {/* Konuşma başlığı */}
      <div className="border-b border-white/[0.07]">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-2.5">
          <Link href="/aramizda" className="text-lg text-white/45 hover:text-white" aria-label="Konuşmalarım">←</Link>
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/15 font-display text-lg text-brand-300" aria-hidden="true">{initial}</span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-sans text-[15px] font-medium text-white/95">{room.other ?? 'Davet bekleniyor'}</h1>
            <p className="truncate text-[12.5px] text-white/45">{room.topic}</p>
          </div>
          <div className="relative">
            <button onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-haspopup="menu" aria-label="Konuşma seçenekleri" className="flex h-9 w-9 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.06] hover:text-white">
              <span aria-hidden="true" className="text-lg leading-none">⋯</span>
            </button>
            {menu && <button className="fixed inset-0 z-10 cursor-default" aria-label="Menüyü kapat" tabIndex={-1} onClick={() => setMenu(false)} />}
            {menu && (
              <div role="menu" className="glass absolute right-0 top-11 z-20 w-64 rounded-2xl p-1.5 shadow-xl">
                {!room.waiting && (
                  <button role="menuitem" onClick={() => void toggleMute()} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-white/75 hover:bg-white/[0.06]">
                    {room.muted ? 'E-posta bildirimini aç' : 'E-posta bildirimini kapat'}
                  </button>
                )}
                <button role="menuitem" onClick={() => void close()} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-red-300 hover:bg-white/[0.06]">
                  Konuşmayı kapat ve sil
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mesajlar */}
      <main ref={listRef} className="min-h-0 flex-1 overflow-y-auto" aria-label="Ortak alan">
        <div className="mx-auto w-full max-w-2xl px-4 py-5">
          {room.waiting && room.me === 0 && (
            <div className="rounded-3xl border border-brand-400/30 bg-brand-500/[0.06] p-5">
              <p className="font-display text-xl text-white/95">Davet bağlantısını gönder</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-white/55">Bağlantı 7 gün geçerli ve tek kullanımlık. Katılması için üye olması gerekir.</p>
              {inviteUrl ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input readOnly value={inviteUrl} className="input-field flex-1 text-[13px]" onFocus={(e) => e.target.select()} aria-label="Davet bağlantısı" />
                  <button onClick={() => void copyInvite()} className="btn-secondary text-sm">{copied ? 'Kopyalandı ✓' : 'Kopyala'}</button>
                </div>
              ) : (
                <button onClick={() => void newInvite()} className="btn-secondary mt-3 text-sm">Davet bağlantısı oluştur</button>
              )}
            </div>
          )}

          {!room.waiting && messages.length === 0 && (
            <div className="mx-auto max-w-sm py-10 text-center">
              <p className="font-display text-xl text-white/90">İlk sözü söylemek zor olabilir.</p>
              <p className="mt-2 text-sm leading-relaxed text-white/50">Aşağıya aklından geçtiği gibi yaz. Sen onaylamadan hiçbir şey gitmez.</p>
            </div>
          )}

          <ol className="space-y-1">
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const newDay = !prev || dayLabel(prev.at) !== dayLabel(m.at);
              const h = help[m.id];
              return (
                <li key={m.id}>
                  {newDay && (
                    <p className="py-3 text-center">
                      <span className="rounded-full bg-white/[0.05] px-3 py-1 text-[11.5px] text-white/45">{dayLabel(m.at)}</span>
                    </p>
                  )}
                  <div className={cn('flex flex-col py-1', m.mine ? 'items-end' : 'items-start')}>
                    <div className={cn('max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed sm:max-w-[75%]', m.mine ? 'rounded-br-md bg-brand-500/[0.14] text-white/95' : 'rounded-bl-md bg-white/[0.06] text-white/90')}>
                      {m.text}
                    </div>
                    <span className="mt-1 px-1 text-[11px] text-white/35">{CLOCK.format(new Date(m.at))} · Mentoriva ile hazırlandı</span>
                    {!m.mine && !h && (
                      <button onClick={() => void explain(m.id)} className="mt-0.5 px-1 text-[12.5px] text-brand-300/90 hover:underline">Bunu anlamama yardım et</button>
                    )}
                    {!m.mine && h === 'loading' && <span className="mt-0.5 px-1 text-[12.5px] text-white/40">Düşünüyorum…</span>}
                    {!m.mine && h && h !== 'loading' && (
                      <div className="mt-1.5 max-w-[85%] rounded-2xl border border-white/[0.08] p-3.5 text-[13.5px] leading-relaxed text-white/70 sm:max-w-[75%]">
                        <p className="text-[11px] text-white/35">Yalnızca sen görüyorsun</p>
                        <p className="mt-1">{h.meaning}</p>
                        {h.ask && <p className="mt-2"><span className="text-white/45">Sorabileceğin:</span> &ldquo;{h.ask}&rdquo;</p>}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          <div ref={endRef} />
        </div>
      </main>

      {/* Özel alan: yalnızca yazan görür */}
      {!room.waiting && (
        <section aria-label="Özel alanın" className="border-t border-white/[0.07] pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto w-full max-w-2xl px-4 py-3">
            {draft && (
              <div className="mb-3 max-h-[46dvh] overflow-y-auto rounded-2xl border border-brand-400/30 bg-brand-500/[0.05] p-4 animate-fade-up">
                {draft.heard && <p className="text-[14px] leading-relaxed text-white/70">{draft.heard}</p>}
                <p className={cn('text-[11px] uppercase tracking-[0.14em] text-white/40', draft.heard && 'mt-3')}>Böyle gidecek</p>
                <p className="mt-1.5 whitespace-pre-wrap text-[15.5px] leading-relaxed text-white/95">{draft.text}</p>
                {draft.kept && <p className="mt-2 text-[12.5px] leading-relaxed text-white/50">{draft.kept}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {INSTRUCTIONS.map((i) => (
                    <button key={i.id} onClick={() => void prepare(i.id)} disabled={busy !== null} className="rounded-full border border-white/10 px-3 py-1.5 text-[12.5px] text-white/65 transition hover:border-white/25 hover:text-white disabled:opacity-50">{i.label}</button>
                  ))}
                </div>
                {busy === 'draft' && <p className="mt-2 text-[12.5px] text-white/50" role="status">Yeniden hazırlanıyor…</p>}
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => void send()} disabled={busy !== null} className="btn-primary flex-1 text-sm sm:flex-none">{busy === 'send' ? 'Gönderiliyor…' : 'Onaylıyorum, gönder'}</button>
                  <button onClick={() => setDraft(null)} className="px-3 py-2 text-[13px] text-white/45 hover:text-white">Vazgeç</button>
                </div>
              </div>
            )}

            {safety && (
              <div role="alert" className="mb-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-[14px] leading-relaxed text-amber-100/85">
                Anlattıklarında karşındaki kişinin sana zarar verdiği, seni tehdit ettiği ya da baskı altında tuttuğu bir durum olabilir. Böyle bir durumda
                bu konuşmayı sürdürmek doğru yardım olmayabilir; önce kendi güvenliğin önemli. Bu mesaj iletilmedi. Güvendiğin biriyle ya da bir uzmanla
                konuşmanı öneririz. İstersen konuşmayı kapatabilirsin; karşı tarafa bir neden gösterilmez.
              </div>
            )}
            {error && <p role="alert" className="mb-2 text-sm text-red-300/90">{error}</p>}

            {!draft && (
              <>
                <label htmlFor="bridge-raw" className="flex items-center justify-between px-1 pb-1.5 text-[12px] text-white/45">
                  <span>Özel alanın · yalnızca sen görürsün</span>
                  <span>Kalan hak {user?.remaining ?? 0}</span>
                </label>
                <div className="flex items-end gap-2">
                  <textarea
                    id="bridge-raw"
                    value={raw}
                    onChange={(e) => edit(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && raw.trim().length >= 3 && !busy) void prepare(); }}
                    rows={2}
                    disabled={busy === 'draft'}
                    placeholder="Aklından geçtiği gibi yaz…"
                    className="input-field max-h-40 min-h-[52px] flex-1 resize-none text-base"
                  />
                  <button onClick={() => void prepare()} disabled={raw.trim().length < 3 || busy !== null || (user?.remaining ?? 0) <= 0} className="btn-primary h-[52px] flex-shrink-0 !px-4 text-sm">
                    {busy === 'draft' ? <span className="typing-dots" aria-label="Hazırlanıyor"><span /><span /><span /></span> : 'Hazırla'}
                  </button>
                </div>
                <p className="px-1 pt-1.5 text-[11.5px] text-white/35">Mentoriva önerir, sen onaylamadan gitmez. Mesaj başına 1 hak; ince ayarlar ücretsiz.</p>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-10">{children}</main>
    </div>
  );
}
