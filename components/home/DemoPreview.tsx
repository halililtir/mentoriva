'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { DEMO_SAMPLES } from '@/lib/home-content';
import { ACTIVE_MENTORS, getAccent } from '@/lib/mentors/metadata';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { SITE_HOST } from '@/lib/site';
import { cn } from '@/lib/cn';
import type { MentorId } from '@/types';

/** Mentorların farklı hızlarda "yazması" — aynı anda akan cevap hissi için. */
const SPEEDS = [1.25, 0.95, 1.1, 1.4];
const TICK_MS = 32;
const HOLD_MS = 4200;

/**
 * Hero'daki canlı ön izleme: örnek bir soru yazılır, dört mentorun cevabı
 * aynı anda akar, ardından sıradaki örneğe geçilir. Gerçek API çağrısı
 * yapılmaz; ziyaretçi ürünü denemeden önce nasıl çalıştığını görür.
 */
export function DemoPreview() {
  const reduced = usePrefersReducedMotion();
  const [sampleIdx, setSampleIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const sample = DEMO_SAMPLES[sampleIdx]!;
  const qLen = sample.question.length;
  // Örnekte cevabı olan mentorlar (hero dört mentorla sınırlı)
  const mentors = ACTIVE_MENTORS.filter((m) => sample.answers[m.id as MentorId]);
  const answerLen = (id: MentorId) => sample.answers[id]?.length ?? 0;
  const answerProgress = (k: number) => Math.max(0, Math.floor((progress - qLen - 8) * (SPEEDS[k] ?? 1)));
  const allDone = mentors.every((m, k) => answerProgress(k) >= answerLen(m.id as MentorId));

  // Ekran dışındayken animasyonu durdur
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(() => setSampleIdx((i) => (i + 1) % DEMO_SAMPLES.length), 7000);
      return () => clearTimeout(t);
    }
    if (!visible) return;
    if (allDone) {
      const t = setTimeout(() => {
        setSampleIdx((i) => (i + 1) % DEMO_SAMPLES.length);
        setProgress(0);
      }, HOLD_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setProgress((p) => p + 1), TICK_MS);
    return () => clearTimeout(t);
  }, [progress, allDone, reduced, visible]);

  const showAll = reduced;
  const questionText = showAll ? sample.question : sample.question.slice(0, progress);
  const typingQuestion = !showAll && progress < qLen;

  return (
    <div ref={ref} className="relative">
      <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_50%_30%,rgba(0,188,212,0.18),transparent_65%)] blur-2xl" />

      <div className="glass relative overflow-hidden rounded-2xl" role="img" aria-label={`Örnek: "${sample.question}" sorusuna dört mentorun cevabı`}>
        {/* Pencere çubuğu */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ml-3 flex-1 truncate rounded-md bg-white/[0.04] px-3 py-1 text-center text-[11px] text-white/35">{SITE_HOST}</span>
          <span className="rounded-full border border-brand-500/25 bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-300">
            Örnek
          </span>
        </div>

        <div className="p-4 sm:p-5" aria-hidden="true">
          {/* Soru */}
          <div className="rounded-xl border border-white/[0.08] bg-ink-0/50 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Senin sorun</p>
            <p className="mt-1 min-h-[1.5em] font-display text-[15px] text-white/90 sm:text-base">
              {questionText}
              {typingQuestion && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] bg-brand-400 animate-cursor-blink" />}
            </p>
          </div>

          {/* Cevaplar */}
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {mentors.map((m, k) => {
              const a = getAccent(m.accentColor);
              const full = sample.answers[m.id as MentorId] ?? '';
              const shown = showAll ? full.length : Math.min(full.length, answerProgress(k));
              const started = showAll || shown > 0;
              const streaming = !showAll && started && shown < full.length;
              const waiting = !showAll && !typingQuestion && !started;
              return (
                <div
                  key={m.id}
                  className={cn('relative min-h-[118px] overflow-hidden rounded-xl border p-3 transition-colors duration-500', streaming && 'glow-border')}
                  style={{ borderColor: started ? a.border : 'rgba(255,255,255,0.06)', background: started ? a.bg : 'rgba(255,255,255,0.015)', '--accent': a.hex } as React.CSSProperties}
                >
                  <div className="flex items-center gap-2">
                    <span className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-full border" style={{ borderColor: a.hex }}>
                      <Image src={m.portraitUrl} alt="" fill sizes="24px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
                    </span>
                    <span className="truncate text-[11px] font-medium" style={{ color: a.hex }}>{m.shortName}</span>
                  </div>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-white/70">
                    {full.slice(0, shown)}
                    {streaming && <span className="ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.12em] animate-cursor-blink" style={{ background: a.hex }} />}
                  </p>
                  {waiting && (
                    <div className="mt-1 space-y-1.5">
                      <div className="skeleton h-1.5 w-full" />
                      <div className="skeleton h-1.5 w-4/5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Alt: sohbete devam ipucu */}
          <div className={cn('mt-3 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 transition-opacity duration-700', allDone || showAll ? 'opacity-100' : 'opacity-0')}>
            <span className="text-[11px] text-white/45">Seni en çok düşündüren hangisi?</span>
            <span className="rounded-lg bg-brand-500/15 px-2.5 py-1 text-[11px] font-medium text-brand-300">Sohbete devam et →</span>
          </div>
        </div>
      </div>

      {/* Örnek seçici */}
      <div className="mt-4 flex justify-center gap-2">
        {DEMO_SAMPLES.map((s, i) => (
          <button
            key={s.question}
            onClick={() => { setSampleIdx(i); setProgress(0); }}
            className={cn('h-1.5 rounded-full transition-all duration-500', i === sampleIdx ? 'w-8 bg-brand-400' : 'w-1.5 bg-white/20 hover:bg-white/40')}
            aria-label={`Örnek ${i + 1}: ${s.question}`}
          />
        ))}
      </div>
    </div>
  );
}
