'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, Pill, adminFetch, fmtAgo, inputCls, smallBtn } from './shared';

interface Pending { email: string; name: string; at: string; referred: boolean }

/**
 * Üyelik doğrulaması: e-posta gönderimini denemek ve kodu ulaşmayan
 * kayıtları elle onaylamak için.
 */
export function Membership({ sender, onChanged, onError }: { sender: string | null; onChanged: () => Promise<void>; onError: (e: unknown) => void }) {
  const [pending, setPending] = useState<Pending[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [to, setTo] = useState('');
  const [testMsg, setTestMsg] = useState('');

  const load = useCallback(async () => {
    try { setPending((await adminFetch<{ pending: Pending[] }>('/api/admin/pending')).pending); } catch (e) { onError(e); }
  }, [onError]);

  useEffect(() => { void load(); }, [load]);

  const act = async (email: string, action: 'approve' | 'delete') => {
    if (action === 'approve' && !confirm(`${email} hesabı açılsın mı? Kişi kayıtta belirlediği şifreyle giriş yapabilir.`)) return;
    setBusy(email);
    try {
      await adminFetch('/api/admin/pending', { method: 'POST', json: { email, action } });
      await load();
      await onChanged();
    } catch (e) { onError(e); } finally { setBusy(null); }
  };

  const sendTest = async () => {
    setBusy('test'); setTestMsg('');
    try {
      const r = await adminFetch<{ from: string }>('/api/admin/email-test', { method: 'POST', json: { to } });
      setTestMsg(`Gönderildi (${r.from}). Gelen kutusunu ve spam klasörünü kontrol et.`);
    } catch (e) {
      setTestMsg(e instanceof Error ? `Gönderilemedi: ${e.message}` : 'Gönderilemedi');
    } finally { setBusy(null); }
  };

  const defaultSender = !sender || sender.endsWith('resend.dev');

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title={`Doğrulama bekleyenler${pending ? ` (${pending.length})` : ''}`}>
        <p className="mb-3 text-[12px] leading-relaxed text-white/55">
          Kayıt formunu doldurup kodu girmemiş kişiler (7 gün saklanır). Kodu ulaşmayan birini buradan onaylayabilirsin; kişi kayıtta belirlediği şifreyle giriş yapar.
        </p>
        {pending === null ? (
          <div className="skeleton h-16 rounded-xl" />
        ) : pending.length === 0 ? (
          <p className="text-sm text-white/50">Bekleyen kayıt yok.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {pending.map((p) => (
              <li key={p.email} className="flex flex-wrap items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/85">{p.name} <span className="text-xs text-white/50">{p.email}</span></p>
                  <p className="text-[11px] text-white/45">{fmtAgo(p.at)} {p.referred && <Pill tone="brand">Davetli</Pill>}</p>
                </div>
                <button disabled={busy === p.email} onClick={() => act(p.email, 'approve')} className={`${smallBtn} !text-emerald-400`}>Onayla</button>
                <button disabled={busy === p.email} onClick={() => act(p.email, 'delete')} className={smallBtn}>Sil</button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="E-posta ayarları">
        <p className="text-[13px] text-white/70">
          Gönderici: <b className="text-white/90">{sender ?? '—'}</b>{' '}
          {defaultSender ? <Pill tone="warn">deneme göndericisi</Pill> : <Pill tone="good">alan adı</Pill>}
        </p>
        {defaultSender && (
          <p className="mt-2 text-[12px] leading-relaxed text-amber-400">
            Deneme göndericisi yalnızca Resend hesabının sahibine e-posta atar; üyelere kod gitmez. mentoriva.com.tr’yi Resend’de doğrulayıp RESEND_FROM ekle.
          </p>
        )}
        <p className="mt-4 text-[12px] text-white/55">Ayarları denemek için bir adrese örnek e-posta gönder:</p>
        <div className="mt-2 flex gap-2">
          <input value={to} onChange={(e) => setTo(e.target.value)} type="email" placeholder="ornek@gmail.com" className={inputCls} />
          <button disabled={busy === 'test' || !to.includes('@')} onClick={sendTest} className={smallBtn}>{busy === 'test' ? 'Gönderiliyor…' : 'Gönder'}</button>
        </div>
        {testMsg && <p className={`mt-2 text-[12px] ${testMsg.startsWith('Gönderildi') ? 'text-emerald-400' : 'text-red-400'}`}>{testMsg}</p>}
      </Card>
    </div>
  );
}
