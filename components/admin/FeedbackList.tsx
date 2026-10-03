'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { Pill, adminFetch, fmtDateTime, smallBtn } from './shared';

export interface AdminFeedback {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  status: 'new' | 'read';
}

export function FeedbackList({ items, onChanged, onError }: { items: AdminFeedback[]; onChanged: () => Promise<void>; onError: (e: unknown) => void }) {
  const [onlyNew, setOnlyNew] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const list = onlyNew ? items.filter((f) => f.status !== 'read') : items;

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    try { await fn(); await onChanged(); } catch (e) { onError(e); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            onClick={() => setOnlyNew(v)}
            className={cn('rounded-full border px-3 py-1 text-xs', onlyNew === v ? 'border-brand-500/40 bg-brand-500/10 text-brand-300' : 'border-white/10 text-white/60')}
          >
            {v ? `Okunmamış (${items.filter((f) => f.status !== 'read').length})` : `Tümü (${items.length})`}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="py-10 text-center text-sm text-white/50">{onlyNew ? 'Okunmamış geri bildirim yok.' : 'Henüz geri bildirim yok.'}</p>
      ) : (
        list.map((f) => (
          <article key={f.id} className={cn('rounded-2xl border bg-ink-50/70 p-4', f.status === 'read' ? 'border-white/[0.06]' : 'border-brand-500/30')}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-white/90">{f.name}</span>
              <a href={`mailto:${f.email}?subject=${encodeURIComponent('Mentoriva geri bildirimin hakkında')}`} className="text-xs text-brand-300 hover:underline">{f.email}</a>
              {f.status !== 'read' && <Pill tone="brand">Yeni</Pill>}
              <span className="ml-auto text-[11px] text-white/45">{fmtDateTime(f.createdAt)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/75">{f.message}</p>
            <div className="mt-3 flex gap-2">
              <button
                disabled={busy === f.id}
                onClick={() => act(f.id, () => adminFetch('/api/v1/feedback', { method: 'PATCH', json: { id: f.id, status: f.status === 'read' ? 'new' : 'read' } }))}
                className={smallBtn}
              >
                {f.status === 'read' ? 'Okunmadı yap' : 'Okundu'}
              </button>
              <button
                disabled={busy === f.id}
                onClick={() => { if (confirm('Bu geri bildirim kalıcı olarak silinsin mi?')) void act(f.id, () => adminFetch(`/api/v1/feedback?id=${encodeURIComponent(f.id)}`, { method: 'DELETE' })); }}
                className={cn(smallBtn, 'text-red-400')}
              >
                Sil
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
