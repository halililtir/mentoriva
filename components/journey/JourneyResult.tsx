'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  const [stepId, setStepId] = useState<SmallStepId | null>(result.steps[0]?.id ?? null);
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

  const [showOtherSteps, setShowOtherSteps] = useState(false);
  const support = getActiveMentor(result.mentors.support.mentorId);
  const supportAccent = getAccent(support.accentColor);
  const chosenStep = result.steps.find((s) => s.id === stepId) ?? result.steps[0]!;

  return (
    <div className="space-y-10">
      {/* 1. Fark ediş — yolculuğun asıl çıktısı, tek başına */}
      <section aria-labelledby="insight-title" className="animate-fade-up text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-brand-300/85">Yazdıklarından öne çıkan</p>
        <h1 id="insight-title" className="mx-auto mt-4 max-w-2xl font-display text-[clamp(1.45rem,4.2vw,2.05rem)] leading-snug text-white/95 text-balance">
          {result.insight}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[13px] leading-relaxed text-white/45">
          Bu bir tanı değil; yalnızca bugün yazdıklarına dayanan bir fark ediş. Sana uymuyorsa, uymayan yeri de bir ipucu say.
        </p>
      </section>

      {/* 2. Tek küçük adım */}
      <section aria-labelledby="step-title" className="glass rounded-3xl p-5 animate-fade-up sm:p-7" style={{ animationDelay: '120ms' }}>
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Bugüne taşıyabileceğin</p>
        <h2 id="step-title" className="mt-2 font-display text-[1.4rem] leading-snug text-white/90">{SMALL_STEPS[chosenStep.id]}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-white/70">{chosenStep.detail}</p>

        {showOtherSteps && result.steps.length > 1 && (
          <div className="mt-4 space-y-2" role="radiogroup" aria-label="Diğer küçük adımlar">
            {result.steps.map((s) => (
              <button
                key={s.id}
                role="radio"
                aria-checked={chosenStep.id === s.id}
                onClick={() => { setStepId(s.id); setStepState('idle'); }}
                className={cn(
                  'w-full rounded-2xl border px-4 py-3 text-left transition-colors',
                  chosenStep.id === s.id ? 'border-brand-400/60 bg-brand-500/[0.08]' : 'border-white/[0.08] hover:border-white/20',
                )}
              >
                <span className="block text-[14.5px] font-medium text-white/85">{SMALL_STEPS[s.id]}</span>
                <span className="mt-0.5 block text-[13px] text-white/50">{s.detail}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          {stepState === 'saved' ? (
            <p className="text-sm text-emerald-300/90 animate-fade-in">Kaydedildi. Bir sonraki gelişinde nasıl geçtiğini soracağız.</p>
          ) : (
            <button onClick={() => void saveStep()} disabled={stepState === 'saving'} className="btn-primary !px-5 !py-2.5 text-sm">
              {stepState === 'saving' ? 'Kaydediliyor…' : 'Bu adımı hatırlat'}
            </button>
          )}
          {result.steps.length > 1 && stepState !== 'saved' && (
            <button onClick={() => setShowOtherSteps((v) => !v)} className="text-[13px] text-white/55 hover:text-white/85">
              {showOtherSteps ? 'Seçenekleri gizle' : 'Başka bir adım seç'}
            </button>
          )}
          {stepState === 'error' && <p className="w-full text-sm text-red-300/80">Kaydedilemedi, tekrar dene.</p>}
        </div>
      </section>

      {/* 3. Tek mentorla devam */}
      <section
        aria-labelledby="continue-title"
        className="flex flex-col gap-4 rounded-3xl border p-5 animate-fade-up sm:flex-row sm:items-center sm:p-7"
        style={{ borderColor: supportAccent.border, background: supportAccent.bg, animationDelay: '240ms' }}
      >
        <span className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2" style={{ borderColor: supportAccent.hex }}>
          <Image src={support.portraitUrl} alt="" fill sizes="56px" className="object-cover" style={{ objectPosition: support.portraitPosition ?? 'center' }} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="continue-title" className="font-display text-lg" style={{ color: supportAccent.text }}>{MENTOR_INVITES[result.mentors.support.mentorId]}</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-white/65">{result.mentors.support.reason}</p>
          <p className="mt-2 text-[13px] text-white/50">
            Hazır soru: <span className="text-white/80">&ldquo;{result.followUpQuestion}&rdquo;</span>
          </p>
        </div>
        <button onClick={() => onContinueWithMentor(result.mentors.support.mentorId, result.followUpQuestion)} className="btn-primary shrink-0">
          {support.shortName} ile konuş →
        </button>
      </section>
      <p className="-mt-6 text-center text-[11.5px] text-white/35">Yolculuktaki anlatımın mentora gönderilmez; yalnızca bu soru gider, istersen düzenleyebilirsin.</p>

      <p className="-mt-4 text-center text-[12.5px] text-white/40">
        Birine bir şey söylemen gerekiyorsa <Link href="/hazirla" className="text-brand-300/80 underline-offset-2 hover:underline">Söyleyeceğimi hazırla</Link>
        {' · '}duygunu kelimeye dökmek için <Link href="/icimde" className="text-brand-300/80 underline-offset-2 hover:underline">İçimde ne var?</Link>
      </p>

      {/* 4. Daha derine bak — pencereler, harita, ikinci mentor */}
      <details className="group rounded-3xl border border-white/[0.08] p-5 sm:p-6">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[15px] font-medium text-white/80">
          Daha derine bak
          <span className="text-[12px] font-normal text-white/45 group-open:hidden">Üç pencere, düşünce haritan ve bir mentor daha ↓</span>
          <span className="hidden text-[12px] font-normal text-white/45 group-open:inline">Kapat ↑</span>
        </summary>

        <div className="mt-6 space-y-10">
          <section aria-labelledby="windows-title">
            <h2 id="windows-title" className="font-display text-xl text-white/90">Aynı duruma üç farklı yerden bak</h2>
            <div className="mt-4 space-y-3">
              <WindowCard title="İçeriden bakış" icon="◎" delay={0}>{result.windows.psychological}</WindowCard>
              <WindowCard
                title={`${windowMentor.shortName} penceresi`}
                delay={0}
                accent={wmAccent.hex}
                portrait={<span className="relative h-7 w-7 overflow-hidden rounded-full border" style={{ borderColor: wmAccent.hex }}><Image src={windowMentor.portraitUrl} alt="" fill sizes="28px" className="object-cover" style={{ objectPosition: windowMentor.portraitPosition ?? 'center' }} /></span>}
              >
                {result.windows.mentor.text}
              </WindowCard>
              <WindowCard title="Tefekkür" icon="◌" delay={0} emphasis>{result.windows.reflection}</WindowCard>
            </div>
          </section>

          <section aria-labelledby="map-title">
            <h2 id="map-title" className="font-display text-xl text-white/90">Geçici düşünce haritan</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              Verdiğin cevaplara göre oluşan geçici bir harita; bir tanı ya da kişilik raporu değildir ve zamanla değişebilir.
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {MAP_FIELDS.map((f) => (
                <div key={f.key} className={cn('glass rounded-2xl p-4', f.key === 'question' && 'sm:col-span-2 border-brand-500/20')}>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-white/40">{f.label}</dt>
                  <dd className={cn('mt-1.5 leading-relaxed text-white/85', f.key === 'question' ? 'text-[16px] font-medium' : 'text-[15px]')}>
                    {result.map[f.key]}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
              {mapState === 'saved' ? (
                <span className="text-emerald-300/90">Haritan hesabına kaydedildi. İstediğin zaman silebilirsin.</span>
              ) : (
                <button onClick={() => void saveMap()} disabled={mapState === 'saving'} className="text-brand-300/90 hover:text-brand-200 disabled:opacity-50">
                  {mapState === 'saving' ? 'Kaydediliyor…' : 'Bu haritayı hesabıma kaydet'}
                </button>
              )}
              {mapState === 'error' && <span className="text-red-300/80">Kaydedilemedi, tekrar dene.</span>}
              <span className="text-white/30">Anlattıkların ve cevapların kaydedilmez; yalnızca bu harita saklanır.</span>
            </div>
          </section>

          <section aria-labelledby="growth-title">
            <h2 id="growth-title" className="font-display text-xl text-white/90">Seni zorlayabilecek bir bakış</h2>
            <div className="mt-4">
              <MentorSuggestion label="Seni geliştirebilecek" mentorId={result.mentors.growth.mentorId} reason={result.mentors.growth.reason} />
              <button
                onClick={() => onContinueWithMentor(result.mentors.growth.mentorId, result.followUpQuestion)}
                className="btn-secondary mt-3 w-full text-sm sm:w-auto"
              >
                {MENTOR_INVITES[result.mentors.growth.mentorId]} →
              </button>
            </div>
          </section>
        </div>
      </details>

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
  emphasis,
}: {
  title: string;
  children: React.ReactNode;
  delay: number;
  accent?: string;
  portrait?: React.ReactNode;
  icon?: string;
  emphasis?: boolean;
}) {
  return (
    <article className="glass relative overflow-hidden rounded-2xl p-5 animate-fade-up sm:p-6" style={{ animationDelay: `${delay}ms` }}>
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accent ?? 'rgba(0,188,212,0.6)' }} />
      <div className="flex items-center gap-2.5">
        {portrait ?? <span className="text-brand-300/80" aria-hidden="true">{icon}</span>}
        <h3 className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/55">{title}</h3>
      </div>
      <p className={cn('mt-3 leading-relaxed text-white/85', emphasis ? 'text-[16px] font-medium' : 'text-[15px]')}>{children}</p>
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
        <p className="font-display text-lg" style={{ color: a.text }}>{m.name}</p>
        <p className="mt-0.5 text-sm leading-snug text-white/55">{reason}</p>
      </div>
    </div>
  );
}
