'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { CrisisNotice } from '@/components/mentors/CrisisNotice';
import { FeelingExplorer } from '@/components/feelings/FeelingExplorer';
import { FeelingCardView, type CardDraft } from '@/components/feelings/FeelingCard';
import { SavedCards } from '@/components/feelings/SavedCards';
import { useSession } from '@/lib/session';
import { GuestConsent } from '@/components/shared/GuestConsent';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { BODY_NOTES, CARD_LIMITS, FEELING_BY_ID, FEELINGS_TEXT_MAX, MATTERS, START_PHRASES } from '@/lib/feelings/content';

type Step = 'intro' | 'start' | 'context' | 'words' | 'thought' | 'matters' | 'card' | 'crisis';

const STAGES: Array<{ step: Step; label: string }> = [
  { step: 'start', label: 'Şu an' },
  { step: 'context', label: 'Ne oldu' },
  { step: 'words', label: 'Kelimeler' },
  { step: 'matters', label: 'Önemli olan' },
  { step: 'card', label: 'Kartın' },
];

/** Misafir kayıt olup dönünce kartı kaybolmasın (yalnızca bu sekme). */
const CARD_DRAFT_KEY = 'mentoriva_card_draft';

interface Suggestion { id: string; why: string }

/**
 * "İçimde ne var?" — yazılanlar bu sekmenin belleğinde kalır; yalnızca kişi
 * "Kartımı kaydet" derse hesabına yazılır. Amaç "sistem duygumu bildi" değil,
 * "yaşadığımı daha iyi ifade edebiliyorum".
 */
export default function IcimdePage() {
  const router = useRouter();
  const { status } = useSession();
  const [step, setStep] = useState<Step>('intro');
  const [phrases, setPhrases] = useState<string[]>([]);
  const [ownWords, setOwnWords] = useState('');
  const [story, setStory] = useState('');
  const [body, setBody] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [thoughtFound, setThoughtFound] = useState('');
  const [feelings, setFeelings] = useState<string[]>([]);
  const [customFeeling, setCustomFeeling] = useState('');
  const [unsure, setUnsure] = useState(false);
  const [thought, setThought] = useState('');
  const [matters, setMatters] = useState<string[]>([]);
  const [mattersNote, setMattersNote] = useState('');
  const [restored, setRestored] = useState<CardDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [crisis, setCrisis] = useState('');
  const [consent, setConsent] = useState(false);
  const isGuest = status === 'guest';
  const hasText = !!(ownWords.trim() || story.trim());

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  // Kayıttan dönen misafirin kartı
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CARD_DRAFT_KEY);
      if (!raw) return;
      setRestored(JSON.parse(raw) as CardDraft);
      setStep('card');
    } catch {}
  }, []);

  const toggle = (set: React.Dispatch<React.SetStateAction<string[]>>, v: string, max: number = CARD_LIMITS.items) =>
    set((list) => (list.includes(v) ? list.filter((x) => x !== v) : list.length >= max ? list : [...list, v]));

  const reset = () => {
    setStep('intro'); setPhrases([]); setOwnWords(''); setStory(''); setBody([]); setSuggestions([]);
    setThoughtFound(''); setFeelings([]); setCustomFeeling(''); setUnsure(false); setThought('');
    setMatters([]); setMattersNote(''); setRestored(null); setError('');
    try { sessionStorage.removeItem(CARD_DRAFT_KEY); } catch {}
  };

  /** "Ne oldu" adımından sonra: kelime önerisi (anlatım yoksa yapay zekâ çağrılmaz). */
  const fetchWords = useCallback(async () => {
    setLoading(true);
    setError('');
    const text = [ownWords.trim(), story.trim()].filter(Boolean).join('\n');
    try {
      const res = await fetch('/api/v1/feelings/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrases, body, text, ...(isGuest && text ? { consent: true } : {}) }),
      });
      const data = (await res.json().catch(() => null)) as { suggestions?: Suggestion[]; thought?: string; crisis?: string; error?: string } | null;
      if (data?.crisis) { setCrisis(data.crisis); setStep('crisis'); return; }
      if (!res.ok) { setError(data?.error ?? 'Öneriler getirilemedi; sözlükten kendin seçebilirsin.'); setSuggestions([]); }
      else {
        setSuggestions(data?.suggestions ?? []);
        setThoughtFound(data?.thought ?? '');
      }
      track('feelings_words', { ai: !!text });
      setStep('words');
    } catch {
      setError('Bağlantı kurulamadı; sözlükten kendin seçebilirsin.');
      setStep('words');
    } finally {
      setLoading(false);
    }
  }, [ownWords, story, phrases, body, isGuest]);

  const afterWords = () => {
    const custom = customFeeling.trim();
    if (custom && !feelings.includes(custom)) setFeelings((f) => [...f, custom].slice(0, CARD_LIMITS.items));
    setStep(thoughtFound ? 'thought' : 'matters');
  };

  const draft: CardDraft = restored ?? {
    situation: [START_PHRASES.filter((p) => phrases.includes(p.id) && p.id !== 'anlatamiyorum').map((p) => p.text).join(', '), ownWords.trim(), story.trim()]
      .filter(Boolean).join('. ').slice(0, CARD_LIMITS.situation),
    feelings: [...feelings.map((f) => FEELING_BY_ID.get(f)?.name ?? f), ...(unsure && !feelings.length ? ['Henüz emin değilim'] : [])],
    thought,
    matters,
    note: mattersNote.trim(),
    step: '',
  };

  const stageIndex = STAGES.findIndex((s) => s.step === (step === 'thought' ? 'words' : step));

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-14 pt-6">
        {step !== 'intro' && step !== 'crisis' && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const order: Step[] = ['intro', 'start', 'context', 'words', 'thought', 'matters', 'card'];
                let i = order.indexOf(step) - 1;
                if (order[i] === 'thought' && !thoughtFound) i -= 1;
                setStep(order[Math.max(0, i)]!);
              }}
              className="btn-ghost text-sm"
            >
              ← Geri
            </button>
            <button onClick={reset} className="text-xs text-white/35 hover:text-white/70">Baştan başla</button>
          </div>
        )}

        {stageIndex >= 0 && (
          <div className="mt-5" aria-label={`${STAGES[stageIndex]!.label} — ${stageIndex + 1}/${STAGES.length}`}>
            <div className="flex gap-1.5">
              {STAGES.map((s, i) => (
                <span key={s.step} className={cn('h-1 flex-1 rounded-full transition-colors duration-700', i <= stageIndex ? 'bg-brand-400/80' : 'bg-white/[0.07]')} />
              ))}
            </div>
            <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/35">{STAGES[stageIndex]!.label}</p>
          </div>
        )}

        <div className="flex flex-1 flex-col justify-center py-8">
          {step === 'intro' && (
            <div className="text-center animate-fade-up">
              <p className="eyebrow justify-center">İçimde ne var?</p>
              <h1 className="mt-4 font-display text-[clamp(2rem,5vw,2.9rem)] leading-tight text-balance">
                Duygunun adını <span className="italic text-gradient">bilmen gerekmiyor.</span>
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-white/60">
                Bazen yalnızca sıkışmış, karışık ya da hafif hissederiz. Birkaç küçük adımla yaşadığını kendi kelimelerinle anlatmayı deneyelim.
                Sonunda düzenleyebileceğin bir farkındalık kartın olur. Her adım isteğe bağlı; test değil, teşhis yok.
              </p>
              <button onClick={() => { setStep('start'); track('feelings_start'); }} className="btn-primary mt-8 inline-flex">Başlayalım</button>
              <p className="mt-3 text-[12px] text-white/35">Yazdıkların kaydedilmez; kartını yalnızca sen istersen hesabına kaydedersin.</p>
              {status === 'user' && <SavedCards className="mt-12 text-left" />}
            </div>
          )}

          {step === 'start' && (
            <section className="animate-fade-up">
              <h2 className="font-display text-2xl sm:text-3xl">Şu an yaşadığını hangisi daha iyi anlatıyor?</h2>
              <p className="mt-2 text-sm text-white/50">Birden fazlasını seçebilirsin. Hiçbiri uymuyorsa kendi cümleni yaz.</p>
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {START_PHRASES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => toggle(setPhrases, p.id)}
                    aria-pressed={phrases.includes(p.id)}
                    className={cn(
                      'rounded-2xl border px-4 py-3.5 text-left text-[15px] transition',
                      phrases.includes(p.id) ? 'border-brand-400/50 bg-brand-500/[0.09] text-white' : 'border-white/[0.08] text-white/75 hover:border-white/20',
                    )}
                  >
                    {p.text}
                  </button>
                ))}
              </div>
              <input
                value={ownWords}
                onChange={(e) => setOwnWords(e.target.value.slice(0, 200))}
                placeholder="Ya da kendi cümlenle… (isteğe bağlı)"
                className="input-field mt-4 w-full text-base"
                aria-label="Kendi cümlen"
              />
              <div className="mt-6 flex justify-end">
                <button onClick={() => setStep('context')} disabled={!phrases.length && !ownWords.trim()} className="btn-primary">Devam</button>
              </div>
            </section>
          )}

          {step === 'context' && (
            <section className="animate-fade-up">
              <h2 className="font-display text-2xl sm:text-3xl">Ne yaşandı?</h2>
              <p className="mt-2 text-sm text-white/50">Belirgin bir olay varsa birkaç cümleyle anlat. Yoksa boş bırakıp devam edebilirsin.</p>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value.slice(0, FEELINGS_TEXT_MAX))}
                rows={4}
                placeholder="Örneğin: Bugün toplantıda fikrimi söyledim, kimse bir şey demedi…"
                className="input-field mt-5 min-h-[120px] w-full resize-y text-base"
                aria-label="Ne yaşandı"
              />
              <p className="mt-6 text-sm text-white/60">Bedeninde bir şey fark ediyor musun? <span className="text-white/35">(isteğe bağlı; bundan bir sonuç çıkarmayacağız)</span></p>
              <div className="mt-3 flex flex-wrap gap-2">
                {BODY_NOTES.map((b) => (
                  <button
                    key={b}
                    onClick={() => toggle(setBody, b)}
                    aria-pressed={body.includes(b)}
                    className={cn('rounded-full border px-3 py-1.5 text-[13px] transition', body.includes(b) ? 'border-white/30 bg-white/[0.07] text-white' : 'border-white/10 text-white/55 hover:text-white/80')}
                  >
                    {b}
                  </button>
                ))}
              </div>
              {isGuest && hasText && <GuestConsent checked={consent} onChange={setConsent} className="mt-6" />}
              <div className="mt-8 flex items-center justify-end gap-3">
                <button onClick={() => void fetchWords()} disabled={loading || (isGuest && hasText && !consent)} className="btn-primary">
                  {loading ? 'Kelimeler aranıyor…' : 'Kelimelere bakalım'}
                </button>
              </div>
            </section>
          )}

          {step === 'words' && (
            <section className="animate-fade-up">
              <h2 className="font-display text-2xl sm:text-3xl">Bunlardan hangisi sana yakın?</h2>
              <p className="mt-2 text-sm text-white/50">
                Bunlar yalnızca öneri; doğruyu sen bilirsin. Birden fazlası olabilir, hiçbiri de olmayabilir.
              </p>
              {error && <p className="mt-3 text-sm text-amber-300/90">{error}</p>}

              {suggestions.length > 0 && (
                <ul className="mt-5 space-y-2.5">
                  {suggestions.map((s) => {
                    const f = FEELING_BY_ID.get(s.id);
                    if (!f) return null;
                    const on = feelings.includes(s.id);
                    return (
                      <li key={s.id}>
                        <button
                          onClick={() => { toggle(setFeelings, s.id); setUnsure(false); }}
                          aria-pressed={on}
                          className={cn('w-full rounded-2xl border px-4 py-3 text-left transition', on ? 'border-brand-400/50 bg-brand-500/[0.09]' : 'border-white/[0.08] hover:border-white/20')}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="font-display text-lg text-white/90">{f.name}</span>
                            <span className="text-[12px] text-white/40">{on ? 'Bana yakın ✓' : 'Seç'}</span>
                          </span>
                          <span className="mt-0.5 block text-[13px] leading-relaxed text-white/55">{s.why || f.desc}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <details className="group mt-6 rounded-2xl border border-white/[0.07] p-4" open={!suggestions.length}>
                <summary className="cursor-pointer list-none text-sm text-white/70">
                  <span className="mr-1.5 inline-block transition group-open:rotate-90">›</span>
                  Bütün duygulara göz at
                </summary>
                <div className="mt-4">
                  <FeelingExplorer selected={feelings} onToggle={(id) => { toggle(setFeelings, id); setUnsure(false); }} />
                </div>
              </details>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <input
                  value={customFeeling}
                  onChange={(e) => setCustomFeeling(e.target.value.slice(0, CARD_LIMITS.item))}
                  placeholder="Kendi kelimeni yaz"
                  className="input-field w-full flex-1 text-base sm:w-auto"
                  aria-label="Kendi kelimen"
                />
                <button
                  onClick={() => { setUnsure(true); setFeelings([]); }}
                  aria-pressed={unsure}
                  className={cn('rounded-full border px-3.5 py-2 text-[13px]', unsure ? 'border-white/30 bg-white/[0.07] text-white' : 'border-white/10 text-white/55')}
                >
                  Emin değilim / Hiçbiri
                </button>
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={afterWords} className="btn-primary">Devam</button>
              </div>
            </section>
          )}

          {step === 'thought' && (
            <section className="animate-fade-up">
              <h2 className="font-display text-2xl sm:text-3xl">Aklından geçenle hissettiğin</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/65">
                Yazdıklarında şu cümle var: <span className="text-white">&ldquo;{thoughtFound}&rdquo;</span>. Bu, aklından geçen bir yorum olabilir;
                doğru da olabilir, olmayabilir de. Duygun ise başka bir şey. İkisini kartında ayrı satırlarda tutmak ister misin?
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <button onClick={() => { setThought(thoughtFound); setStep('matters'); }} className="btn-primary">Evet, ayrı yazalım</button>
                <button onClick={() => { setThought(''); setStep('matters'); }} className="btn-secondary">Hayır, gerek yok</button>
              </div>
            </section>
          )}

          {step === 'matters' && (
            <section className="animate-fade-up">
              <h2 className="font-display text-2xl sm:text-3xl">Bu durumda senin için önemli olan ne?</h2>
              <p className="mt-2 text-sm text-white/50">Aynı duyguyu yaşayan iki kişinin ihtiyacı farklı olabilir. Sana uyanları seç ya da kendin yaz.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {MATTERS.map((m) => (
                  <button
                    key={m}
                    onClick={() => toggle(setMatters, m)}
                    aria-pressed={matters.includes(m)}
                    className={cn('rounded-full border px-3.5 py-2 text-[13.5px] transition', matters.includes(m) ? 'border-brand-400/50 bg-brand-500/[0.09] text-white' : 'border-white/10 text-white/60 hover:text-white/85')}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                value={mattersNote}
                onChange={(e) => setMattersNote(e.target.value.slice(0, CARD_LIMITS.note))}
                placeholder="Kendi kelimelerinle… (isteğe bağlı)"
                className="input-field mt-4 w-full text-base"
                aria-label="Senin için önemli olan"
              />
              <div className="mt-8 flex justify-end">
                <button onClick={() => setStep('card')} className="btn-primary">Kartımı göster</button>
              </div>
            </section>
          )}

          {step === 'card' && (
            <FeelingCardView
              initial={draft}
              onGuestSave={(card) => {
                try { sessionStorage.setItem(CARD_DRAFT_KEY, JSON.stringify(card)); } catch {}
                router.push('/kayit?next=/icimde');
              }}
              onSaved={() => { try { sessionStorage.removeItem(CARD_DRAFT_KEY); } catch {} }}
              onRestart={reset}
            />
          )}

          {step === 'crisis' && <CrisisNotice message={crisis} onBack={reset} />}
        </div>

        {step === 'intro' && (
          <p className="text-center text-[12px] text-white/30">
            Daha uzun bir çalışma mı istiyorsun? <Link href="/yolculuk" className="underline underline-offset-2 hover:text-white/60">Kendine Yolculuk</Link>
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
