'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getActiveMentor, getAccent } from '@/lib/mentors/metadata';
import { JOURNEY_COST, MAP_FIELDS } from '@/lib/journey/content';
import type { SavedJourney, SavedStep } from '@/lib/journey/store';
import { useSession } from '@/lib/session';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { comitative } from '@/lib/tr';

const FLOW = [
  { t: 'Şu an neredesin?', d: 'Bir başlangıç noktası seç.' },
  { t: 'İçinden geçeni anlat', d: 'Kendi kelimelerinle, olduğun yerden.' },
  { t: 'Üç soru', d: 'Sana kendi durumunu açan kısa sorular.' },
  { t: 'Üç pencere', d: 'Psikolojik çerçeve, bir mentorun bakışı ve tefekkür.' },
  { t: 'Küçük bir adım', d: 'Farkındalığı bugüne taşıyan tek bir eylem.' },
];

const PROMISES = [
  'Sana “sen busun” demez; tanı koymaz, etiket vermez.',
  'Yazdıkların kaydedilmez. Yalnızca istersen haritanı ve adımını saklarsın.',
  'İstediğin an bırakabilir, önceki adıma dönebilirsin.',
];

export function JourneyHome({ onBegin, notEnough }: { onBegin: () => void; notEnough: boolean }) {
  const { status } = useSession();
  const [step, setStep] = useState<SavedStep | null>(null);
  const [saved, setSaved] = useState<SavedJourney[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'user') return;
    fetch('/api/v1/journey/step').then((r) => (r.ok ? r.json() : null)).then((d) => setStep(d?.step ?? null)).catch(() => {});
    fetch('/api/v1/journey/saved').then((r) => (r.ok ? r.json() : null)).then((d) => setSaved(d?.journeys ?? [])).catch(() => {});
  }, [status]);

  const setStepStatus = async (s: SavedStep['status']) => {
    const res = await fetch('/api/v1/journey/step', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: s }) });
    if (res.ok) setStep((await res.json()).step);
    track('journey_step_status', { status: s });
  };

  const removeJourney = async (id: string) => {
    if (!window.confirm('Bu harita kalıcı olarak silinsin mi?')) return;
    const res = await fetch(`/api/v1/journey/saved?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) setSaved((list) => list.filter((j) => j.id !== id));
  };

  const removeAll = async () => {
    if (!window.confirm('Kaydettiğin tüm haritalar ve adımın kalıcı olarak silinsin mi?')) return;
    const res = await fetch('/api/v1/journey/saved?all=1', { method: 'DELETE' });
    if (res.ok) { setSaved([]); setStep(null); }
  };

  return (
    <main className="mx-auto max-w-content px-5 pb-8 pt-10 sm:pt-16">
      {/* Kayıtlı adımın takibi */}
      {step && step.status === 'pending' && (
        <div className="glass mx-auto mb-10 max-w-2xl rounded-2xl p-5 animate-fade-down">
          <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300/90">Geçen sefer seçtiğin adım</p>
          <p className="mt-2 font-display text-lg text-white/90">{step.label}</p>
          {step.detail && <p className="mt-1 text-sm text-white/55">{step.detail}</p>}
          <p className="mt-4 text-sm text-white/60">Nasıl geçti?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => setStepStatus('done')} className="btn-secondary !px-4 !py-2 text-sm">Yaptım</button>
            <button onClick={() => setStepStatus('skipped')} className="btn-secondary !px-4 !py-2 text-sm">Bu sefer olmadı</button>
            <Link href={`/?mentor=${step.mentorId}`} className="btn-ghost text-sm">{comitative(getActiveMentor(step.mentorId).shortName)} konuş →</Link>
          </div>
        </div>
      )}
      {step && step.status !== 'pending' && (
        <p className="mx-auto mb-8 max-w-2xl rounded-2xl border border-white/[0.06] px-4 py-3 text-center text-sm text-white/55 animate-fade-in">
          {step.status === 'done'
            ? 'Adımını attın. Küçük adımlar, büyük farkındalıkların başlangıcıdır.'
            : 'Olmadıysa da sorun değil. Kendine aynı şefkatle yeni bir adım seçebilirsin.'}
        </p>
      )}

      {/* Giriş */}
      <section className="mx-auto max-w-2xl text-center">
        <span className="eyebrow animate-fade-up">Kendine Yolculuk</span>
        <h1 className="mt-6 font-display text-[clamp(2.3rem,6vw,3.6rem)] leading-[1.05] text-balance animate-word">
          Kendine biraz daha <span className="italic text-gradient">dürüst bak.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-white/55 animate-fade-up" style={{ animationDelay: '200ms' }}>
          Bu bir test değil. Duygularını, ihtiyaçlarını ve hayatında tekrar eden örüntüleri fark etmen için birkaç dakikalık,
          sakin bir yolculuk. Sonunda bir etiket değil, kendine sorabileceğin daha iyi bir soru ve küçük bir adım kalır.
        </p>
        <div className="mt-8 flex flex-col items-center gap-2 animate-fade-up" style={{ animationDelay: '320ms' }}>
          <button onClick={onBegin} disabled={status === 'loading' || (status === 'user' && notEnough)} className="btn-primary !px-8 !py-3.5">
            {status === 'guest' ? 'Ücretsiz üye ol ve başla' : 'Yolculuğa başla'}
          </button>
          <span className="text-xs text-white/35">
            {status === 'user' && notEnough ? (
              <>Bugünkü hakların yetmiyor. <Link href="/davet" className="text-amber-300/90 hover:text-amber-200">Davet ederek hak kazan</Link></>
            ) : (
              `Yaklaşık 5 dakika · ${JOURNEY_COST} soru hakkı`
            )}
          </span>
        </div>
      </section>

      {/* Akış */}
      <section className="mx-auto mt-16 max-w-3xl" aria-label="Yolculuğun adımları">
        <ol className="grid gap-3 sm:grid-cols-5">
          {FLOW.map((f, i) => (
            <li key={f.t} className="glass rounded-2xl p-4 animate-fade-up" style={{ animationDelay: `${400 + i * 70}ms` }}>
              <span className="font-display text-2xl text-white/20">{i + 1}</span>
              <p className="mt-2 text-sm font-medium text-white/85">{f.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/45">{f.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Sözler */}
      <section className="mx-auto mt-10 max-w-2xl">
        <ul className="space-y-2">
          {PROMISES.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm text-white/60">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0" aria-hidden="true"><path d="M3 8l3.5 3.5L13 5" stroke="#33d4dc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-2xl border border-white/[0.06] px-4 py-3 text-xs leading-relaxed text-white/40">
          Kendine Yolculuk bir düşünme aracıdır; psikolojik danışmanlık ya da terapi değildir. Zor bir dönemden geçiyorsan bir uzmana
          danışmanı öneririz. Kriz belirtisi taşıyan yazılarda yolculuk durur ve seni profesyonel desteğe yönlendirir.
        </p>
      </section>

      {/* Kaydedilen haritalar */}
      {saved.length > 0 && (
        <section className="mx-auto mt-14 max-w-2xl" aria-labelledby="saved-title">
          <div className="flex items-end justify-between gap-3">
            <h2 id="saved-title" className="font-display text-2xl text-white/90">Kaydettiğin haritalar</h2>
            <button onClick={removeAll} className="text-xs text-white/35 hover:text-red-300/90">Tümünü sil</button>
          </div>
          <ul className="mt-4 space-y-2">
            {saved.map((j) => {
              const a = getAccent(getActiveMentor(j.supportMentor).accentColor);
              const isOpen = open === j.id;
              return (
                <li key={j.id} className="glass overflow-hidden rounded-2xl">
                  <button onClick={() => setOpen(isOpen ? null : j.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left" aria-expanded={isOpen}>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] text-white/85">{j.map.topic || j.startingPoint}</span>
                      <span className="block text-xs text-white/40">
                        {new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' }).format(new Date(j.createdAt))} ·{' '}
                        <span style={{ color: a.text }}>{getActiveMentor(j.supportMentor).shortName}</span>
                      </span>
                    </span>
                    <span className={cn('text-white/40 transition-transform', isOpen && 'rotate-90')} aria-hidden="true">›</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-white/[0.06] px-4 py-4 animate-fade-in">
                      <dl className="space-y-2.5">
                        {MAP_FIELDS.map((f) => j.map[f.key] && (
                          <div key={f.key}>
                            <dt className="text-[10px] uppercase tracking-[0.14em] text-white/35">{f.label}</dt>
                            <dd className="text-sm text-white/75">{j.map[f.key]}</dd>
                          </div>
                        ))}
                      </dl>
                      <button onClick={() => removeJourney(j.id)} className="mt-4 text-xs text-white/35 hover:text-red-300/90">Bu haritayı sil</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
