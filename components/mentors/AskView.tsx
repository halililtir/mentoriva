'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { getActiveMentor, getAccent, type MentorMetadata } from '@/lib/mentors/metadata';
import { INPUT_LIMITS } from '@/lib/features';
import type { MentorId } from '@/types';

interface Props {
  mentorIds: MentorId[];
  onSubmit: (question: string) => void;
  onBack: () => void;
}

export function AskView({ mentorIds, onSubmit, onBack }: Props) {
  const [value, setValue] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const mentors = mentorIds.map((id) => getActiveMentor(id));
  const isMulti = mentors.length > 1;

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 220)}px`;
  }, [value]);

  useEffect(() => { taRef.current?.focus(); }, []);

  const trimmed = value.trim();
  const canSubmit =
    trimmed.length >= INPUT_LIMITS.MIN_QUESTION_LENGTH &&
    trimmed.length <= INPUT_LIMITS.MAX_QUESTION_LENGTH;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (canSubmit) onSubmit(trimmed);
    }
  };

  return (
    <div className="mx-auto max-w-[640px] px-5 py-10 sm:py-14 animate-fade-up">
      {/* Mentor strip */}
      <div className="flex items-center gap-3 mb-7 pb-5 border-b border-white/[0.06]">
        <div className="flex -space-x-2">
          {mentors.map((m) => {
            const a = getAccent(m.accentColor);
            return (
              <div
                key={m.id}
                className="w-11 h-11 rounded-xl overflow-hidden border-2 relative flex-shrink-0"
                style={{ borderColor: a.border }}
              >
                <Image src={m.portraitUrl} alt={m.name} fill style={{objectPosition:m.portraitPosition||"center"}} className="object-cover" sizes="44px" />
              </div>
            );
          })}
        </div>
        <div className="min-w-0">
          {isMulti ? (
            <>
              <div className="font-display text-base leading-tight truncate">
                {mentors.map((m, i) => (
                  <span key={m.id}>
                    {i > 0 && <span className="text-white/20"> · </span>}
                    <span style={{ color: getAccent(m.accentColor).hex }}>{m.name.split(' ').pop()}</span>
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">Karşılaştırma modu</p>
            </>
          ) : (
            <>
              <h2 className="font-display text-lg" style={{ color: getAccent(mentors[0]!.accentColor).hex }}>
                {mentors[0]!.name}
              </h2>
              <p className="text-[10px] text-white/35 uppercase tracking-wider">{mentors[0]!.title}</p>
            </>
          )}
        </div>
      </div>

      {/* Form */}
      <label className="text-[14px] text-white/60 font-medium mb-1 block">
        Bugün neyi anlamak istiyorsun?
      </label>
      <p className="text-[11px] text-white/25 mb-3">
        Kısa ve net bir soru yaz. En iyi cevaplar tek cümlelik sorularla gelir.
      </p>
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isMulti ? 'Hepsine soracağın soruyu yaz\u2026' : `${mentors[0]!.name.split(' ')[0]}'a ne sormak istersin?`}
        className="input-field text-base leading-relaxed min-h-[120px]"
        maxLength={INPUT_LIMITS.MAX_QUESTION_LENGTH + 10}
        aria-label="Sorunuz"
      />

      {/* Örnek sorular */}
      {!value && (
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            'İnsan neden kendini sabote eder?',
            'Korku ile sezgi nasıl ayırt edilir?',
            'Neden hep aynı hataları tekrarlıyorum?',
            'Başarısızlık korkusu nasıl aşılır?',
          ].map((q) => (
            <button
              key={q}
              onClick={() => setValue(q)}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/35 hover:text-white/60 hover:border-white/15 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button onClick={() => canSubmit && onSubmit(trimmed)} disabled={!canSubmit} className="btn-primary">
          Gönder
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button onClick={onBack} className="btn-secondary">← Geri</button>
      </div>
    </div>
  );
}
