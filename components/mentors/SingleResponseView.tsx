'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { getActiveMentor, getAccent } from '@/lib/mentors/metadata';
import { routeStreamError, useSSEStream, type MentorStreamHandlers } from '@/lib/useSSEStream';
import { TypingDots } from '@/components/ui/TypingDots';
import { CrisisNotice } from '@/components/mentors/CrisisNotice';
import { cn } from '@/lib/cn';
import { ShareCardButton } from '@/components/share/ShareCardDialog';
import { RateAnswer } from '@/components/shared/RateAnswer';
import { announceBadges } from '@/components/shared/BadgeToaster';
import type { MentorId, StreamEvent } from '@/types';

interface Props extends MentorStreamHandlers {
  mentorId: MentorId;
  question: string;
  cachedResponse?: string;
  onContinue: (response: string) => void;
  onBack: () => void;
}

export function SingleResponseView({
  mentorId,
  question,
  cachedResponse,
  onContinue,
  onBack,
  onQuota,
  onAuthRequired,
  onQuotaExceeded,
}: Props) {
  const mentor = getActiveMentor(mentorId);
  const accent = getAccent(mentor.accentColor);
  const [content, setContent] = useState(cachedResponse ?? '');
  const [done, setDone] = useState(!!cachedResponse);
  const [error, setError] = useState<string | null>(null);
  const [crisis, setCrisis] = useState<string | null>(null);
  const { start } = useSSEStream<StreamEvent>();
  const started = useRef(!!cachedResponse);
  const handlers = useRef({ onQuota, onAuthRequired, onQuotaExceeded });
  handlers.current = { onQuota, onAuthRequired, onQuotaExceeded };

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let text = '';
    void start({
      url: '/api/v1/mentors/respond',
      body: { question, mentorIds: [mentorId] },
      onEvent: (ev) => {
        if (ev.type === 'quota') handlers.current.onQuota(ev.remaining);
        else if (ev.type === 'delta') { text += ev.text; setContent(text); }
        else if (ev.type === 'end') setDone(true);
        else if (ev.type === 'error') setError(ev.message);
        else if (ev.type === 'crisis') setCrisis(ev.message);
        else if (ev.type === 'badges') announceBadges(ev.ids);
      },
      onError: (e) => {
        if (!routeStreamError(e, handlers.current)) setError(e.message);
      },
      onComplete: () => setDone(true),
    });
  }, [mentorId, question, start]);

  const thinking = !content && !error && !crisis;
  const streaming = !!content && !done;

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-10 sm:py-14" style={{ '--accent': accent.hex } as React.CSSProperties}>
      {/* Soru */}
      <div className="text-center animate-fade-up">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Sorun</p>
        <h1 className="mx-auto mt-3 max-w-2xl font-display text-[clamp(1.4rem,3.4vw,2rem)] leading-snug text-white/90 text-balance">
          “{question}”
        </h1>
      </div>

      {crisis ? (
        <CrisisNotice message={crisis} onBack={onBack} />
      ) : (
        <article
          className={cn('glass relative mt-10 overflow-hidden rounded-3xl animate-fade-up', (thinking || streaming) && 'glow-border')}
          style={{ animationDelay: '120ms' }}
        >
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent.hex}, transparent)` }} />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-2/3 -translate-x-1/2 rounded-full blur-3xl" style={{ background: accent.glow }} />

          <div className="relative p-6 sm:p-9">
            {/* Mentor başlığı */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {thinking && (
                  <span className="absolute -inset-1.5 rounded-full animate-breathe" style={{ background: `radial-gradient(circle, ${accent.glow}, transparent 70%)` }} />
                )}
                <div className="relative h-14 w-14 overflow-hidden rounded-full border-2" style={{ borderColor: accent.hex }}>
                  <Image src={mentor.portraitUrl} alt={mentor.name} fill sizes="56px" className="object-cover" style={{ objectPosition: mentor.portraitPosition ?? 'center' }} />
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-xl" style={{ color: accent.text }}>{mentor.name}</h2>
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">{mentor.title}</p>
              </div>
              <div className="ml-auto text-xs text-white/40">
                {thinking && <span className="inline-flex items-center gap-2">düşünüyor <TypingDots color={accent.hex} /></span>}
                {streaming && <span>yazıyor…</span>}
                {done && content && (
                  <span className="inline-flex items-center gap-1.5 text-white/45 animate-fade-in">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8l3.5 3.5L13 5" stroke={accent.hex} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    tamamlandı
                  </span>
                )}
              </div>
            </div>

            {/* Cevap */}
            <div className="mt-7 min-h-[140px]" aria-live="polite">
              {thinking && (
                <div className="space-y-3" aria-hidden="true">
                  {[100, 94, 88, 62].map((w, i) => (
                    <div key={i} className="skeleton h-3" style={{ width: `${w}%`, animationDelay: `${i * 0.12}s` }} />
                  ))}
                </div>
              )}
              {content && (
                <p className={cn('whitespace-pre-wrap font-display text-[19px] leading-[1.75] text-white/85 sm:text-[21px]', streaming && 'streaming-cursor')}>
                  {content}
                </p>
              )}
              {error && (
                <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/[0.07] p-4 text-sm text-red-200/90 animate-fade-up">
                  {error}
                </div>
              )}
            </div>
          </div>
        </article>
      )}

      {/* Eylemler */}
      <div className="mt-8 min-h-[52px]">
        {done && content && !crisis && (
          <RateAnswer mentorId={mentorId} source="answer" className="mb-5 flex flex-col items-center animate-fade-up" />
        )}
        {done && content && !crisis && (
          <div className="flex flex-col items-center justify-center gap-3 animate-fade-up sm:flex-row">
            <button onClick={() => onContinue(content)} className="btn-primary w-full sm:w-auto">
              {mentor.shortName} ile sohbete devam et
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <ShareCardButton data={{ source: 'answer', mentorId, question, answer: content }} className="w-full !py-3 sm:w-auto" />
            <button onClick={onBack} className="btn-secondary w-full sm:w-auto">Başka bir mentora sor</button>
          </div>
        )}
        {error && !content && (
          <div className="flex justify-center animate-fade-up">
            <button onClick={onBack} className="btn-secondary">Mentor seçimine dön</button>
          </div>
        )}
      </div>
    </div>
  );
}
