'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics';
import type { MentorId, Message } from '@/types';

/** Ücretsiz üyelikte saklanabilecek sohbet sayısı (sunucuda lib/chats.ts → SAVED_CHAT_LIMIT). */
export const FREE_CHAT_SLOTS = 5;

/**
 * Kayıt için mesajları soru-cevap çiftlerine indirger: art arda iki kullanıcı
 * mesajında (ör. kriz uyarısı ya da hata sonrası) sonuncusu kalır, cevapsız son
 * mesaj atılır. Sunucu sırayla değişen roller ister.
 */
export function toSavable(messages: Message[]): Array<Pick<Message, 'role' | 'content'>> {
  const out: Array<Pick<Message, 'role' | 'content'>> = [];
  // Konuk mentorun "başka bir bakış" mesajları kaydedilmez (kayıt sırayla değişen soru-cevap ister)
  for (const { role, content, guest } of messages) {
    if (!content.trim() || guest) continue;
    const last = out[out.length - 1];
    if (last && last.role === role) out[out.length - 1] = { role, content };
    else if (out.length > 0 || role === 'user') out.push({ role, content });
  }
  if (out[out.length - 1]?.role === 'user') out.pop();
  return out;
}

interface Props {
  mentorId: MentorId;
  messages: Message[];
  savedId: string | null;
  onSaved: (id: string, syncedCount: number) => void;
}

/** Sohbet başlığındaki "Kaydet" düğmesi; sınır dolunca bilgilendirme açılır. */
export function ChatSave({ mentorId, messages, savedId, onSaved }: Props) {
  const [state, setState] = useState<'idle' | 'saving' | 'limit' | 'error'>('idle');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state !== 'limit' && state !== 'error') return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setState('idle');
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [state]);

  const save = async () => {
    if (savedId || state === 'saving') return;
    const payload = toSavable(messages);
    if (payload.length < 2) return;
    setState('saving');
    try {
      const res = await fetch('/api/v1/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId, messages: payload }),
      });
      const data = (await res.json().catch(() => ({}))) as { chat?: { id: string }; code?: string };
      if (res.ok && data.chat) {
        onSaved(data.chat.id, payload.length);
        setState('idle');
        track('chat_save', { mentor: mentorId });
      } else if (data.code === 'CHAT_LIMIT') {
        setState('limit');
        track('chat_save_limit', { mentor: mentorId });
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  };

  return (
    <div ref={ref} className="sm:relative">
      <button
        onClick={() => void save()}
        disabled={!!savedId || state === 'saving'}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 text-[11px] text-white/65 transition-colors hover:text-white disabled:cursor-default disabled:hover:text-white/65"
        aria-label={savedId ? 'Sohbet kaydedildi' : 'Sohbeti kaydet'}
        title={savedId ? 'Kaydedildi; yeni mesajlar da kayda eklenir' : 'Sohbeti hesabına kaydet'}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill={savedId ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={savedId ? 'text-brand-300' : undefined}>
          <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
        </svg>
        <span className="hidden sm:inline">{savedId ? 'Kaydedildi' : state === 'saving' ? 'Kaydediliyor…' : 'Kaydet'}</span>
      </button>

      {state === 'limit' && (
        <div role="dialog" aria-label="Kayıt alanı dolu" className="absolute inset-x-0 top-full z-30 mt-2 glass sm:inset-x-auto sm:right-0 sm:w-72 rounded-2xl !bg-ink-50 p-4 text-left animate-fade-down">
          <p className="text-sm font-medium text-white/90">Kayıt alanın dolu ({FREE_CHAT_SLOTS}/{FREE_CHAT_SLOTS})</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/65">
            Ücretsiz üyelikte en fazla {FREE_CHAT_SLOTS} sohbet saklayabilirsin. Sınırsız kayıt, yakında gelecek
            <b className="text-white/85"> Premium üyelikle</b> açılacak.
          </p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-white/65">Şimdilik eski bir sohbeti silerek yer açabilirsin; bu sohbet kaybolmaz, sekme açık kaldıkça burada durur.</p>
          <div className="mt-3 flex items-center gap-3">
            <Link href="/sohbetlerim" target="_blank" className="text-[12.5px] font-medium text-brand-300 hover:underline">Sohbetlerimi düzenle ↗</Link>
            <button onClick={() => setState('idle')} className="ml-auto text-[12px] text-white/50 hover:text-white/80">Kapat</button>
          </div>
        </div>
      )}
      {state === 'error' && (
        <div role="alert" className="absolute inset-x-0 top-full z-30 mt-2 glass sm:inset-x-auto sm:right-0 sm:w-60 rounded-2xl !bg-ink-50 p-3 text-[12.5px] text-white/70 animate-fade-down">
          Sohbet şu an kaydedilemedi. Birazdan tekrar dene.
        </div>
      )}
    </div>
  );
}
