'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { track } from '@/lib/analytics';
import type { MentorId } from '@/types';

/** lib/admin/ratings.ts → DOWN_REASONS ile aynı kimlikler. */
const REASONS: Array<[id: string, label: string]> = [
  ['alakasiz', 'Soruma cevap değil'],
  ['genel', 'Çok genel kaldı'],
  ['uzun', 'Çok uzun'],
  ['uslup', 'Üslubu rahatsız etti'],
  ['yanlis', 'Yanlış ya da uydurma bilgi'],
];

function send(payload: Record<string, string>) {
  // Sonuç kullanıcıyı ilgilendirmez; hata sessizce yutulur.
  void fetch('/api/v1/rate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true }).catch(() => {});
}

/**
 * "İşine yaradı mı?" — 👍/👎. 👎 sonrası isteğe bağlı neden sorulur.
 * Cevap başına bir kez oy verilir; metin sunucuya gönderilmez.
 */
export function RateAnswer({ mentorId, source, className }: { mentorId: MentorId; source: 'answer' | 'chat' | 'daily'; className?: string }) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [reasonSent, setReasonSent] = useState(false);

  const cast = (v: 'up' | 'down') => {
    if (vote) return;
    setVote(v);
    send({ mentorId, value: v });
    track('answer_rated', { mentor: mentorId, value: v, source });
  };

  const giveReason = (id: string) => {
    setReasonSent(true);
    send({ mentorId, value: 'reason', reason: id });
  };

  const btn = 'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:cursor-default';

  return (
    <div className={cn('text-xs', className)}>
      <div className="flex items-center gap-2">
        <span className="text-white/50">{vote ? 'Teşekkürler!' : 'İşine yaradı mı?'}</span>
        <button
          onClick={() => cast('up')}
          disabled={!!vote}
          aria-label="İşime yaradı"
          aria-pressed={vote === 'up'}
          className={cn(btn, vote === 'up' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-white/55 hover:text-white', vote && vote !== 'up' && 'opacity-40')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 10v12M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 8a2 2 0 0 1-2 1.7H7V10l4.3-7.4A1.9 1.9 0 0 1 15 5.9z" /></svg>
        </button>
        <button
          onClick={() => cast('down')}
          disabled={!!vote}
          aria-label="İşime yaramadı"
          aria-pressed={vote === 'down'}
          className={cn(btn, vote === 'down' ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-white/10 text-white/55 hover:text-white', vote && vote !== 'down' && 'opacity-40')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 14V2M9 18.1 10 14H4.2a2 2 0 0 1-2-2.3l1.4-8A2 2 0 0 1 5.6 2H17v12l-4.3 7.4A1.9 1.9 0 0 1 9 18.1z" /></svg>
        </button>
      </div>
      {vote === 'down' && !reasonSent && (
        <div className="mt-2 flex flex-wrap gap-1.5 animate-fade-in" role="group" aria-label="Neden işine yaramadı?">
          {REASONS.map(([id, label]) => (
            <button key={id} onClick={() => giveReason(id)} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/65 transition-colors hover:border-white/25 hover:text-white">
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
