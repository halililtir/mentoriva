'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getActiveMentor, getAccent } from '@/lib/mentors/metadata';
import { track } from '@/lib/analytics';
import { checkBadges } from '@/components/shared/BadgeToaster';
import { cn } from '@/lib/cn';
import type { MentorId } from '@/types';
import { genitive } from '@/lib/tr';

export interface ShareSource {
  source: 'answer' | 'daily';
  mentorId: MentorId;
  question: string;
  answer: string;
}

/**
 * Cevaptan karta basılabilecek cümleleri çıkarır: alıntı bloğu ve kapanış
 * kalıpları hariç, 25–240 karakter arası cümleler.
 */
export function candidateSentences(answer: string): string[] {
  const body = answer
    .split('\n')
    .filter((l) => !/^[“"]/.test(l.trim()) && !/^—/.test(l.trim()))
    .join(' ');
  const sentences = body
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25 && s.length <= 240 && !/^Sağlıcakla kal/.test(s));
  return [...new Set(sentences)];
}

/** En "paylaşılabilir" cümleyi tahmin eder: orta uzunlukta, tercihen son kısımda. */
function bestIndex(sentences: string[]): number {
  let best = 0;
  let bestScore = -Infinity;
  sentences.forEach((s, i) => {
    const lenScore = -Math.abs(s.length - 110) / 40;
    const posScore = (i / Math.max(1, sentences.length - 1)) * 0.8;
    const questionBonus = s.endsWith('?') ? 0.4 : 0;
    const score = lenScore + posScore + questionBonus;
    if (score > bestScore) { bestScore = score; best = i; }
  });
  return best;
}

export function ShareCardButton({ data, className, compact }: { data: ShareSource; className?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const accent = getAccent(getActiveMentor(data.mentorId).accentColor);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-all duration-300 hover:-translate-y-0.5',
          compact && '!px-2.5 !py-1.5 text-xs',
          className,
        )}
        style={{ borderColor: accent.border, color: accent.text, background: 'rgb(var(--fg) / 0.03)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
        </svg>
        {compact ? 'Paylaş' : 'Kart olarak paylaş'}
      </button>
      {/* Portal: üst elemanlardaki backdrop-filter sabit konumlu pencereyi kendi içine hapsetmesin */}
      {open && createPortal(<ShareCardDialog data={data} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function ShareCardDialog({ data, onClose }: { data: ShareSource; onClose: () => void }) {
  const mentor = getActiveMentor(data.mentorId);
  const accent = getAccent(mentor.accentColor);
  const sentences = useMemo(() => candidateSentences(data.answer), [data.answer]);
  const [selected, setSelected] = useState(() => bestIndex(sentences));
  const [image, setImage] = useState<{ url: string; blob: Blob } | null>(null);
  const [state, setState] = useState<'pick' | 'loading' | 'ready' | 'error'>('pick');
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape ile kapat, açıkken sayfa kaymasın
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => () => { if (image) URL.revokeObjectURL(image.url); }, [image]);

  const create = async () => {
    const highlight = sentences[selected];
    if (!highlight) return;
    setState('loading');
    setError('');
    try {
      const res = await fetch('/api/v1/share/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: data.source, mentorId: data.mentorId, question: data.question, highlight }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.token) throw new Error(body.error ?? 'Kart oluşturulamadı');
      // İkinci adım: imzalı izinle görseli çizdir (Edge)
      const img = await fetch('/api/v1/share/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: body.token }),
      });
      if (!img.ok) {
        const err = await img.json().catch(() => ({}));
        throw new Error(err.error ?? 'Kart görseli oluşturulamadı');
      }
      const blob = await img.blob();
      setImage({ url: URL.createObjectURL(blob), blob });
      setState('ready');
      checkBadges();
      track('share_card_created', { mentor: data.mentorId, source: data.source });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kart oluşturulamadı');
      setState('error');
    }
  };

  const fileName = `mentoriva-${data.mentorId}.png`;

  const share = async () => {
    if (!image) return;
    const file = new File([image.blob], fileName, { type: 'image/png' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Mentoriva', text: `${genitive(mentor.shortName)} cevabı` });
        track('share_card_shared', { mentor: data.mentorId });
        return;
      }
    } catch {
      return; // kullanıcı paylaşımı iptal etti
    }
    download();
  };

  const download = () => {
    if (!image) return;
    const a = document.createElement('a');
    a.href = image.url;
    a.download = fileName;
    a.click();
    track('share_card_downloaded', { mentor: data.mentorId });
  };

  const tooShort = data.question.length > 200;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in sm:items-center" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Paylaşım kartı oluştur"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="glass relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl !bg-ink-50 p-6 outline-none animate-fade-up sm:rounded-3xl sm:p-7"
      >
        <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white" aria-label="Kapat">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>

        <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: accent.text }}>Paylaşım kartı</p>
        <h2 className="mt-1 font-display text-2xl">
          {state === 'ready' ? 'Kartın hazır' : 'Karta hangi cümle girsin?'}
        </h2>

        {state === 'ready' && image ? (
          <div className="mt-5 animate-scale-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="Paylaşım kartı ön izlemesi" className="mx-auto max-h-[52dvh] rounded-2xl border border-white/10 shadow-2xl" />
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button onClick={share} className="btn-primary flex-1">Paylaş</button>
              <button onClick={download} className="btn-secondary flex-1">İndir</button>
            </div>
            <button onClick={() => setState('pick')} className="mt-3 w-full text-center text-xs text-white/40 hover:text-white/70">
              Başka bir cümle seç
            </button>
          </div>
        ) : sentences.length === 0 ? (
          <p className="mt-4 text-sm text-white/50">Bu cevapta karta uygun bir cümle bulamadık.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-white/45">Karta, sorunla birlikte bu cümle ve varsa mentorun kaynaklı alıntısı basılır.</p>
            <div className="mt-5 space-y-2" role="radiogroup">
              {sentences.slice(0, 8).map((s, i) => (
                <button
                  key={s}
                  role="radio"
                  aria-checked={selected === i}
                  onClick={() => setSelected(i)}
                  className={cn(
                    'w-full rounded-2xl border px-4 py-3 text-left font-display text-[15px] leading-snug transition-all duration-300',
                    selected === i ? 'text-white' : 'border-white/[0.07] text-white/55 hover:border-white/15 hover:text-white/80',
                  )}
                  style={selected === i ? { borderColor: accent.hex, background: accent.bg } : undefined}
                >
                  {s}
                </button>
              ))}
            </div>
            {tooShort && <p className="mt-3 text-xs text-amber-300/80">Soru uzun olduğu için kartta kısaltılarak gösterilecek.</p>}
            {state === 'error' && <p className="mt-3 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-3 py-2 text-sm text-red-200/90">{error}</p>}
            <button onClick={create} disabled={state === 'loading'} className="btn-primary mt-5 w-full">
              {state === 'loading' ? 'Kart hazırlanıyor…' : 'Kartı oluştur'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
