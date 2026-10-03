'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { CrisisNotice } from '@/components/mentors/CrisisNotice';
import { JourneyFrame, JourneyQuestion } from '@/components/journey/JourneyFrame';
import { JourneyResultView } from '@/components/journey/JourneyResult';
import { JourneyHome } from '@/components/journey/JourneyHome';
import { useSession } from '@/lib/session';
import { track } from '@/lib/analytics';
import { DRAFT_KEY, PRESELECT_KEY } from '@/lib/flow-keys';
import { ANSWER_MAX, JOURNEY_COST, QUESTION_COUNT, STARTING_POINTS, STORY_MAX, STORY_MIN } from '@/lib/journey/content';
import type { JourneyResult } from '@/lib/journey/schema';
import { cn } from '@/lib/cn';
import type { MentorId } from '@/types';
import { checkBadges } from '@/components/shared/BadgeToaster';

type Step = 'home' | 'where' | 'story' | 'questions' | 'thinking' | 'result' | 'crisis';

/**
 * Kendine Yolculuk — yazılanlar yalnızca bu sekmenin belleğinde tutulur;
 * sayfa yenilenince ya da yolculuk bırakılınca kaybolur.
 */
export default function YolculukPage() {
  const router = useRouter();
  const { status, user, setRemaining } = useSession();
  const [step, setStep] = useState<Step>('home');
  const [spId, setSpId] = useState<string>('');
  const [spCustom, setSpCustom] = useState('');
  const [story, setStory] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(Array(QUESTION_COUNT).fill(''));
  const [qIndex, setQIndex] = useState(0);
  const [token, setToken] = useState('');
  const [result, setResult] = useState<JourneyResult | null>(null);
  const [startingPointLabel, setStartingPointLabel] = useState('');
  const [error, setError] = useState('');
  const [crisisMessage, setCrisisMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, qIndex]);

  const startingPoint = spId === 'custom' ? spCustom.trim() : spId;
  const reset = () => {
    setStep('home');
    setSpId('');
    setSpCustom('');
    setStory('');
    setQuestions([]);
    setAnswers(Array(QUESTION_COUNT).fill(''));
    setQIndex(0);
    setToken('');
    setResult(null);
    setError('');
  };

  const exit = () => {
    if (story && step !== 'result' && !window.confirm('Yolculuğu bırakmak istiyor musun? Yazdıkların silinecek.')) return;
    track('journey_exit', { at: step });
    reset();
  };

  const begin = () => {
    if (status !== 'user') {
      router.push('/kayit?next=/yolculuk');
      return;
    }
    track('journey_begin');
    setStep('where');
  };

  // 2 → 3: soruları iste
  const submitStory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/journey/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startingPoint, story }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.crisis) {
        setCrisisMessage(data.message);
        setStep('crisis');
        return;
      }
      if (!res.ok) {
        setError(data.error ?? 'Bir sorun oluştu, tekrar dener misin?');
        return;
      }
      setQuestions(data.questions);
      setToken(data.token);
      if (typeof data.remaining === 'number') setRemaining(data.remaining);
      setQIndex(0);
      setStep('questions');
      track('journey_questions');
    } catch {
      setError('Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  // 3 → 4: sonucu iste
  const submitAnswers = async () => {
    setStep('thinking');
    setError('');
    try {
      const res = await fetch('/api/v1/journey/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.crisis) {
        setCrisisMessage(data.message);
        setStep('crisis');
        return;
      }
      if (!res.ok) {
        setError(data.error ?? 'Sonucun hazırlanamadı.');
        setStep('questions');
        setQIndex(QUESTION_COUNT - 1);
        return;
      }
      setResult(data.result);
      setStartingPointLabel(data.startingPoint ?? '');
      setStep('result');
      track('journey_result');
      checkBadges();
    } catch {
      setError('Bağlantı kurulamadı. Cevapların duruyor; tekrar dene.');
      setStep('questions');
      setQIndex(QUESTION_COUNT - 1);
    }
  };

  const continueWithMentor = (mentorId: MentorId, question: string) => {
    try {
      sessionStorage.setItem(PRESELECT_KEY, mentorId);
      sessionStorage.setItem(DRAFT_KEY, question);
    } catch {}
    track('journey_to_mentor', { mentor: mentorId });
    router.push('/');
  };

  const notEnough = user ? user.remaining < JOURNEY_COST : false;

  return (
    <div className="min-h-dvh" ref={topRef}>
      <Header />

      {step === 'home' && <JourneyHome onBegin={begin} notEnough={notEnough} />}

      {step === 'where' && (
        <JourneyFrame stage={0} onBack={() => setStep('home')} onExit={exit}>
          <JourneyQuestion eyebrow="Kendine Yolculuk" title="Şu an neredesin?" hint="Sana en yakın olanı seç. Yanlış cevap yok." />
          <div className="mt-8 space-y-2" role="radiogroup" aria-label="Başlangıç noktası">
            {STARTING_POINTS.map((p, i) => (
              <button
                key={p.id}
                role="radio"
                aria-checked={spId === p.id}
                onClick={() => setSpId(p.id)}
                className={cn(
                  'w-full rounded-2xl border px-4 py-3.5 text-left text-[15px] transition-all duration-300 animate-fade-in [animation-fill-mode:both]',
                  spId === p.id ? 'border-brand-400/60 bg-brand-500/[0.08] text-white' : 'border-white/[0.08] text-white/70 hover:border-white/20 hover:text-white',
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {p.label}
              </button>
            ))}
            <div className={cn('rounded-2xl border px-4 py-3 transition-colors', spId === 'custom' ? 'border-brand-400/60 bg-brand-500/[0.05]' : 'border-white/[0.08]')}>
              <label className="block text-[13px] text-white/50" htmlFor="sp-custom">Ya da kendi cümlenle yaz</label>
              <input
                id="sp-custom"
                value={spCustom}
                onChange={(e) => { setSpCustom(e.target.value); setSpId(e.target.value.trim() ? 'custom' : ''); }}
                maxLength={160}
                placeholder="Örn. Bir ilişkinin sonundayım ve ne hissettiğimi bilmiyorum."
                className="mt-1 w-full bg-transparent py-1 text-[15px] text-white/90 placeholder:text-white/25 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
          <button onClick={() => setStep('story')} disabled={!startingPoint} className="btn-primary mt-8 w-full sm:w-auto">
            Devam
          </button>
        </JourneyFrame>
      )}

      {step === 'story' && (
        <JourneyFrame stage={1} onBack={() => setStep('where')} onExit={exit}>
          <JourneyQuestion title="İçinden geçeni anlat" hint="Kusursuz bir soru kurmana gerek yok. Aklından geçenleri, olduğun yerden anlat." />
          <div className="focus-ring-gradient mt-7">
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={8}
              maxLength={STORY_MAX}
              autoFocus
              placeholder="Ne oluyor, ne hissediyorsun, seni en çok ne düşündürüyor…"
              className="block w-full resize-none rounded-[calc(1.25rem-1px)] bg-ink-50/95 px-5 py-4 text-[16px] leading-relaxed text-paper placeholder:text-white/25 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-label="Anlatımın"
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-white/35">
            <span>{story.trim().length < STORY_MIN ? `En az ${STORY_MIN} karakter` : 'Yazdıkların kaydedilmez.'}</span>
            <span className="tabular-nums">{story.length}/{STORY_MAX}</span>
          </div>
          {error && <p role="alert" className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-3.5 py-2.5 text-sm text-red-200/90">{error}</p>}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button onClick={submitStory} disabled={loading || story.trim().length < STORY_MIN || notEnough} className="btn-primary w-full sm:w-auto">
              {loading ? 'Sorular hazırlanıyor…' : 'Devam'}
            </button>
            <span className="text-xs text-white/35">
              {notEnough ? `Bu yolculuk için ${JOURNEY_COST} soru hakkı gerekiyor.` : `Yolculuk ${JOURNEY_COST} soru hakkı kullanır · kalan ${user?.remaining ?? '-'}`}
            </span>
          </div>
        </JourneyFrame>
      )}

      {step === 'questions' && questions.length === QUESTION_COUNT && (
        <JourneyFrame
          stage={2}
          onBack={() => (qIndex === 0 ? setStep('story') : setQIndex(qIndex - 1))}
          onExit={exit}
        >
          <div key={qIndex}>
            <JourneyQuestion eyebrow={`Soru ${qIndex + 1} / ${QUESTION_COUNT}`} title={questions[qIndex]!} />
            <div className="focus-ring-gradient mt-7">
              <textarea
                value={answers[qIndex]}
                onChange={(e) => setAnswers((a) => a.map((x, i) => (i === qIndex ? e.target.value : x)))}
                rows={5}
                maxLength={ANSWER_MAX}
                autoFocus
                placeholder="Aklına ilk geleni yaz…"
                className="block w-full resize-none rounded-[calc(1.25rem-1px)] bg-ink-50/95 px-5 py-4 text-[16px] leading-relaxed text-paper placeholder:text-white/25 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label={`Soru ${qIndex + 1} cevabın`}
              />
            </div>
            {error && <p role="alert" className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-3.5 py-2.5 text-sm text-red-200/90">{error}</p>}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => (qIndex < QUESTION_COUNT - 1 ? setQIndex(qIndex + 1) : void submitAnswers())}
                disabled={!answers[qIndex]?.trim()}
                className="btn-primary"
              >
                {qIndex < QUESTION_COUNT - 1 ? 'Devam' : 'Sonucumu gör'}
              </button>
              <button
                onClick={() => (qIndex < QUESTION_COUNT - 1 ? setQIndex(qIndex + 1) : void submitAnswers())}
                className="text-sm text-white/40 hover:text-white/70"
              >
                Bu soruyu geç
              </button>
            </div>
          </div>
        </JourneyFrame>
      )}

      {step === 'thinking' && (
        <JourneyFrame stage={3}>
          <div className="flex flex-col items-center text-center" role="status">
            <span className="relative flex h-24 w-24 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-brand-500/20 blur-xl animate-breathe" />
              <span className="absolute inset-3 rounded-full border border-brand-400/30 animate-breathe" style={{ animationDelay: '0.6s' }} />
              <span className="h-3 w-3 rounded-full bg-brand-300" />
            </span>
            <p className="mt-8 font-display text-2xl text-white/85">Cevapların üzerine düşünülüyor</p>
            <p className="mt-2 text-sm text-white/45">Derin bir nefes al. Yazdıklarına birlikte bakıyoruz.</p>
          </div>
        </JourneyFrame>
      )}

      {step === 'result' && result && (
        <JourneyFrame stage={4} onExit={reset}>
          <JourneyResultView
            result={result}
            startingPoint={startingPointLabel}
            onContinueWithMentor={continueWithMentor}
            onRestart={reset}
          />
        </JourneyFrame>
      )}

      {step === 'crisis' && (
        <JourneyFrame stage={null}>
          <CrisisNotice message={crisisMessage} onBack={reset} />
          <p className="mt-6 text-center text-xs text-white/35">
            <Link href="/" className="text-brand-300/80 hover:text-brand-200">Ana sayfaya dön</Link>
          </p>
        </JourneyFrame>
      )}

      {step === 'home' && <Footer />}
    </div>
  );
}
