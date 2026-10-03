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
import type { MentorId, MentorResponseState, StreamEvent } from '@/types';

interface Props extends MentorStreamHandlers {
  mentorIds: MentorId[];
  question: string;
  onSelect: (mentorId: MentorId, response: string) => void;
  onBack: () => void;
}

export function CompareView({ mentorIds, question, onSelect, onBack, onQuota, onAuthRequired, onQuotaExceeded }: Props) {
  const [states, setStates] = useState<Record<string, MentorResponseState>>(() =>
    Object.fromEntries(mentorIds.map((id) => [id, { status: 'pending', content: '' }])),
  );
  const [crisis, setCrisis] = useState<string | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  /** Telefonda tek seferde bir cevap gösterilir (sekmeler); geniş ekranda hepsi yan yana. */
  const [tab, setTab] = useState<MentorId>(mentorIds[0]!);
  const { start } = useSSEStream<StreamEvent>();
  const started = useRef(false);
  const handlers = useRef({ onQuota, onAuthRequired, onQuotaExceeded });
  handlers.current = { onQuota, onAuthRequired, onQuotaExceeded };

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void start({
      url: '/api/v1/mentors/respond',
      body: { question, mentorIds },
      onEvent: (ev) => {
        if (ev.type === 'quota') return handlers.current.onQuota(ev.remaining);
        if (ev.type === 'crisis') return setCrisis(ev.message);
        if (ev.type === 'badges') return announceBadges(ev.ids);
        const mid = ev.mentorId;
        setStates((prev) => {
          const cur = prev[mid] ?? { status: 'pending', content: '' };
          if (ev.type === 'start') return { ...prev, [mid]: { ...cur, status: 'pending' } };
          if (ev.type === 'delta') return { ...prev, [mid]: { ...cur, status: 'streaming', content: cur.content + ev.text } };
          if (ev.type === 'end') return { ...prev, [mid]: { ...cur, status: 'completed' } };
          if (ev.type === 'error') return { ...prev, [mid]: { ...cur, status: 'error', error: ev.message } };
          return prev;
        });
      },
      onError: (e) => {
        if (!routeStreamError(e, handlers.current)) setFatal(e.message);
      },
    });
  }, [mentorIds, question, start]);

  const doneCount = Object.values(states).filter((s) => s.status === 'completed' || s.status === 'error').length;

  return (
    <div className="mx-auto w-full max-w-content px-5 py-6 sm:py-14">
      <div className="text-center animate-fade-up">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Sorun</p>
        <h1 className="mx-auto mt-2 max-w-3xl font-display text-[clamp(1.25rem,3.4vw,2rem)] leading-snug text-white/90 text-balance sm:mt-3">
          “{question}”
        </h1>
        {!crisis && !fatal && (
          <div className="mx-auto mt-5 flex max-w-xs items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300 transition-[width] duration-700 ease-out-expo"
                style={{ width: `${(doneCount / mentorIds.length) * 100}%` }}
              />
            </div>
            <span className="text-[11px] tabular-nums text-white/40">{doneCount}/{mentorIds.length}</span>
          </div>
        )}
      </div>

      {crisis ? (
        <CrisisNotice message={crisis} onBack={onBack} />
      ) : fatal ? (
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-red-500/25 bg-red-500/[0.07] p-5 text-center text-sm text-red-200/90 animate-fade-up">
          {fatal}
          <div className="mt-4"><button onClick={onBack} className="btn-secondary !py-2 text-sm">Geri dön</button></div>
        </div>
      ) : (
        <>
        {mentorIds.length > 1 && (
          <div className="sticky top-[60px] z-20 -mx-5 mt-5 flex gap-1.5 overflow-x-auto bg-ink-0/85 px-5 py-2 backdrop-blur-md md:hidden" role="tablist" aria-label="Mentor cevapları">
            {mentorIds.map((mid) => {
              const m = getActiveMentor(mid);
              const a = getAccent(m.accentColor);
              const st = states[mid];
              const busy = st?.status === 'pending' || st?.status === 'streaming';
              const on = tab === mid;
              return (
                <button
                  key={mid}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(mid)}
                  className={cn('flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5 text-[13px] transition-colors', on ? 'bg-white/[0.06]' : 'border-transparent text-white/55')}
                  style={on ? { borderColor: a.border, color: a.text } : undefined}
                >
                  <span className="relative h-6 w-6 overflow-hidden rounded-full border" style={{ borderColor: a.hex }}>
                    <Image src={m.portraitUrl} alt="" fill sizes="24px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
                  </span>
                  {m.shortName}
                  {busy && <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: a.hex }} aria-label="yazıyor" />}
                  {st?.status === 'completed' && !on && <span className="text-[10px] text-white/40">✓</span>}
                </button>
              );
            })}
          </div>
        )}
        <div
          className={cn(
            'mt-4 grid gap-5 md:mt-10',
            mentorIds.length <= 2 ? 'mx-auto max-w-4xl md:grid-cols-2' : mentorIds.length === 3 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-4',
          )}
        >
          {mentorIds.map((mid, i) => {
            const m = getActiveMentor(mid);
            const a = getAccent(m.accentColor);
            const st = states[mid] ?? { status: 'pending', content: '' };
            const active = st.status === 'pending' || st.status === 'streaming';

            return (
              <article
                key={mid}
                className={cn('glass relative min-h-[260px] flex-col overflow-hidden rounded-3xl animate-fade-up md:flex md:min-h-[320px]', active && 'glow-border', tab === mid || mentorIds.length === 1 ? 'flex' : 'hidden')}
                style={{ animationDelay: `${i * 90}ms`, '--accent': a.hex } as React.CSSProperties}
              >
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${a.hex}, transparent)` }} />
                <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full blur-3xl opacity-70" style={{ background: a.glow }} />

                <div className="relative flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border-2" style={{ borderColor: a.hex }}>
                      <Image src={m.portraitUrl} alt={m.name} fill sizes="44px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base" style={{ color: a.text }}>{m.name}</h3>
                      <p className="truncate text-[10px] uppercase tracking-[0.14em] text-white/40">{m.title}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex-1 text-[14.5px] leading-[1.75] text-white/75" aria-live="polite">
                    {st.status === 'pending' && (
                      <div className="space-y-2.5" aria-hidden="true">
                        {[100, 92, 85, 96, 60].map((w, j) => (
                          <div key={j} className="skeleton h-2.5" style={{ width: `${w}%`, animationDelay: `${j * 0.1 + i * 0.15}s` }} />
                        ))}
                      </div>
                    )}
                    {(st.status === 'streaming' || st.status === 'completed' || (st.status === 'error' && st.content)) && (
                      <p className={cn('whitespace-pre-wrap', st.status === 'streaming' && 'streaming-cursor')}>{st.content}</p>
                    )}
                    {st.status === 'error' && (
                      <p className="mt-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs text-red-200/80">
                        {st.error ?? 'Bir hata oluştu'}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 border-t border-white/[0.06] pt-4">
                    {st.status === 'completed' && <RateAnswer mentorId={mid} source="answer" className="mb-3" />}
                    {st.status === 'completed' ? (
                      <div className="flex gap-2">
                      <button
                        onClick={() => onSelect(mid, st.content)}
                        className="group/btn flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 animate-fade-in"
                        style={{ background: a.bg, borderColor: a.border, color: a.text }}
                      >
                        {m.shortName} ile devam et
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover/btn:translate-x-0.5" aria-hidden="true">
                          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <ShareCardButton data={{ source: 'answer', mentorId: mid, question, answer: st.content }} compact />
                      </div>
                    ) : active ? (
                      <div className="flex items-center justify-center gap-2 py-2.5 text-xs text-white/40">
                        <TypingDots color={a.hex} />
                        {st.status === 'pending' ? 'düşünüyor' : 'yazıyor'}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        </>
      )}

      {!crisis && (
        <div className="mt-10 text-center">
          <button onClick={onBack} className="btn-ghost text-sm">← Soruyu değiştir</button>
        </div>
      )}
    </div>
  );
}
