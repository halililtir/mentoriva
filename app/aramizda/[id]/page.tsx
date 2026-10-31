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
interface Draft { text: string; kept: string; token: string }

const INSTRUCTIONS = [
  { id: 'kisa', label: 'Daha kısa' },
  { id: 'net', label: 'Daha net' },
  { id: 'yumusak', label: 'Daha yumuşak' },
] as const;
const TIME = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const POLL_MS = 6000;

/**
 * Aramızda konuşma odası. Ortak alanda yalnızca onaylanmış mesajlar görünür.
 * Özel alanda yazılan ham metin sunucuda saklanmaz; Mentoriva'nın önerisi
 * onaylanırsa birebir gönderilir (öneri elle değiştirilemez).
 */
export default function RoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { status, user, setRemaining } = useSession();
  const [room, setRoom] = useState<RoomView | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [gone, setGone] = useState('');
  const [raw, setRaw] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<'draft' | 'send' | null>(null);
  const [error, setError] = useState('');
  const [safety, setSafety] = useState(false);
  const [crisis, setCrisis] = useState('');
  const [help, setHelp] = useState<Record<string, { meaning: string; ask: string } | 'loading'>>({});
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (messages.length !== lastCount.current) {
      lastCount.current = messages.length;
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  const prepare = async (instruction?: string) => {
    setBusy('draft');
    setError('');
    setSafety(false);
    try {
      const res = await fetch(`/api/v1/bridge/${params.id}/draft`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: raw, ...(instruction ? { instruction } : {}) }) });
      const d = (await res.json().catch(() => null)) as (Draft & { safety?: boolean; crisis?: string; remaining?: number; error?: string }) | null;
      if (typeof d?.remaining === 'number') setRemaining(d.remaining);
      if (d?.crisis) return setCrisis(d.crisis);
      if (d?.safety) { setDraft(null); return setSafety(true); }
      if (!res.ok || !d?.token) return setError(d?.error ?? 'Hazırlanamadı.');
      setDraft({ text: d.text, kept: d.kept, token: d.token });
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
      setRaw('');
      track('bridge_send');
    } catch {
      setError('Bağlantı kurulamadı; mesaj gitmemiş olabilir. Sayfayı yenileyip ortak alana bak.');
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
  };

  const newInvite = async () => {
    const res = await fetch(`/api/v1/bridge/${params.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invite: true }) });
    const d = (await res.json().catch(() => null)) as { inviteUrl?: string } | null;
    if (d?.inviteUrl) setInviteUrl(d.inviteUrl);
  };

  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const toggleMute = async () => {
    const muted = !room?.muted;
    const res = await fetch(`/api/v1/bridge/${params.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mute: muted }) }).catch(() => null);
    if (res?.ok) setRoom((r) => (r ? { ...r, muted } : r));
    else setError('Bildirim ayarı değiştirilemedi; biraz sonra tekrar dene.');
  };

  const close = async () => {
    if (!confirm('Konuşma iki taraf için de kapanacak ve içindeki bütün mesajlar silinecek. Emin misin?')) return;
    await fetch(`/api/v1/bridge/${params.id}`, { method: 'DELETE' });
    track('bridge_close');
    router.replace('/aramizda');
  };

  if (status === 'guest') {
    return (
      <Shell>
        <p className="text-white/65">Bu konuşmayı görmek için giriş yapmalısın.</p>
        <Link href={`/giris?next=/aramizda/${params.id}`} className="btn-primary mt-4 inline-flex">Giriş yap</Link>
      </Shell>
    );
  }
  if (gone) {
    return (
      <Shell>
        <p className="text-white/65">{gone}</p>
        <Link href="/aramizda" className="btn-secondary mt-4 inline-flex">Konuşmalarım</Link>
      </Shell>
    );
  }
  if (crisis) return <Shell><CrisisNotice message={crisis} onBack={() => setCrisis('')} /></Shell>;
  if (!room) return <Shell><div className="skeleton h-40 rounded-3xl" /></Shell>;

  return (
    <Shell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Aramızda</p>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl">{room.topic}</h1>
          <p className="mt-1 text-[13px] text-white/45">{room.waiting ? 'Karşı tarafın katılması bekleniyor' : `${room.other} ile`}</p>
        </div>
        <button onClick={() => void close()} className="text-[12.5px] text-white/40 hover:text-red-300">Konuşmayı kapat ve sil</button>
      </div>

      {!room.waiting && (
        <button onClick={() => void toggleMute()} className="mt-3 text-[12.5px] text-white/40 hover:text-white/70">
          {room.muted ? 'Yeni mesajlarda e-posta gelsin' : 'Yeni mesajlarda e-posta gelmesin'}
        </button>
      )}

      {room.waiting && room.me === 0 && (
        <div className="mt-6 rounded-3xl border border-brand-400/30 bg-brand-500/[0.06] p-5">
          <p className="text-[15px] text-white/85">Davet bağlantısını konuşmak istediğin kişiye gönder.</p>
          <p className="mt-1 text-[12.5px] text-white/45">Bağlantı 7 gün geçerli ve tek kullanımlık. Katılması için üye olması gerekir.</p>
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

      {/* Ortak alan */}
      <section aria-label="Ortak alan" className="mt-8">
        <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Ortak alan · ikiniz de görürsünüz</p>
        <div className="mt-3 space-y-3">
          {messages.length === 0 && <p className="text-[13.5px] text-white/40">Henüz mesaj yok.</p>}
          {messages.map((m) => (
            <div key={m.id} className={cn('flex flex-col', m.mine ? 'items-end' : 'items-start')}>
              <div className={cn('max-w-[88%] whitespace-pre-wrap rounded-2xl border px-4 py-3 text-[15px] leading-relaxed sm:max-w-[80%]', m.mine ? 'rounded-br-md border-brand-500/25 bg-brand-500/[0.1] text-white/90' : 'rounded-bl-md border-white/[0.08] bg-white/[0.03] text-white/85')}>
                {m.text}
              </div>
              <span className="mt-1 px-1 text-[11px] text-white/30">{m.mine ? 'Sen' : room.other} · {TIME.format(new Date(m.at))}</span>
              {!m.mine && !help[m.id] && (
                <button onClick={() => void explain(m.id)} className="mt-1 px-1 text-[12px] text-brand-300/80 hover:underline">Bunu anlamama yardım et</button>
              )}
              {!m.mine && help[m.id] === 'loading' && <span className="mt-1 px-1 text-[12px] text-white/40">Düşünüyorum…</span>}
              {!m.mine && help[m.id] && help[m.id] !== 'loading' && (
                <div className="mt-2 max-w-[88%] rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5 text-[13.5px] leading-relaxed text-white/70 sm:max-w-[80%]">
                  <p className="text-[11px] text-white/35">Yalnızca sen görüyorsun</p>
                  <p className="mt-1">{(help[m.id] as { meaning: string }).meaning}</p>
                  {(help[m.id] as { ask: string }).ask && (
                    <p className="mt-2"><span className="text-white/45">Sorabileceğin:</span> &ldquo;{(help[m.id] as { ask: string }).ask}&rdquo;</p>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </section>

      {/* Özel alan */}
      {!room.waiting && (
        <section aria-label="Özel alanın" className="glass mt-10 rounded-3xl p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.16em] text-brand-300">Özel alanın · yalnızca sen görürsün</p>
          <p className="mt-1 text-[13px] text-white/50">Aklından geçtiği gibi yaz. Mentoriva anlamını ve itirazını koruyarak karşı tarafın duyabileceği hâle getirir; sen onaylamadan hiçbir şey gitmez.</p>
          <textarea
            value={raw}
            onChange={(e) => { setRaw(e.target.value.slice(0, 1200)); setDraft(null); setSafety(false); }}
            rows={4}
            placeholder="Ne söylemek istiyorsun?"
            className="input-field mt-4 min-h-[110px] w-full resize-y text-base"
            aria-label="Söylemek istediğin"
          />
          {!draft && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button onClick={() => void prepare()} disabled={raw.trim().length < 3 || busy !== null || (user?.remaining ?? 0) <= 0} className="btn-primary text-sm">
                {busy === 'draft' ? 'Hazırlanıyor…' : 'Mentoriva hazırlasın'}
              </button>
              <span className="text-[12px] text-white/40">1 hak · kalan {user?.remaining ?? 0}</span>
            </div>
          )}

          {draft && (
            <div className="mt-5 animate-fade-up">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">Karşı tarafa böyle gidecek</p>
              <div className="mt-2 rounded-2xl border border-brand-400/30 bg-brand-500/[0.06] p-4 text-[15.5px] leading-relaxed text-white/90">{draft.text}</div>
              {draft.kept && <p className="mt-2 text-[12.5px] text-white/50">{draft.kept}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => void send()} disabled={busy !== null} className="btn-primary text-sm">{busy === 'send' ? 'Gönderiliyor…' : 'Onaylıyorum, gönder'}</button>
                {INSTRUCTIONS.map((i) => (
                  <button key={i.id} onClick={() => void prepare(i.id)} disabled={busy !== null} className="rounded-full border border-white/10 px-3.5 py-2 text-[13px] text-white/65 hover:text-white">{i.label}</button>
                ))}
                <button onClick={() => setDraft(null)} className="px-2 text-[13px] text-white/40 hover:text-white">Vazgeç</button>
              </div>
              <p className="mt-2 text-[11.5px] text-white/35">Öneriyi değiştirmek istersen yukarıdaki metnini düzenleyip yeniden hazırlat. Her yeniden hazırlama 1 hak kullanır.</p>
            </div>
          )}

          {safety && (
            <div role="alert" className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-[14.5px] leading-relaxed text-amber-100/85">
              Anlattıklarında karşındaki kişinin sana zarar verdiği, seni tehdit ettiği ya da baskı altında tuttuğu bir durum olabilir. Böyle bir durumda
              bu konuşmayı sürdürmek doğru yardım olmayabilir; önce kendi güvenliğin önemli. Bu mesaj iletilmedi ve hakkın iade edildi. Güvendiğin biriyle ya
              da bir uzmanla konuşmanı öneririz. İstersen konuşmayı kapatabilirsin; karşı tarafa bir neden gösterilmez.
            </div>
          )}
          {error && <p className="mt-3 text-sm text-red-300/90">{error}</p>}
        </section>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-8">{children}</main>
    </div>
  );
}
