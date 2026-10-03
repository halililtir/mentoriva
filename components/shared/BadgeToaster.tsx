'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BADGE_BY_ID } from '@/lib/badges-public';
import { useSession } from '@/lib/session';

const EVENT = 'mentoriva:badges';
const CHECK = 'mentoriva:badge-check';

/** Sunucuda (yolculuk, paylaşım, davet) kazanılmış olabilecek işaretleri sorgulatır. */
export function checkBadges(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHECK));
}

/** Yeni kazanılan işaretleri duyurur (SSE "badges" olayından çağrılır). */
export function announceBadges(ids: string[]): void {
  if (typeof window === 'undefined' || ids.length === 0) return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: ids }));
  // Görüldü olarak işaretle; bildirim zaten gösteriliyor
  void fetch('/api/v1/badges', { method: 'POST' }).catch(() => {});
}

/** Sayfanın altında beliren, kendiliğinden kapanan sakin bir kutlama. */
export function BadgeToaster() {
  const [queue, setQueue] = useState<string[]>([]);
  const { status } = useSession();

  // Giriş yapmış kullanıcının görmediği işaretler: açılışta ve checkBadges() çağrılınca
  useEffect(() => {
    if (status !== 'user') return;
    const check = () => {
      fetch('/api/v1/badges', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { unseen?: string[] } | null) => { if (d?.unseen?.length) announceBadges(d.unseen); })
        .catch(() => {});
    };
    check();
    window.addEventListener(CHECK, check);
    return () => window.removeEventListener(CHECK, check);
  }, [status]);

  useEffect(() => {
    const on = (e: Event) => setQueue((q) => [...q, ...((e as CustomEvent<string[]>).detail ?? [])]);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);

  const current = queue[0] ? BADGE_BY_ID[queue[0]] : null;

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), 9000);
    return () => clearTimeout(t);
  }, [current]);

  if (!current) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4" role="status" aria-live="polite">
      <div key={current.id} className="glass flex w-full max-w-md items-start gap-4 rounded-2xl !bg-ink-50 p-4 shadow-2xl animate-fade-up">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-500/40 bg-brand-500/10 text-xl text-brand-300" aria-hidden="true">
          {current.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-brand-300">Yeni bir işaret</p>
          <p className="mt-0.5 font-display text-lg text-white/95">{current.name}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-white/70">{current.meaning}</p>
          <Link href="/isaretlerim" className="mt-2 inline-block text-xs text-brand-300 hover:underline">İşaretlerimi gör →</Link>
        </div>
        <button onClick={() => setQueue((q) => q.slice(1))} className="text-white/50 hover:text-white" aria-label="Kapat">✕</button>
      </div>
    </div>
  );
}
