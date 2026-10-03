'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ACTIVE_MENTORS, getAccent } from '@/lib/mentors/metadata';
import { BADGE_BY_ID } from '@/lib/badges-public';
import { BadgeMedal } from '@/components/badges/BadgeMedal';
import { cn } from '@/lib/cn';
import { Card, adminFetch, smallBtn } from './shared';

interface AccessData {
  earlyMentors: string[];
  earlyUsers: Array<{ username: string; name: string; badges: string[] }>;
}

/**
 * Hangi mentor herkese, hangisi yalnızca erken erişimi olanlara (Kurucu Üye,
 * Destekçi) açık. Yeni bir mentor eklenince önce burada "Erken erişim" yapılır.
 */
export function EarlyAccess({ onError }: { onError: (e: unknown) => void }) {
  const [data, setData] = useState<AccessData | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    adminFetch<AccessData>('/api/admin/access')
      .then((d) => { setData(d); setDraft(d.earlyMentors); })
      .catch(onError);
  }, [onError]);

  const toggle = (id: string) => {
    setMsg('');
    setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  };

  const save = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await adminFetch<{ earlyMentors: string[] }>('/api/admin/access', { method: 'PUT', json: { earlyMentors: draft } });
      setData((d) => (d ? { ...d, earlyMentors: r.earlyMentors } : d));
      setMsg('Kaydedildi. Birkaç dakika içinde herkese yansır.');
    } catch (e) { onError(e); } finally { setBusy(false); }
  };

  if (!data) return <div className="skeleton h-64 rounded-2xl" />;
  const dirty = [...draft].sort().join() !== [...data.earlyMentors].sort().join();

  return (
    <div className="space-y-5">
      <Card
        title="Mentor erişimi"
        action={<button onClick={save} disabled={busy || !dirty} className={smallBtn}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>}
      >
        <p className="mb-4 text-[13px] leading-relaxed text-white/60">
          “Erken erişim”deki mentoru yalnızca Kurucu Üye ve Destekçiler seçebilir; diğerleri kartı kilitli görür.
          Yeni bir mentor eklediğinde önce burada erken erişime al, hazır olunca herkese aç. En az bir mentor herkese açık kalmalı.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {ACTIVE_MENTORS.map((m) => {
            const early = draft.includes(m.id);
            return (
              <li key={m.id}>
                <button
                  onClick={() => toggle(m.id)}
                  className={cn('flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors', early ? 'border-amber-500/40 bg-amber-500/[0.06]' : 'border-white/[0.08] hover:border-white/20')}
                >
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border" style={{ borderColor: getAccent(m.accentColor).border }}>
                    <Image src={m.portraitUrl} alt="" fill sizes="36px" className="object-cover" />
                  </span>
                  <span className="flex-1 text-sm text-white/85">{m.shortName}</span>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium', early ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/10 text-emerald-400')}>
                    {early ? 'Erken erişim' : 'Herkese açık'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {msg && <p className="mt-3 text-xs text-emerald-400">{msg}</p>}
      </Card>

      <Card title={`Erken erişimi olan üyeler (${data.earlyUsers.length})`}>
        {data.earlyUsers.length === 0 ? (
          <p className="text-sm text-white/50">Henüz yok. Üyeler sekmesinden bir üyeye Kurucu Üye ya da Destekçi işareti verince burada görünür.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {data.earlyUsers.map((u) => (
              <li key={u.username} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="flex-1 truncate text-white/85">{u.name || u.username.split('@')[0]} <span className="text-xs text-white/45">{u.username}</span></span>
                {u.badges.filter((id) => BADGE_BY_ID[id]?.kind === 'grant').map((id) => (
                  <span key={id} title={BADGE_BY_ID[id]?.name}><BadgeMedal id={id} size={22} /></span>
                ))}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
