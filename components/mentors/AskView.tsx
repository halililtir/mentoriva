'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { getActiveMentor, getAccent } from '@/lib/mentors/metadata';
import { INPUT_LIMITS } from '@/lib/features';
import { cn } from '@/lib/cn';
import type { MentorId } from '@/types';

interface Props {
  mentorIds: MentorId[];
  onSubmit: (question: string) => void;
  onBack: () => void;
  remaining?: number;
  /** Örnek sorulardan seçilen taslak soru. */
  initialValue?: string;
}

const EXAMPLES = [
  'İnsan neden kendini sabote eder?',
  'Korku ile sezgi nasıl ayırt edilir?',
  'Neden hep aynı hataları tekrarlıyorum?',
  'Başarısızlık korkusu nasıl aşılır?',
  'Sevdiğim işi mi yapmalıyım, güvenli olanı mı?',
];

export function AskView({ mentorIds, onSubmit, onBack, remaining, initialValue = '' }: Props) {
  const [value, setValue] = useState(initialValue);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const mentors = mentorIds.map((id) => getActiveMentor(id));
  const isMulti = mentors.length > 1;
  const first = mentors[0]!;

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 260)}px`;
  }, [value]);

  useEffect(() => { taRef.current?.focus(); }, []);

  const trimmed = value.trim();
  const tooShort = trimmed.length < INPUT_LIMITS.MIN_QUESTION_LENGTH;
  const tooLong = trimmed.length > INPUT_LIMITS.MAX_QUESTION_LENGTH;
  const canSubmit = !tooShort && !tooLong;

  const submit = () => { if (canSubmit) onSubmit(trimmed); };

  return (
    <div className="mx-auto w-full max-w-[720px] px-5 py-10 sm:py-16">
      {/* Mentorlar */}
      <div className="flex flex-col items-center text-center animate-fade-up">
        <div className="flex -space-x-4">
          {mentors.map((m, i) => {
            const a = getAccent(m.accentColor);
            return (
              <div
                key={m.id}
                className="relative h-20 w-20 overflow-hidden rounded-full border-2 animate-pop sm:h-24 sm:w-24"
                style={{
                  borderColor: a.hex,
                  boxShadow: `0 0 0 4px rgb(var(--ink-0)), 0 0 50px -6px ${a.glow}`,
                  animationDelay: `${i * 80}ms`,
                  zIndex: mentors.length - i,
                }}
              >
                <Image src={m.portraitUrl} alt={m.name} fill sizes="96px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} priority />
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-white/40">
          {isMulti ? `${mentors.length} mentor birlikte` : first.title}
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.8rem,4.5vw,2.6rem)] leading-tight text-balance">
          {isMulti ? (
            mentors.map((m, i) => (
              <span key={m.id}>
                {i > 0 && <span className="text-white/20"> · </span>}
                <span style={{ color: getAccent(m.accentColor).hex }}>{m.shortName}</span>
              </span>
            ))
          ) : (
            <>
              <span style={{ color: getAccent(first.accentColor).hex }}>{first.shortName}</span> seni dinliyor
            </>
          )}
        </h1>
        <p className="mt-3 max-w-md text-sm text-white/45">
          Bugün neyi anlamak istiyorsun? En iyi cevaplar kısa ve net, tek cümlelik sorularla gelir.
        </p>
      </div>

      {/* Soru kutusu */}
      <div className="mt-10 animate-fade-up" style={{ animationDelay: '150ms' }}>
        <div className="focus-ring-gradient shadow-[0_30px_80px_-40px_rgba(0,188,212,0.5)]">
          <div className="rounded-[calc(1.25rem-1px)] bg-ink-50/90 backdrop-blur-xl">
            <textarea
              ref={taRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={isMulti ? 'Mentorlarına soracağın soruyu yaz…' : `${first.shortName}'a ne sormak istersin?`}
              className="block min-h-[140px] w-full resize-none bg-transparent px-5 pb-3 pt-5 text-[17px] leading-relaxed text-paper placeholder:text-white/25 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              maxLength={INPUT_LIMITS.MAX_QUESTION_LENGTH + 10}
              aria-label="Sorunuz"
            />
            <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3">
              <span className={cn('text-[11px] tabular-nums transition-colors', tooLong ? 'text-red-400' : 'text-white/30')}>
                {trimmed.length}/{INPUT_LIMITS.MAX_QUESTION_LENGTH}
                <span className="ml-3 hidden text-white/20 sm:inline">Ctrl + Enter ile gönder</span>
              </span>
              <button onClick={submit} disabled={!canSubmit} className="btn-primary !px-5 !py-2.5 text-sm">
                {isMulti ? 'Hepsine sor' : 'Sor'}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {typeof remaining === 'number' && (
          <p className="mt-3 text-center text-xs text-white/35">
            Bu soru bugünkü haklarından <span className="text-white/60">1</span> tanesini kullanır · kalan{' '}
            <span className="text-brand-300">{remaining}</span>
          </p>
        )}
      </div>

      {/* Örnek sorular */}
      <div className={cn('mt-8 transition-all duration-500', value ? 'pointer-events-none opacity-0' : 'opacity-100')}>
        <p className="mb-3 text-center text-[11px] uppercase tracking-[0.16em] text-white/30">İlham al</p>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((q, i) => (
            <button
              key={q}
              onClick={() => { setValue(q); taRef.current?.focus(); }}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[13px] text-white/50 transition-all duration-300 ease-out-expo animate-fade-in [animation-fill-mode:both] hover:-translate-y-0.5 hover:border-brand-500/30 hover:bg-brand-500/[0.06] hover:text-white/85"
              style={{ animationDelay: `${250 + i * 60}ms` }}
              tabIndex={value ? -1 : 0}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <button onClick={onBack} className="btn-ghost text-sm">← Mentor seçimine dön</button>
      </div>
    </div>
  );
}
