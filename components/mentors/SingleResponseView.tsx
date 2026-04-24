'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { getActiveMentor, getAccent } from '@/lib/mentors/metadata';
import { useSSEStream } from '@/lib/useSSEStream';
import type { MentorId, StreamEvent } from '@/types';

interface Props {
  mentorId: MentorId;
  question: string;
  cachedResponse?: string;
  onContinue: (response: string) => void;
  onBack: () => void;
  onResponseComplete?: () => void;
}

export function SingleResponseView({ mentorId, question, cachedResponse, onContinue, onBack, onResponseComplete }: Props) {
  const mentor = getActiveMentor(mentorId);
  const accent = getAccent(mentor.accentColor);
  const [content, setContent] = useState(cachedResponse ?? '');
  const [done, setDone] = useState(!!cachedResponse);
  const [error, setError] = useState<string | null>(null);
  const { start } = useSSEStream<StreamEvent>();
  const started = useRef(!!cachedResponse);
  const tokenConsumed = useRef(!!cachedResponse);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let text = '';
    void start({
      url: '/api/v1/mentors/respond',
      body: { question, mentorIds: [mentorId] },
      onEvent: (ev) => {
        if (ev.type === 'delta' && 'text' in ev) { text += ev.text; setContent(text); }
        else if (ev.type === 'end') {
          setDone(true);
          // Cevap tamamlandı — token'ı şimdi tüket
          if (!tokenConsumed.current && onResponseComplete) {
            tokenConsumed.current = true;
            onResponseComplete();
          }
        }
        else if (ev.type === 'error' && 'message' in ev) setError(ev.message);
        else if (ev.type === 'crisis') setError(ev.message);
      },
      onError: (e) => setError(e.message),
      onComplete: () => {
        if (!done) setDone(true);
        if (!tokenConsumed.current && onResponseComplete) {
          tokenConsumed.current = true;
          onResponseComplete();
        }
      },
    });
  }, [mentorId, question, start, done, onResponseComplete]);

  return (
    <div className="mx-auto max-w-[680px] px-5 py-10 sm:py-14 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl overflow-hidden border-[1.5px] relative flex-shrink-0" style={{ borderColor: accent.border }}>
          <Image src={mentor.portraitUrl} alt={mentor.name} fill style={{objectPosition:mentor.portraitPosition||"center"}} className="object-cover" sizes="44px" />
        </div>
        <div>
          <h2 className="font-display text-lg" style={{ color: accent.hex }}>{mentor.name}</h2>
          <p className="text-[10px] text-white/35 uppercase tracking-wider">{mentor.title}</p>
        </div>
      </div>

      {/* Thinking */}
      {!content && !error && (
        <div className="flex items-center gap-2 text-white/30 text-sm ml-[56px]">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          <span>{mentor.name.split(' ')[0]} düşünüyor…</span>
        </div>
      )}

      {/* Response */}
      {content && (
        <div
          className="text-[15px] leading-[1.75] text-white/90 border-l-2 pl-5 ml-[22px] mt-4"
          style={{ borderColor: accent.border }}
        >
          <span className={!done ? 'streaming-cursor' : ''}>{content}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 rounded-card bg-red-500/10 border border-red-500/30 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Actions */}
      {done && content && (
        <div className="flex gap-3 mt-6 ml-[56px] animate-fade-up">
          <button onClick={() => onContinue(content)} className="btn-primary text-sm">
            Devam et →
          </button>
          <button onClick={onBack} className="btn-secondary text-sm">
            Başka mentora sor
          </button>
        </div>
      )}
    </div>
  );
}
