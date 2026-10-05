'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { getActiveMentor, getAccent } from '@/lib/mentors/metadata';
import { INPUT_LIMITS } from '@/lib/features';
import { cn } from '@/lib/cn';
import type { MentorId } from '@/types';
import { dative } from '@/lib/tr';
import { CONTEXT_DETAIL_MAX, INTENTS, needsClarify, type IntentId, type QuestionContext } from '@/lib/clarify';
import Link from 'next/link';
import { hasGuestConsent, setGuestConsent } from '@/lib/guest-trial';
import { MIN_AGE } from '@/lib/legal';
import { DEFAULT_DAILY_LIMIT } from '@/lib/auth/limits';

interface Props {
  mentorIds: MentorId[];
  /** Netleştirme adımı doldurulduysa bağlamla birlikte. */
  onSubmit: (question: string, context?: QuestionContext) => void;
  onBack: () => void;
  remaining?: number;
  /** Örnek sorulardan seçilen taslak soru. */
  initialValue?: string;
  /** Kayıt olmadan deneme: 18+ ve yurt dışı aktarım onayı burada alınır. */
  guest?: boolean;
}

const EXAMPLES = [
  'İnsan neden kendini sabote eder?',
  'Korku ile sezgi nasıl ayırt edilir?',
  'Neden hep aynı hataları tekrarlıyorum?',
  'Başarısızlık korkusu nasıl aşılır?',
  'Sevdiğim işi mi yapmalıyım, güvenli olanı mı?',
];

export function AskView({ mentorIds, onSubmit, onBack, remaining, initialValue = '', guest = false }: Props) {
  const [value, setValue] = useState(initialValue);
  const [consent, setConsent] = useState(false);
  /** Kısa sorularda "Sor"dan sonra açılan netleştirme paneli. */
  const [clarifying, setClarifying] = useState(false);
  const [detail, setDetail] = useState('');
  const [intent, setIntent] = useState<IntentId | null>(null);
  useEffect(() => { if (guest) setConsent(hasGuestConsent()); }, [guest]);
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

  // Netleştirme paneli telefonda ekranın altında kalmasın
  const clarifyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (clarifying) clarifyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [clarifying]);

  const trimmed = value.trim();
  const tooShort = trimmed.length < INPUT_LIMITS.MIN_QUESTION_LENGTH;
  const tooLong = trimmed.length > INPUT_LIMITS.MAX_QUESTION_LENGTH;
  const canSubmit = !tooShort && !tooLong && (!guest || consent);

  const submit = () => {
    if (!canSubmit) return;
    if (!clarifying && needsClarify(trimmed)) return setClarifying(true);
    send(true);
  };

  const send = (withContext: boolean) => {
    if (!canSubmit) return;
    const d = detail.trim();
    const ctx: QuestionContext | undefined = withContext && (d || intent) ? { ...(d ? { detail: d } : {}), ...(intent ? { intent } : {}) } : undefined;
    onSubmit(trimmed, ctx);
  };

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
                <span style={{ color: getAccent(m.accentColor).text }}>{m.shortName}</span>
              </span>
            ))
          ) : (
            <>
              <span style={{ color: getAccent(first.accentColor).text }}>{first.shortName}</span> seni dinliyor
            </>
          )}
        </h1>
        <p className="mt-3 max-w-md text-sm text-white/45">
          Bugün neyi anlamak istiyorsun? Kendi kelimelerinle yaz; ne kadar somut olursa cevaplar o kadar sana yakın olur.
        </p>
        <p className="mt-2 text-[12.5px] text-white/35">
          Ne hissettiğini kelimeye dökmekte zorlanıyor musun?{' '}
          <Link href="/icimde" className="text-brand-300/80 underline-offset-2 hover:underline">İçimde ne var?</Link>
        </p>
      </div>

      {/* Soru kutusu */}
      <div className="mt-10 animate-fade-up" style={{ animationDelay: '150ms' }}>
        <div className="focus-ring-gradient shadow-[0_30px_80px_-40px_rgba(0,188,212,0.5)]">
          <div className="rounded-[calc(1.25rem-1px)] bg-ink-50/90 backdrop-blur-xl">
            <textarea
              ref={taRef}
              value={value}
              onChange={(e) => { setValue(e.target.value); if (clarifying) setClarifying(false); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={isMulti ? 'Mentorlarına soracağın soruyu yaz…' : `${dative(first.shortName)} ne sormak istersin?`}
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

        {clarifying && (
          <div ref={clarifyRef} className="mx-auto mt-4 max-w-[600px] scroll-mt-24 rounded-2xl border border-brand-400/30 bg-brand-500/[0.06] p-4 text-left animate-fade-in sm:p-5" role="group" aria-label="Sorunu netleştir">
            <p className="text-[15px] font-medium text-white/90">Mentorların seni daha iyi anlasın</p>
            <p className="mt-1 text-[13px] leading-relaxed text-white/55">Sorun kısa; iki küçük ekleme cevapları sana daha yakın kılar. İkisi de isteğe bağlı.</p>

            <label className="mt-4 block text-[12.5px] font-medium text-white/70" htmlFor="clarify-detail">Biraz daha anlatmak ister misin?</label>
            <textarea
              id="clarify-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={2}
              maxLength={CONTEXT_DETAIL_MAX}
              placeholder="Örn. ne zamandan beri, ne oldu, seni en çok ne zorluyor…"
              className="mt-1.5 block w-full resize-none rounded-xl border border-white/10 bg-ink-0/50 px-3.5 py-2.5 text-[15px] leading-relaxed text-paper placeholder:text-white/30 focus:border-brand-400/50 focus:outline-none"
            />

            <p className="mt-4 text-[12.5px] font-medium text-white/70">Bu soruyla ne arıyorsun?</p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Beklentin">
              {INTENTS.map((it) => (
                <button
                  key={it.id}
                  role="radio"
                  aria-checked={intent === it.id}
                  onClick={() => setIntent(intent === it.id ? null : it.id)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-[13px] transition-colors',
                    intent === it.id ? 'border-brand-400/60 bg-brand-500/15 text-white' : 'border-white/10 text-white/60 hover:text-white/90',
                  )}
                >
                  {it.label}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button onClick={() => send(true)} disabled={!canSubmit} className="btn-primary !px-5 !py-2.5 text-sm">
                {isMulti ? 'Hepsine sor' : 'Sor'}
              </button>
              <button onClick={() => send(false)} disabled={!canSubmit} className="text-[13px] text-white/55 hover:text-white/85">
                Atla, böyle sor
              </button>
            </div>
          </div>
        )}

        {guest && (
          <div className="mx-auto mt-4 max-w-[560px] rounded-2xl border border-brand-400/25 bg-brand-500/[0.05] px-4 py-3 text-left">
            <p className="text-[13px] font-medium text-white/85">Kayıt olmadan deneme · bugün 1 soru</p>
            <label className="mt-2 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => { setConsent(e.target.checked); setGuestConsent(e.target.checked); }}
                className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-white/20 bg-white/[0.04] accent-brand-500"
              />
              <span className="text-xs leading-relaxed text-white/60">
                {MIN_AGE} yaşından büyüğüm; sorumun, cevap üretilebilmesi için yurt dışındaki hizmet sağlayıcılara aktarılmasına
                açık rıza veriyorum.{' '}
                <Link href="/kullanim-sartlari" target="_blank" className="text-brand-300/80 hover:underline">Şartlar</Link>
                {' · '}
                <Link href="/gizlilik#yurt-disi" target="_blank" className="text-brand-300/80 hover:underline">Gizlilik</Link>
              </span>
            </label>
            <p className="mt-2 text-[11.5px] leading-relaxed text-white/45">
              Beğenirsen ücretsiz üye olabilirsin: her gün {DEFAULT_DAILY_LIMIT} soru, mentorlarla sohbet ve sohbetlerini saklama.
            </p>
          </div>
        )}

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
