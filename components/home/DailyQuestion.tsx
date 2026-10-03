'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { SectionHeading } from '@/components/home/Sections';
import { ShareCardButton } from '@/components/share/ShareCardDialog';
import { RateAnswer } from '@/components/shared/RateAnswer';
import { Reveal } from '@/components/ui/Reveal';
import { TypingDots } from '@/components/ui/TypingDots';
import { ACTIVE_MENTORS, getAccent } from '@/lib/mentors/metadata';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import type { MentorId } from '@/types';

interface DailyEntry {
  date: string;
  question: string;
  answers: Partial<Record<MentorId, string>>;
}

/** Önizleme: ilk cümleler, en az ~200 karakter, en fazla ~320. Cümle ortasında kesmez. */
function excerpt(text: string, min = 200, max = 320): { short: string; cut: boolean } {
  const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?…]+[.!?…]+[”"]?\s*|[^.!?…]+$/g) ?? [text];
  let out = '';
  for (const s of sentences) {
    if (out.length >= min || (out && out.length + s.length > max)) break;
    out += s;
  }
  out = out.trim() || text.slice(0, max);
  return { short: out, cut: out.length < text.trim().length - 2 };
}

const DATE_FMT = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long', timeZone: 'Europe/Istanbul' });

/**
 * Günün sorusu — giriş gerektirmeden tüm mentorların cevabını gösterir.
 * Görünür olduğunda yüklenir; her gün geri gelmek için bir sebep.
 */
export function DailyQuestion({ onAskYourself }: { onAskYourself: (question: string) => void }) {
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [active, setActive] = useState<MentorId | null>(null);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const load = async () => {
      setState('loading');
      try {
        const res = await fetch('/api/v1/daily');
        if (!res.ok) throw new Error();
        const data = (await res.json()) as DailyEntry;
        setEntry(data);
        setActive((Object.keys(data.answers)[0] as MentorId) ?? null);
        setState('ready');
      } catch {
        setState('error');
      }
    };
    if (typeof IntersectionObserver === 'undefined') {
      void load();
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        io.disconnect();
        void load();
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const mentors = ACTIVE_MENTORS.filter((m) => entry?.answers[m.id as MentorId]);
  const current = mentors.find((m) => m.id === active) ?? mentors[0];
  const answer = current ? entry?.answers[current.id as MentorId] : undefined;
  const accent = current ? getAccent(current.accentColor) : null;

  if (state === 'error') return null;

  return (
    <section ref={ref} id="gunun-sorusu" className="mx-auto max-w-content scroll-mt-24 px-5 py-12 sm:py-16" aria-labelledby="daily-title">
      <SectionHeading eyebrow={entry ? `Günün sorusu · ${DATE_FMT.format(new Date(`${entry.date}T12:00:00Z`))}` : 'Günün sorusu'} title="Bugün mentorlar" accent="bunu konuşuyor" id="daily-title">
        Her gün yeni bir soru. Giriş yapmadan oku, bir mentora dokun, sesini dinle.
      </SectionHeading>

      <Reveal delay={80} className="mt-8">
        <div className="glass mx-auto max-w-4xl overflow-hidden rounded-3xl">
          {/* Soru */}
          <div className="border-b border-white/[0.06] px-6 py-5 text-center sm:px-10">
            {entry ? (
              <p className="font-display text-[clamp(1.4rem,3.2vw,2rem)] leading-snug text-white/90 text-balance">“{entry.question}”</p>
            ) : (
              <div className="mx-auto h-8 w-2/3 skeleton" />
            )}
          </div>

          {/* Mentor sekmeleri */}
          <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] px-3 py-2" role="tablist" aria-label="Mentorlar">
            {(mentors.length ? mentors : ACTIVE_MENTORS).map((m) => {
              const a = getAccent(m.accentColor);
              const selected = current?.id === m.id;
              return (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={selected}
                  disabled={!entry}
                  onClick={() => { setActive(m.id as MentorId); setExpanded(false); track('daily_tab', { mentor: m.id }); }}
                  className={cn('flex flex-shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors', selected ? 'bg-white/[0.06]' : 'text-white/50 hover:text-white/80')}
                  style={selected ? { color: a.text } : undefined}
                >
                  <span className="relative h-7 w-7 overflow-hidden rounded-full border" style={{ borderColor: selected ? a.hex : 'rgb(var(--fg) / 0.12)' }}>
                    <Image src={m.portraitUrl} alt="" fill sizes="28px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
                  </span>
                  {m.shortName}
                </button>
              );
            })}
          </div>

          {/* Cevap */}
          <div className="min-h-[160px] px-6 py-6 sm:px-10" role="tabpanel" aria-live="polite">
            {state !== 'ready' || !answer || !current || !accent ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-white/40">
                  <TypingDots /> Mentorlar bugünün sorusunu düşünüyor
                </div>
                {[100, 86, 60].map((w, i) => <div key={i} className="skeleton h-3" style={{ width: `${w}%` }} />)}
              </div>
            ) : (
              <div key={current.id} className="animate-fade-in">
                {(() => {
                  const { short, cut } = excerpt(answer);
                  return (
                    <>
                      <p className="whitespace-pre-wrap font-display text-[16px] leading-[1.75] text-white/85 sm:text-[17px]">
                        {expanded || !cut ? answer : `${short} `}
                        {cut && (
                          <button
                            onClick={() => { setExpanded((v) => !v); if (!expanded) track('daily_expand', { mentor: current.id }); }}
                            className="ml-1 whitespace-nowrap font-sans text-sm font-medium text-brand-300 hover:underline"
                            aria-expanded={expanded}
                          >
                            {expanded ? 'Daha az göster' : 'Devamını oku'}
                          </button>
                        )}
                      </p>
                    </>
                  );
                })()}
                <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <RateAnswer key={current.id} mentorId={current.id as MentorId} source="daily" />
                  <div className="flex items-center gap-2">
                  <ShareCardButton data={{ source: 'daily', mentorId: current.id as MentorId, question: entry!.question, answer }} compact />
                  <button
                    onClick={() => { onAskYourself(entry!.question); track('daily_ask_yourself'); }}
                    className="btn-ghost justify-center text-sm"
                  >
                    Kendin sor →
                  </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
