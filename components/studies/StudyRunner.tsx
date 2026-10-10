'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CrisisNotice } from '@/components/mentors/CrisisNotice';
import { ReminderToggle } from '@/components/me/ReminderToggle';
import { useSession } from '@/lib/session';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { DRAFT_KEY } from '@/lib/flow-keys';
import { INPUT_LIMITS } from '@/lib/features';
import {
  STUDY_ANSWER_MAX, STUDY_COST, STUDY_MAX_QUESTIONS, STUDY_MIN_ANSWERS, STUDY_TAKEAWAY_MAX,
  turnsToQuestion, type GuidedStudy, type StudyFinish, type StudyTurn,
} from '@/lib/studies/guided-content';

type Phase = 'intro' | 'asking' | 'takeaway' | 'result' | 'crisis';

/**
 * Bir rehberli çalışmayı yürütür. Yazılanlar yalnızca bu sekmede tutulur;
 * kişi isterse sonunda kartını kaydeder. Her an "Bir mentorla konuş" ile
 * çalışmayı bırakıp sohbete geçebilir.
 */
export function StudyRunner({ study }: { study: GuidedStudy }) {
  const router = useRouter();
  const { status, user, setRemaining } = useSession();
  const [phase, setPhase] = useState<Phase>('intro');
  const [turns, setTurns] = useState<StudyTurn[]>([]);
  const [question, setQuestion] = useState(study.opening);
  const [reflect, setReflect] = useState('');
  const [answer, setAnswer] = useState('');
  const [token, setToken] = useState('');
  const [done, setDone] = useState(false);
  const [takeaway, setTakeaway] = useState('');
  const [result, setResult] = useState<StudyFinish | null>(null);
  const [crisis, setCrisis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cardState, setCardState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [stepPick, setStepPick] = useState('');
  const [stepState, setStepState] = useState<'idle' | 'saved' | 'error'>('idle');
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); taRef.current?.focus(); }, [phase, question]);

  const post = async (url: string, body: unknown) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    return { res, data };
  };

  const handleCrisis = (data: Record<string, unknown> | null) => {
    if (data?.['crisis']) { setCrisis(String(data['message'] ?? '')); setPhase('crisis'); return true; }
    return false;
  };

  const submitAnswer = async () => {
    const a = answer.trim();
    if (a.length < 2 || loading) return;
    const nextTurns = [...turns, { q: question, a }];
    setLoading(true);
    setError('');
    try {
      const first = turns.length === 0;
      const { res, data } = first
        ? await post('/api/v1/studies/start', { studyId: study.id, answer: a })
        : await post('/api/v1/studies/next', { token, turns: nextTurns });
      if (handleCrisis(data)) return;
      if (!res.ok) return setError(String(data?.['error'] ?? 'Şu an olmadı; biraz sonra tekrar dene.'));
      if (first) {
        setToken(String(data?.['token'] ?? ''));
        if (typeof data?.['remaining'] === 'number') setRemaining(data['remaining']);
        track('study_start', { study: study.id });
      }
      setTurns(nextTurns);
      setAnswer('');
      setReflect(String(data?.['reflect'] ?? ''));
      const q = String(data?.['question'] ?? '');
      const isDone = data?.['done'] === true || !q || nextTurns.length > STUDY_MAX_QUESTIONS;
      setDone(isDone);
      if (isDone) setPhase('takeaway');
      else setQuestion(q);
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    setLoading(true);
    setError('');
    try {
      const { res, data } = await post('/api/v1/studies/finish', { token, turns, takeaway });
      if (handleCrisis(data)) return;
      if (!res.ok) return setError(String(data?.['error'] ?? 'Özet hazırlanamadı.'));
      setResult({ summary: String(data?.['summary'] ?? ''), open: String(data?.['open'] ?? ''), steps: (data?.['steps'] as string[]) ?? [] });
      setPhase('result');
      track('study_done', { study: study.id });
    } finally {
      setLoading(false);
    }
  };

  const toMentor = () => {
    try { sessionStorage.setItem(DRAFT_KEY, turnsToQuestion(study.title, turns, INPUT_LIMITS.MAX_QUESTION_LENGTH)); } catch {}
    track('study_to_mentor', { study: study.id });
    router.push('/#mentorlar');
  };

  const saveCard = async () => {
    const { res } = await post('/api/v1/cards', {
      kind: 'study',
      card: { title: study.title, situation: turns[0]?.a ?? '', note: takeaway, reflection: result?.summary ?? '', step: stepState === 'saved' ? stepPick : '' },
    });
    setCardState(res.ok ? 'saved' : 'error');
  };

  const saveStep = async (label: string) => {
    const { res } = await post('/api/v1/journey/step', { stepId: 'ozel', label, detail: '', topic: study.title });
    setStepPick(label);
    setStepState(res.ok ? 'saved' : 'error');
  };

  if (status === 'guest') {
    return (
      <div className="mt-10 text-center">
        <p className="text-white/60">Rehberli çalışmalar üyelere açık.</p>
        <Link href={`/kayit?next=/calismalar/${study.id}`} className="btn-primary mt-5 inline-flex">Ücretsiz üye ol</Link>
      </div>
    );
  }
  if (phase === 'crisis') return <CrisisNotice message={crisis} onBack={() => router.push('/calismalar')} />;

  const answered = turns.length;

  return (
    <div className="mt-8">
      {phase === 'intro' && (
        <section className="animate-fade-up">
          <p className="text-[15.5px] leading-relaxed text-white/65">{study.intro}</p>
          <ul className="mt-5 space-y-1.5 text-[13.5px] text-white/50">
            <li>· Birkaç soru; her biri senin cevabına göre gelir.</li>
            <li>· Sonunda senin için neyin netleştiğini kendin yazarsın.</li>
            <li>· İstediğin an bırakıp bir mentorla konuşmaya geçebilirsin.</li>
            <li>· {STUDY_COST} hak kullanır; yazdıkların saklanmaz, kartını yalnızca sen istersen kaydedersin.</li>
          </ul>
          <button onClick={() => setPhase('asking')} disabled={status !== 'user' || (user?.remaining ?? 0) < STUDY_COST} className="btn-primary mt-8">
            Başlayalım
          </button>
          {status === 'user' && (user?.remaining ?? 0) < STUDY_COST && <p className="mt-2 text-sm text-amber-300/90">Bugünkü hakların doldu; yarın yeniden başlayabilirsin.</p>}
        </section>
      )}

      {phase === 'asking' && (
        <section className="animate-fade-up">
          <div className="flex gap-1.5" aria-label={`${answered + 1}. soru`}>
            {Array.from({ length: STUDY_MAX_QUESTIONS + 1 }).map((_, i) => (
              <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors duration-700', i <= answered ? 'bg-brand-400/80' : 'bg-white/[0.07]')} />
            ))}
          </div>
          {reflect && <p className="mt-6 text-[14px] italic leading-relaxed text-white/50">{reflect}</p>}
          <h2 className="mt-4 font-display text-2xl leading-snug sm:text-[1.75rem]">{question}</h2>
          <textarea
            ref={taRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value.slice(0, STUDY_ANSWER_MAX))}
            rows={5}
            placeholder={answered === 0 ? study.placeholder : 'Kendi kelimelerinle…'}
            className="input-field mt-5 min-h-[130px] w-full resize-y text-base"
            aria-label="Cevabın"
          />
          {error && <p className="mt-2 text-sm text-red-300/90">{error}</p>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3 text-[13px]">
              {answered >= STUDY_MIN_ANSWERS && (
                <button onClick={() => setPhase('takeaway')} className="text-white/50 hover:text-white">Burada bitir</button>
              )}
              {answered >= 1 && (
                <button onClick={toMentor} className="text-white/50 hover:text-white">Bir mentorla konuşmaya geç</button>
              )}
            </div>
            <button onClick={() => void submitAnswer()} disabled={answer.trim().length < 2 || loading} className="btn-primary">
              {loading ? 'Düşünülüyor…' : 'Devam'}
            </button>
          </div>
        </section>
      )}

      {phase === 'takeaway' && (
        <section className="animate-fade-up">
          {done && reflect && <p className="text-[14px] italic leading-relaxed text-white/50">{reflect}</p>}
          <h2 className="mt-3 font-display text-2xl sm:text-3xl">Senin için ne netleşti?</h2>
          <p className="mt-2 text-sm text-white/50">Bir iki cümle yeter. Hiçbir şey netleşmediyse onu da yazabilirsin; bu da bir sonuçtur.</p>
          <textarea
            ref={taRef}
            value={takeaway}
            onChange={(e) => setTakeaway(e.target.value.slice(0, STUDY_TAKEAWAY_MAX))}
            rows={4}
            className="input-field mt-5 min-h-[110px] w-full resize-y text-base"
            aria-label="Senin için ne netleşti"
          />
          {error && <p className="mt-2 text-sm text-red-300/90">{error}</p>}
          <div className="mt-5 flex justify-end">
            <button onClick={() => void finish()} disabled={loading} className="btn-primary">{loading ? 'Hazırlanıyor…' : 'Çalışmayı tamamla'}</button>
          </div>
        </section>
      )}

      {phase === 'result' && result && (
        <section className="space-y-6 animate-fade-up">
          {takeaway.trim() && (
            <div className="rounded-3xl border border-brand-400/30 bg-brand-500/[0.06] p-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-brand-300">Senin cümlen</p>
              <p className="mt-2 font-display text-xl leading-snug text-white/95">{takeaway.trim()}</p>
            </div>
          )}
          <div className="glass rounded-3xl p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">Anlattıklarının özeti</p>
            <p className="mt-2 text-[15.5px] leading-relaxed text-white/80">{result.summary}</p>
            {result.open && (
              <p className="mt-4 text-[14.5px] leading-relaxed text-white/65">
                <span className="text-white/40">Açık kalan: </span>{result.open}
              </p>
            )}
          </div>

          <div>
            <h3 className="font-display text-xl">Denemek istediğin bir adım var mı?</h3>
            <p className="mt-1 text-sm text-white/45">Zorunlu değil. Seçersen Yolculuğum&apos;da görünür.</p>
            <div className="mt-3 flex flex-col gap-2">
              {result.steps.map((s) => (
                <button
                  key={s}
                  onClick={() => void saveStep(s)}
                  disabled={stepState === 'saved'}
                  className={cn('rounded-2xl border px-4 py-3 text-left text-[14.5px] transition', stepPick === s ? 'border-brand-400/50 bg-brand-500/[0.09] text-white' : 'border-white/[0.08] text-white/75 hover:border-white/20')}
                >
                  {s}
                </button>
              ))}
              <OwnStep disabled={stepState === 'saved'} onSave={(s) => void saveStep(s)} />
            </div>
            {stepState === 'saved' && <ReminderToggle className="mt-3" />}
            {stepState === 'error' && <p className="mt-2 text-sm text-red-300/90">Adım kaydedilemedi.</p>}
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => void saveCard()} disabled={cardState === 'saved'} className="btn-primary text-sm">
              {cardState === 'saved' ? 'Kartın kaydedildi ✓' : 'Kartımı kaydet'}
            </button>
            <button onClick={toMentor} className="btn-secondary text-sm">Bir mentorla devam et</button>
            <Link href="/calismalar" className="btn-ghost text-sm">Başka bir çalışma</Link>
          </div>
          {cardState === 'error' && <p className="text-sm text-red-300/90">Kart kaydedilemedi.</p>}
        </section>
      )}
    </div>
  );
}

function OwnStep({ onSave, disabled }: { onSave: (s: string) => void; disabled: boolean }) {
  const [v, setV] = useState('');
  return (
    <div className="flex gap-2">
      <input value={v} onChange={(e) => setV(e.target.value.slice(0, 160))} placeholder="Ya da kendi adımını yaz…" className="input-field flex-1 text-base" disabled={disabled} aria-label="Kendi adımın" />
      <button onClick={() => onSave(v.trim())} disabled={disabled || v.trim().length < 3} className="btn-secondary text-sm">Seç</button>
    </div>
  );
}
