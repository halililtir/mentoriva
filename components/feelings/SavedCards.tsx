'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import type { StudyCard } from '@/lib/studies/cards';

const DATE = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

/** Üyenin kaydettiği farkındalık kartları (yalnızca kendisi görür; silebilir). */
export function SavedCards({ className }: { className?: string }) {
  const [cards, setCards] = useState<StudyCard[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/cards')
      .then((r) => (r.ok ? r.json() : { cards: [] }))
      .then((d: { cards?: StudyCard[] }) => setCards(d.cards ?? []))
      .catch(() => setCards([]));
  }, []);

  const remove = async (id: string) => {
    if (!confirm('Bu kart silinsin mi? Geri alınamaz.')) return;
    const res = await fetch(`/api/v1/cards?id=${id}`, { method: 'DELETE' });
    if (res.ok) setCards((c) => (c ?? []).filter((x) => x.id !== id));
  };

  if (!cards?.length) return null;

  return (
    <div className={className}>
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Kayıtlı kartların</p>
      <ul className="mt-3 space-y-2">
        {cards.map((c) => (
          <li key={c.id} className="rounded-2xl border border-white/[0.08]">
            <button onClick={() => setOpen(open === c.id ? null : c.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" aria-expanded={open === c.id}>
              <span className="min-w-0">
                <span className="block truncate text-[15px] text-white/85">{c.title ?? (c.feelings.join(', ') || c.situation || 'Kart')}</span>
                <span className="text-[12px] text-white/35">{DATE.format(new Date(c.createdAt))}</span>
              </span>
              <span className={cn('text-white/35 transition', open === c.id && 'rotate-90')}>›</span>
            </button>
            {open === c.id && (
              <div className="space-y-2 border-t border-white/[0.06] px-4 py-3 text-[13.5px] leading-relaxed text-white/65">
                {c.situation && <p><span className="text-white/40">{c.kind === 'study' ? 'Başlangıç:' : 'Yaşadığım durum:'}</span> {c.situation}</p>}
                {c.kind === 'study' && c.note && <p><span className="text-white/40">Senin için netleşen:</span> {c.note}</p>}
                {c.reflection && <p><span className="text-white/40">Özet:</span> {c.reflection}</p>}
                {c.feelings.length > 0 && <p><span className="text-white/40">Duygular:</span> {c.feelings.join(', ')}</p>}
                {c.thought && <p><span className="text-white/40">Aklımdan geçen:</span> {c.thought}</p>}
                {c.kind !== 'study' && (c.matters.length > 0 || c.note) && <p><span className="text-white/40">Önemli olan:</span> {[...c.matters, c.note].filter(Boolean).join(', ')}</p>}
                {c.step && <p><span className="text-white/40">Adım:</span> {c.step}</p>}
                <button onClick={() => void remove(c.id)} className="pt-1 text-[12px] text-white/35 hover:text-red-300">Kartı sil</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
