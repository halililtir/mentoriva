'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DECISION_LIMITS, type SavedDecision } from '@/lib/decisions-public';
import { todayKey } from '@/lib/time';

const DATE = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
const when = (iso: string) => DATE.format(new Date(iso));

/** Yolculuğum: takibe alınan kararlar ve "ne oldu?" kayıtları. */
export function DecisionList() {
  const [items, setItems] = useState<SavedDecision[] | null>(null);

  useEffect(() => {
    fetch('/api/v1/decisions')
      .then((r) => (r.ok ? r.json() : { decisions: [] }))
      .then((d: { decisions?: SavedDecision[] }) => setItems(d.decisions ?? []))
      .catch(() => setItems([]));
  }, []);

  const remove = async (id: string) => {
    if (!confirm('Bu karar kaydı silinsin mi?')) return;
    const res = await fetch(`/api/v1/decisions?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => null);
    if (res?.ok) setItems((l) => (l ?? []).filter((x) => x.id !== id));
  };

  const update = (d: SavedDecision) => setItems((l) => (l ?? []).map((x) => (x.id === d.id ? d : x)));

  if (items === null) return <div className="skeleton h-24 rounded-2xl" />;
  if (!items.length) {
    return (
      <p className="text-[14.5px] leading-relaxed text-white/50">
        Takip ettiğin bir karar yok. <Link href="/calismalar/karar" className="text-brand-300 hover:underline">Karar vermek</Link> çalışmasının sonunda kararını buraya ekleyebilirsin.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((d) => <DecisionItem key={d.id} d={d} onUpdate={update} onRemove={() => void remove(d.id)} />)}
    </ul>
  );
}

function DecisionItem({ d, onUpdate, onRemove }: { d: SavedDecision; onUpdate: (d: SavedDecision) => void; onRemove: () => void }) {
  const [outcome, setOutcome] = useState('');
  const [error, setError] = useState('');
  const due = !d.outcome && d.checkDate <= todayKey();

  const save = async () => {
    setError('');
    const res = await fetch('/api/v1/decisions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: d.id, outcome }) }).catch(() => null);
    const r = (await res?.json().catch(() => null)) as { decision?: SavedDecision; error?: string } | null;
    if (r?.decision) onUpdate(r.decision);
    else setError(r?.error ?? 'Kaydedilemedi.');
  };

  return (
    <li className="rounded-2xl border border-white/[0.08] p-4">
      <p className="text-[12px] text-white/40">{d.title} · {when(d.createdAt)}</p>
      <p className="mt-1 font-display text-lg leading-snug text-white/95">{d.choice}</p>
      {d.why && <p className="mt-1 text-[13.5px] leading-relaxed text-white/60">{d.why}</p>}
      {d.outcome ? (
        <div className="mt-3 border-l-2 border-brand-400/40 pl-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">Ne oldu</p>
          <p className="mt-1 text-[14px] leading-relaxed text-white/80">{d.outcome}</p>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-[13px] text-white/55">{due ? 'Zamanı geldi. Ne oldu?' : `${when(`${d.checkDate}T12:00:00Z`)} tarihinde soracağız; istersen şimdi de yazabilirsin.`}</p>
          <textarea
            value={outcome}
            onChange={(e) => setOutcome(e.target.value.slice(0, DECISION_LIMITS.outcome))}
            rows={2}
            className="input-field mt-2 w-full resize-y text-base"
            aria-label="Ne oldu"
          />
          {error && <p className="mt-1 text-sm text-red-300/90">{error}</p>}
          <button onClick={() => void save()} disabled={outcome.trim().length < 2} className="btn-secondary mt-2 text-sm">Kaydet</button>
        </div>
      )}
      <button onClick={onRemove} className="mt-3 block text-[12px] text-white/35 hover:text-red-300">Sil</button>
    </li>
  );
}
