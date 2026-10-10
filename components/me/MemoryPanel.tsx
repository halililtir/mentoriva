'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import type { Memory } from '@/lib/memory/notes';

const NOTE_MAX = 200;
const SOURCE_LABEL = { self: 'Sen yazdın', chat: 'Sohbetten', card: 'Karttan' } as const;

/**
 * "Hafızam": mentorların sohbetler arasında bildiği her şey burada görünür.
 * Gizli profil yok; kişi notu düzeltir, siler ya da hafızayı kapatır.
 */
export function MemoryPanel() {
  const [memory, setMemory] = useState<Memory | null>(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v1/notes').then((r) => (r.ok ? r.json() : null)).then((d: { memory?: Memory } | null) => setMemory(d?.memory ?? { enabled: true, notes: [] })).catch(() => {});
  }, []);

  const call = async (method: string, body?: unknown, query = '') => {
    setError('');
    const res = await fetch(`/api/v1/notes${query}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const data = (await res.json().catch(() => null)) as { memory?: Memory; error?: string } | null;
    if (!res.ok) return setError(data?.error ?? 'İşlem yapılamadı.');
    if (data?.memory) setMemory(data.memory);
    else if (query.includes('all=1')) setMemory({ enabled: memory?.enabled ?? true, notes: [] });
  };

  if (!memory) return <div className="skeleton h-28 rounded-2xl" />;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-lg text-[13.5px] leading-relaxed text-white/55">
          Mentorlar sohbetler arasında yalnızca buradaki notları bilir. Hakkında gizli bir profil tutulmaz; notları istediğin an düzeltebilir ya da silebilirsin.
        </p>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-white/70">
          <input
            type="checkbox"
            checked={memory.enabled}
            onChange={(e) => void call('PATCH', { enabled: e.target.checked })}
            className="h-4 w-4 accent-brand-500"
          />
          Mentorlar notlarımı kullansın
        </label>
      </div>

      <ul className={cn('mt-4 space-y-2', !memory.enabled && 'opacity-60')}>
        {memory.notes.map((n) => (
          <li key={n.id} className="rounded-xl border border-white/[0.08] px-3.5 py-2.5">
            {editing === n.id ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input value={editText} onChange={(e) => setEditText(e.target.value.slice(0, NOTE_MAX))} className="input-field flex-1 text-base" aria-label="Notu düzenle" />
                <div className="flex gap-2">
                  <button onClick={() => { void call('PATCH', { id: n.id, text: editText }); setEditing(null); }} className="btn-secondary text-sm">Kaydet</button>
                  <button onClick={() => setEditing(null)} className="text-sm text-white/40">Vazgeç</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[14.5px] leading-relaxed text-white/85">{n.text}</p>
                  <p className="mt-0.5 text-[11px] text-white/30">{SOURCE_LABEL[n.source]}</p>
                </div>
                <div className="flex shrink-0 gap-3 text-[12px]">
                  <button onClick={() => { setEditing(n.id); setEditText(n.text); }} className="text-white/45 hover:text-white">Düzelt</button>
                  <button onClick={() => void call('DELETE', undefined, `?id=${n.id}`)} className="text-white/35 hover:text-red-300">Sil</button>
                </div>
              </div>
            )}
          </li>
        ))}
        {memory.notes.length === 0 && (
          <li className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-[13.5px] text-white/45">
            Henüz not yok. Örneğin: &ldquo;Kısa ve net cevapları seviyorum.&rdquo; ya da &ldquo;Bu yıl yeni bir işe başladım.&rdquo;
          </li>
        )}
      </ul>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, NOTE_MAX))}
          onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { void call('POST', { text: draft, source: 'self' }); setDraft(''); } }}
          placeholder="Mentorların bilmesini istediğin bir şey…"
          className="input-field flex-1 text-base"
          aria-label="Yeni not"
        />
        <button onClick={() => { void call('POST', { text: draft, source: 'self' }); setDraft(''); }} disabled={!draft.trim()} className="btn-secondary text-sm">
          Not ekle
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-300/90">{error}</p>}
      {memory.notes.length > 0 && (
        <button
          onClick={() => { if (confirm('Bütün notların silinsin mi?')) void call('DELETE', undefined, '?all=1'); }}
          className="mt-3 text-[12px] text-white/30 hover:text-red-300"
        >
          Bütün notları sil
        </button>
      )}
    </div>
  );
}
