'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Message } from '@/types';

const NOTE_MAX = 200;

/**
 * Sohbet başlığında "Hatırla": kişinin kendi mesajlarından Mentoriva bir iki
 * not önerir ya da kişi kendisi yazar. Hiçbir şey onaylanmadan kaydedilmez;
 * kaydedilenler Yolculuğum → Hafızam'da görünür.
 */
export function RememberButton({ messages }: { messages: Message[] }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [own, setOwn] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');
  const [saved, setSaved] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const suggest = async () => {
    setState('loading');
    try {
      const userMessages = messages.filter((m) => m.role === 'user' && m.content.trim()).map((m) => m.content);
      const res = await fetch('/api/v1/notes/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: userMessages }) });
      const data = (await res.json().catch(() => null)) as { notes?: string[] } | null;
      if (!res.ok) return setState('error');
      setItems(data?.notes ?? []);
      setState(data?.notes?.length ? 'idle' : 'empty');
    } catch {
      setState('error');
    }
  };

  const save = async (text: string, source: 'chat' | 'self') => {
    const t = text.trim();
    if (!t) return;
    const res = await fetch('/api/v1/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: t, source }) });
    if (res.ok) setSaved((s) => [...s, t]);
    else setState('error');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-white/60 transition hover:border-white/25 hover:text-white"
        aria-expanded={open}
        aria-label="Hatırla: mentorların sonraki sohbetlerde bilmesini istediğin not"
        title="Hatırla"
      >
        <span className="sm:hidden" aria-hidden="true">✦</span>
        <span className="hidden sm:inline">Hatırla</span>
      </button>
      {open && (
        <div className="fixed inset-x-4 top-20 z-40 rounded-2xl border border-white/10 bg-ink-50/[0.98] p-4 text-left shadow-2xl backdrop-blur-xl animate-fade-in sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[22rem]">
          <p className="text-sm text-white/85">Sonraki sohbetlerde neyi bilsinler?</p>
          <p className="mt-1 text-[12px] leading-relaxed text-white/45">Yalnızca onayladığın notlar hatırlanır. Hepsini Yolculuğum&apos;da görüp silebilirsin.</p>

          {items.map((n, i) => (
            <div key={i} className="mt-3 rounded-xl border border-white/[0.08] p-2.5">
              <textarea
                value={n}
                onChange={(e) => setItems((p) => p.map((x, j) => (j === i ? e.target.value.slice(0, NOTE_MAX) : x)))}
                rows={2}
                className="w-full resize-none bg-transparent text-[13.5px] leading-relaxed text-white/85 focus:outline-none"
                aria-label="Önerilen not"
              />
              <button onClick={() => void save(n, 'chat')} disabled={saved.includes(n.trim())} className="mt-1 text-[12px] text-brand-300 disabled:text-white/40">
                {saved.includes(n.trim()) ? 'Hafızana eklendi ✓' : 'Hafızama ekle'}
              </button>
            </div>
          ))}

          {items.length === 0 && (
            <button onClick={() => void suggest()} disabled={state === 'loading'} className="btn-secondary mt-3 w-full justify-center text-sm">
              {state === 'loading' ? 'Bakılıyor…' : 'Mentoriva önersin'}
            </button>
          )}
          {state === 'empty' && <p className="mt-2 text-[12px] text-white/45">Bu sohbette hatırlanacak bir şey görmedim; istersen kendin yaz.</p>}
          {state === 'error' && <p className="mt-2 text-[12px] text-red-300/90">Şu an olmadı; biraz sonra tekrar dene.</p>}

          <div className="mt-3 flex gap-2">
            <input
              value={own}
              onChange={(e) => setOwn(e.target.value.slice(0, NOTE_MAX))}
              placeholder="Ya da kendin yaz…"
              className="input-field min-w-0 flex-1 !py-2 text-base"
              aria-label="Kendi notun"
            />
            <button onClick={() => { void save(own, 'self'); setOwn(''); }} disabled={!own.trim()} className="text-sm text-brand-300 disabled:text-white/30">Ekle</button>
          </div>
          <Link href="/yolculugum#hafiza" className="mt-3 block text-[12px] text-white/40 hover:text-white/70">Hafızamı gör →</Link>
        </div>
      )}
    </div>
  );
}
