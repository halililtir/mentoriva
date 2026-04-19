'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { getActiveMentor, getAccent } from '@/lib/mentors/metadata';
import { useSSEStream } from '@/lib/useSSEStream';
import { cn } from '@/lib/cn';
import type { MentorId, StreamEvent, MentorResponseState } from '@/types';

interface Props {
  mentorIds: MentorId[];
  question: string;
  onSelect: (mentorId: MentorId, response: string) => void;
  onBack: () => void;
}

export function CompareView({ mentorIds, question, onSelect, onBack }: Props) {
  const [states, setStates] = useState<Record<string, MentorResponseState>>(() => {
    const s: Record<string, MentorResponseState> = {};
    mentorIds.forEach((id) => { s[id] = { status: 'pending', content: '' }; });
    return s;
  });
  const { start } = useSSEStream<StreamEvent>();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void start({
      url: '/api/v1/mentors/respond',
      body: { question, mentorIds },
      onEvent: (ev) => {
        if (!('mentorId' in ev)) return;
        const mid = ev.mentorId;
        setStates((prev) => {
          const cur = prev[mid] ?? { status: 'pending', content: '' };
          if (ev.type === 'start') return { ...prev, [mid]: { ...cur, status: 'streaming' } };
          if (ev.type === 'delta') return { ...prev, [mid]: { ...cur, status: 'streaming', content: cur.content + ev.text } };
          if (ev.type === 'end') return { ...prev, [mid]: { ...cur, status: 'completed' } };
          if (ev.type === 'error') return { ...prev, [mid]: { ...cur, status: 'error', error: ev.message } };
          return prev;
        });
      },
    });
  }, [mentorIds, question, start]);

  return (
    <div className="mx-auto max-w-content px-5 py-10 sm:py-12 animate-fade-up">
      <div className="text-center mb-8">
        <p className="text-[11px] uppercase tracking-wider text-white/30 mb-2">Sorunuz</p>
        <h1 className="font-display text-xl sm:text-2xl text-balance">{'\u201c'}{question}{'\u201d'}</h1>
        <button onClick={onBack} className="btn-ghost text-xs mt-3">Soruyu değiştir</button>
      </div>

      <div className={cn(
        'grid gap-4',
        mentorIds.length <= 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      )}>
        {mentorIds.map((mid, i) => {
          const m = getActiveMentor(mid);
          const a = getAccent(m.accentColor);
          const st = states[mid] ?? { status: 'pending', content: '' };

          return (
            <article
              key={mid}
              className="rounded-2xl border overflow-hidden flex flex-col min-h-[280px] animate-fade-up"
              style={{ borderColor: a.border, background: 'rgba(15,21,40,0.6)', animationDelay: `${i * 0.08}s`, animationFillMode: 'both' }}
            >
              <div className="h-[2px] rounded-t-2xl" style={{ background: a.hex }} />
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden relative flex-shrink-0 border" style={{ borderColor: a.border }}>
                    <Image src={m.portraitUrl} alt={m.name} fill style={{objectPosition:m.portraitPosition||"center"}} className="object-cover" sizes="32px" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm" style={{ color: a.hex }}>{m.name}</h3>
                    <p className="text-[8px] uppercase tracking-wider text-white/35">{m.title}</p>
                  </div>
                </div>

                <div className="flex-1 text-[13px] leading-relaxed text-white/70 min-h-[140px]">
                  {st.status === 'pending' && (
                    <div className="space-y-2">
                      {[100, 92, 85, 70].map((w, i) => (
                        <div key={i} className="h-2.5 rounded bg-white/[0.04] animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  )}
                  {(st.status === 'streaming' || st.status === 'completed') && (
                    <span className={st.status === 'streaming' ? 'streaming-cursor' : ''}>{st.content}</span>
                  )}
                  {st.status === 'error' && (
                    <p className="text-red-300/70 text-xs">{st.error ?? 'Bir hata oluştu'}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.06] mt-auto">
                  {st.status === 'completed' && (
                    <button
                      onClick={() => onSelect(mid, st.content)}
                      className="w-full py-2 rounded-xl text-xs font-medium transition-colors"
                      style={{ background: a.bg, borderColor: a.border, color: a.hex, border: '1px solid' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = a.bgHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = a.bg; }}
                    >
                      Bununla devam et →
                    </button>
                  )}
                  {(st.status === 'pending' || st.status === 'streaming') && (
                    <div className="flex items-center justify-center gap-1.5 py-2 text-white/25 text-[11px]">
                      <span className="w-1 h-1 rounded-full bg-brand-500 animate-pulse" />
                      <span>{st.status === 'pending' ? 'Düşünüyor' : 'Yazıyor'}…</span>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
