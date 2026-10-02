'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getActiveMentor, getAccent } from '@/lib/mentors/metadata';
import { MAP_FIELDS, MENTOR_INVITES, SMALL_STEPS, type SmallStepId } from '@/lib/journey/content';
import type { JourneyResult as Result } from '@/lib/journey/schema';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import type { MentorId } from '@/types';

interface Props {
  result: Result;
  startingPoint: string;
  onContinueWithMentor: (mentorId: MentorId, question: string) => void;
  onRestart: () => void;
}

export function JourneyResultView({ result, startingPoint, onContinueWithMentor, onRestart }: Props) {
  const [stepId, setStepId] = useState<SmallStepId | null>(null);
  const [stepState, setStepState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [mapState, setMapState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const windowMentor = getActiveMentor(result.windows.mentor.mentorId);
  const wmAccent = getAccent(windowMentor.accentColor);

  const saveStep = async () => {
    const chosen = result.steps.find((s) => s.id === stepId);
    if (!chosen) return;
    setStepState('saving');
    try {
      const res = await fetch('/api/v1/journey/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: chosen.id, detail: chosen.detail, topic: result.map.topic, mentorId: result.mentors.support.mentorId }),
      });
      if (!res.ok) throw new Error();
      setStepState('saved');
      track('journey_step_saved', { step: chosen.id });
    } catch {
      setStepState('error');
    }
  };

  const saveMap = async () => {
    setMapState('saving');
    try {
      const res = await fetch('/api/v1/journey/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startingPoint,
          map: result.map,
          supportMentor: result.mentors.support.mentorId,
          growthMentor: result.mentors.growth.mentorId,
        }),
      });
      if (!res.ok) throw new Error();
      setMapState('saved');
      track('journey_map_saved');
    } catch {
      setMapState('error');
    }
  };

  return (
    <div className="space-y-12">
      {/* Üç pencere */}
      <section aria-labelledby="windows-title" className="animate-fade-up">
        <p className="text-[11px] uppercase tracking-[0.18em] text-brand-300/80">Üç pencere</p>
        <h1 id="windows-title" className="mt-3 font-display text-[clamp(1.7rem,4.5vw,2.4rem)] leading-tight">
          Aynı duruma üç farklı yerden bak
        </h1>

        <div className="mt-7 space-y-4">
          <WindowCard title="Psikolojik çerçeve" icon="◎" delay={0}>
            {result.windows.psychological}
          </WindowCard>
          <WindowCard
            title={`${windowMentor.shortName} penceresi`}
            delay={120}
            accent={wmAccent.hex}
            portrait={<span className="relative h-7 w-7 overflow-hidden rounded-full border" style={{ borderColor: wmAccent.hex }}><Image src={windowMentor.portraitUrl} alt="" fill sizes="28px" className="object-cover" style={{ objectPosition: windowMentor.portraitPosition ?? 'center' }} /></span>}
          >
            {result.windows.mentor.text}
          </WindowCard>
          <WindowCard title="Tefekkür" icon="◌" delay={240} italic>
            {result.windows.reflection}
          </WindowCard>
        </div>
      </section>

      {/* Geçici harita */}
      <section aria-labelledby="map-title">
        <h2 id="map-title" className="font-display text-2xl text-white/90">Geçici düşünce haritan</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/45">
          Bu, verdiğin cevaplara göre oluşan geçici bir haritadır; bir tanı ya da kişilik raporu değildir ve zamanla değişebilir.
        </p>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {MAP_FIELDS.map((f, i) => (
            <div
              key={f.key}
              className={cn('glass rounded-2xl p-4 animate-fade-up', f.key === 'question' && 'sm:col-span-2 border-brand-500/20')}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <dt className="text-[11px] uppercase tracking-[0.14em] text-white/40">{f.label}</dt>
              <dd className={cn('mt-1.5 leading-relaxed text-white/85', f.key === 'question' ? 'font-display text-lg' : 'text-[15px]')}>
                {result.map[f.key]}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          {mapState === 'saved' ? (
            <span className="text-emerald-300/90">Haritan hesabına kaydedildi. İstediğin zaman silebilirsin.</span>
          ) : (
            <button onClick={saveMap} disabled={mapState === 'saving'} className="text-brand-300/90 hover:text-brand-200 disabled:opacity-50">
              {mapState === 'saving' ? 'Kaydediliyor…' : 'Bu haritayı hesabıma kaydet'}
            </button>
          )}
          {mapState === 'error' && <span className="text-red-300/80">Kaydedilemedi, tekrar dene.</span>}
          <span className="text-white/30">Anlattıkların ve cevapların kaydedilmez; yalnızca bu harita saklanır.</span>
        </div>
      </section>

      {/* Mentorlar */}
      <section aria-labelledby="mentors-title">
        <h2 id="mentors-title" className="font-display text-2xl text-white/90">Bu yolda sana eşlik edebilecekler</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <MentorSuggestion label="Sana iyi gelebilecek" mentorId={result.mentors.support.mentorId} reason={result.mentors.support.reason} />
          <MentorSuggestion label="Seni geliştirebilecek" mentorId={result.mentors.growth.mentorId} reason={result.mentors.growth.reason} />
        </div>
      </section>

      {/* Küçük adım */}
      <section aria-labelledby="step-title">
        <h2 id="step-title" className="font-display text-2xl text-white/90">Küçük bir adım seç</h2>
        <p className="mt-2 text-sm text-white/45">Farkındalık, küçük bir eylemle kalıcı olur. Sana en uygun olanı seç.</p>
        <div className="mt-5 space-y-2" role="radiogroup" aria-label="Küçük adımlar">
          {result.steps.map((s) => (
            <button
              key={s.id}
              role="radio"
              aria-checked={stepId === s.id}
              onClick={() => { setStepId(s.id); setStepState('idle'); }}
              className={cn(
                'w-full rounded-2xl border px-4 py-3.5 text-left transition-all duration-300',
                stepId === s.id ? 'border-brand-400/60 bg-brand-500/[0.08]' : 'border-white/[0.08] hover:border-white/20',
              )}
            >
              <span className="block text-[15px] font-medium text-white/85">{SMALL_STEPS[s.id]}</span>
              <span className="mt-0.5 block text-sm text-white/50">{s.detail}</span>
            </button>
          ))}
        </div>
        <div className="mt-4">
          {stepState === 'saved' ? (
            <p className="text-sm text-emerald-300/90 animate-fade-in">Adımın kaydedildi. Bir sonraki gelişinde nasıl geçtiğini soracağız.</p>
          ) : (
            <button onClick={saveStep} disabled={!stepId || stepState === 'saving'} className="btn-secondary w-full sm:w-auto">
              {stepState === 'saving' ? 'Kaydediliyor…' : 'Bu adımı hatırlat'}
            </button>
          )}
          {stepState === 'error' && <p className="mt-2 text-sm text-red-300/80">Kaydedilemedi, tekrar dene.</p>}
        </div>
      </section>

      {/* Mentorla devam */}
      <section className="glass rounded-3xl p-6 text-center sm:p-8" aria-labelledby="continue-title">
        <h2 id="continue-title" className="font-display text-2xl text-white/90">Bu konuyu bir mentorla derinleştir</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
          Sorun hazır, istersen düzenleyebilirsin: <span className="text-white/75">&ldquo;{result.followUpQuestion}&rdquo;</span>
        </p>
        <p className="mx-auto mt-1 max-w-md text-xs text-white/30">Yolculuktaki anlatımın mentora gönderilmez; yalnızca bu soru gider.</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {[result.mentors.support.mentorId, result.mentors.growth.mentorId].map((id, i) => (
            <button
              key={id + i}
              onClick={() => onContinueWithMentor(id, result.followUpQuestion)}
              className={i === 0 ? 'btn-primary' : 'btn-secondary'}
            >
              {MENTOR_INVITES[id]} →
            </button>
          ))}
        </div>
      </section>

      <div className="text-center">
        <button onClick={onRestart} className="btn-ghost text-sm">Yeni bir yolculuğa başla</button>
      </div>
    </div>
  );
}

function WindowCard({
  title,
  children,
  delay,
  accent,
  portrait,
  icon,
  italic,
}: {
  title: string;
  children: React.ReactNode;
  delay: number;
  accent?: string;
  portrait?: React.ReactNode;
  icon?: string;
  italic?: boolean;
}) {
  return (
    <article className="glass relative overflow-hidden rounded-2xl p-5 animate-fade-up sm:p-6" style={{ animationDelay: `${delay}ms` }}>
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accent ?? 'rgba(0,188,212,0.6)' }} />
      <div className="flex items-center gap-2.5">
        {portrait ?? <span className="text-brand-300/80" aria-hidden="true">{icon}</span>}
        <h3 className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/55">{title}</h3>
      </div>
      <p className={cn('mt-3 leading-relaxed text-white/85', italic ? 'font-display text-lg italic' : 'text-[15px]')}>{children}</p>
    </article>
  );
}

function MentorSuggestion({ label, mentorId, reason }: { label: string; mentorId: MentorId; reason: string }) {
  const m = getActiveMentor(mentorId);
  const a = getAccent(m.accentColor);
  return (
    <div className="glass flex gap-3 rounded-2xl p-4">
      <span className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2" style={{ borderColor: a.hex }}>
        <Image src={m.portraitUrl} alt="" fill sizes="48px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{label}</p>
        <p className="font-display text-lg" style={{ color: a.hex }}>{m.name}</p>
        <p className="mt-0.5 text-sm leading-snug text-white/55">{reason}</p>
      </div>
    </div>
  );
}
