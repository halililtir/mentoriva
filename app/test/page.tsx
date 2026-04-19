'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { StoryCard } from '@/components/shared/StoryCard';
import { ACTIVE_MENTORS, getAccent, type MentorMetadata } from '@/lib/mentors/metadata';
import { cn } from '@/lib/cn';

// -----------------------------------------------------------
// Soru & puanlama verisi
// -----------------------------------------------------------

interface Choice {
  text: string;
  scores: Record<string, number>; // mentorId → puan
}

interface Question {
  question: string;
  subtitle?: string;
  choices: Choice[];
}

const QUESTIONS: Question[] = [
  {
    question: 'Hayatında büyük bir kaos anında ilk refleksin hangisi?',
    subtitle: 'İçgüdüsel cevabın önemli.',
    choices: [
      { text: 'İçime döner, bu durumun derinlerde neyi temsil ettiğini anlamaya çalışırım.', scores: { jung: 3, mevlana: 1 } },
      { text: 'Bu kaosu bir sınav olarak görür, irademle ezip geçmeye odaklanırım.', scores: { nietzsche: 3, marcus: 1 } },
      { text: 'Direnmeyi bırakır, bu fırtınanın beni götüreceği yere güvenirim.', scores: { mevlana: 3 } },
      { text: 'Duygularımı bir kenara koyar, sadece kontrol edebildiğim şeylere bakarım.', scores: { marcus: 3, nietzsche: 1 } },
    ],
  },
  {
    question: 'Sence "mutluluk" nedir?',
    choices: [
      { text: 'Karanlık ve aydınlık taraflarımızın birleşmesinden doğan bütünlük.', scores: { jung: 3 } },
      { text: 'Zorlukları aşarken hissedilen o güçlü zafer duygusu.', scores: { nietzsche: 3 } },
      { text: '"Ben"liğin eridiği, her şeyde sevgiyi bulma hâli.', scores: { mevlana: 3, jung: 1 } },
      { text: 'Dış dünyaya bağımlı olmayan, sarsılmaz bir iç dinginlik.', scores: { marcus: 3, mevlana: 1 } },
    ],
  },
  {
    question: 'Bir hata yaptığında kendine ne söylersin?',
    choices: [
      { text: '"Bu hata bilinçaltımın hangi bastırılmış mesajını taşıyor?"', scores: { jung: 3 } },
      { text: '"Hata diye bir şey yok, sadece beni daha güçlü kılan bir yıkım var."', scores: { nietzsche: 3 } },
      { text: '"Kusur, güzelliğin kapısıdır. Bu yara, ışığın içeri girdiği yerdir."', scores: { mevlana: 3 } },
      { text: '"Oldu, geri dönüş yok. Şimdi ne düzeltebilirim? İleriye bak."', scores: { marcus: 3 } },
    ],
  },
  {
    question: 'Toplumun senden beklediği roller hakkında ne hissediyorsun?',
    choices: [
      { text: 'Maskelerin altında gerçek benliğimi korumam gerekiyor.', scores: { jung: 3, nietzsche: 1 } },
      { text: 'Sürü psikolojisi! Kendi değerlerimi yaratmak için bu kalıpları kırmalıyım.', scores: { nietzsche: 3 } },
      { text: 'Görünüşe değil manaya bakarım; uyum sağlar ama kalbimde kendi yolumu yürürüm.', scores: { mevlana: 3, marcus: 1 } },
      { text: 'Sosyal görevlerimi yerine getiririm ama zihnimi kimsenin kölesi yapmam.', scores: { marcus: 3 } },
    ],
  },
  {
    question: 'Gelecek seni korkuttuğunda sığınağın neresi?',
    choices: [
      { text: 'Semboller, rüyalar ve iç dünyamın sınırsız derinliği.', scores: { jung: 3, mevlana: 1 } },
      { text: 'Kendi potansiyelim ve yaratacağım daha güçlü versiyonum.', scores: { nietzsche: 3 } },
      { text: 'Teslimiyet ve her şeyin sonunda bir anlama çıkacağı inancı.', scores: { mevlana: 3 } },
      { text: 'Ölümün doğallığı ve elimdeki tek şey olan "şimdiki an".', scores: { marcus: 3, jung: 1 } },
    ],
  },
  {
    question: 'Birini affetmekte zorlanıyorsun. İlk düşüncen ne?',
    choices: [
      { text: '"Bu kişide beni bu kadar yaralayan şey, aslında benim gölgemle mi ilgili?"', scores: { jung: 3 } },
      { text: '"Affetmek zayıflık değil, ama o kişiyi hayatımdan çıkarmak da güç göstergesi."', scores: { nietzsche: 3, marcus: 1 } },
      { text: '"Affetmek benim yükümü bırakmam. Sevgi, öfkeden daha güçlü bir ateştir."', scores: { mevlana: 3 } },
      { text: '"Başkasının davranışı benim kontrolümde değil. Kendi tepkime odaklanayım."', scores: { marcus: 3 } },
    ],
  },
  {
    question: 'Hayatta "başarı" deyince aklına ilk gelen ne?',
    choices: [
      { text: 'Kendimi tanımak — maskelerin ardındaki gerçek benliğimle barışmak.', scores: { jung: 3, mevlana: 1 } },
      { text: 'Sınırlarımı aşmak — dünkü halimden daha güçlü, daha cesur olmak.', scores: { nietzsche: 3 } },
      { text: 'Huzur — kalbimin sesini dinleyip, sevgiyle dolu bir hayat sürmek.', scores: { mevlana: 3 } },
      { text: 'Erdemli yaşamak — doğru olanı, koşullar ne olursa olsun yapmak.', scores: { marcus: 3, jung: 1 } },
    ],
  },
];

// -----------------------------------------------------------
// Sonuç analizi
// -----------------------------------------------------------

interface MentorResult {
  mentor: MentorMetadata;
  score: number;
  percentage: number;
}

interface QuizResult {
  primary: MentorResult;
  secondary: MentorResult | null;
  all: MentorResult[];
  analysis: string;
  blindSpot: string;
  growth: string;
  shareText: string;
  miniTask: string;
  insightSlap: string;
}

function analyzeResults(scores: Record<string, number>): QuizResult {
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1;

  const results: MentorResult[] = ACTIVE_MENTORS
    .map((m) => ({
      mentor: m,
      score: scores[m.id] ?? 0,
      percentage: Math.round(((scores[m.id] ?? 0) / totalScore) * 100),
    }))
    .sort((a, b) => b.score - a.score);

  const primary = results[0]!;
  const secondary = results[1] && results[1].percentage >= 20 ? results[1] : null;

  const analyses: Record<string, { analysis: string; blindSpot: string; growth: string; shareEmoji: string; miniTask: string; insightSlap: string }> = {
    jung: {
      analysis: 'Zihnin bir arkeolog gibi çalışıyor; yüzeyde değil, derinlerde arıyor cevapları. Bilinçdışının dilini — sembolleri, rüyaları, gölgeleri — okumaya doğal bir eğilimin var. Kendini tanıma yolculuğu senin için süs değil, varoluşsal bir zorunluluk.',
      blindSpot: 'İç dünyanda çok kaybolabilirsin. Analiz felci — sürekli "bu ne anlama geliyor?" sorusu — seni hareketsiz bırakabilir. Bazen bir şeyin sadece olduğu gibi olduğunu kabul etmek de yeter.',
      growth: 'Marcus Aurelius seni dengeler. Derinliğini kaybetmeden, "şimdi ne yapabilirim?" sorusunu daha sık sorman seni rahatlatır.',
      shareEmoji: '🌑',
      miniTask: 'Bugün gece rüyanı hatırlamaya çalış. Uyanınca ilk aklına gelen 3 kelimeyi yaz.',
      insightSlap: 'Anlamak ile yaşamak arasında kaybolmuş birisin.',
    },
    nietzsche: {
      analysis: 'Zihnin bir fırtına gibi; statükoyu reddediyor ve sürekli bir inşa hâlinde. Kendi kurallarını koyan, gücü ve iradeyi kutsayan bir yapın var. Sıradan olmayı içine sindiremezsin — ya yaratırsın, ya yıkarsın.',
      blindSpot: 'Merhameti zayıflık sanabilirsin. Her şeyi tek başına sırtlanma isteğin seni duygusal bir tükenmişliğe sürükleyebilir. Güç her zaman direnç değildir; bazen bırakmak da güçtür.',
      growth: 'Mevlânâ seni dengeler. İradeni biraz olsun akışa bırakmak ve şefkati bir güç olarak görmek zihnini rahatlatır.',
      shareEmoji: '🌪️',
      miniTask: 'Bugün ertelediğin bir şeyi, düşünmeden yap. Sadece yap.',
      insightSlap: 'Güçlü görünmek için harcadığın enerji, seni zayıflatıyor.',
    },
    mevlana: {
      analysis: 'Ruhun bir derviş gibi dönüyor; cevapları akılda değil, kalpte arıyor. Teslimiyet senin için kaçış değil, en derin cesaret biçimi. Sevgiyi, bağlanmayı ve anlamı hayatın merkezine koyuyorsun.',
      blindSpot: 'Teslimiyeti bazen eylemsizlikle karıştırabilirsin. "Her şey bir sebeble olur" düşüncesi, değiştirebileceğin şeylerden de elini çekmene neden olabilir.',
      growth: 'Nietzsche seni dengeler. Aşkla birlikte irade de gerekir. Bazen kapıyı çalmayı bırakıp kendini kırmak gerekir.',
      shareEmoji: '✨',
      miniTask: 'Bugün tanımadığın birine içten bir iltifat et. Karşılık bekleme.',
      insightSlap: 'Teslim oluyorum derken, aslında kaçıyorsun.',
    },
    marcus: {
      analysis: 'Zihnin bir kale gibi; sağlam, disiplinli, rasyonel. Kontrol edemediğin şeylere enerji harcamayı reddediyorsun. Duygular gelip geçer, ama erdem kalır — bu senin motton.',
      blindSpot: 'Rasyonellik bazen duygularını bastırmanın maskesi olabilir. "Her şey kontrolümde" tavrı, savunmasız kalman gereken anlarda seni uzaklaştırabilir.',
      growth: 'Jung seni dengeler. Mantığın yanına biraz iç dünya keşfi eklemek — rüyalarına, sembollerine dikkat etmek — seni daha bütün kılar.',
      shareEmoji: '🏛️',
      miniTask: 'Bugün bir kararı 10 saniyede al. Fazla düşünme, hareket et.',
      insightSlap: 'Kontrol ettiğini sanıyorsun, ama sadece hissetmekten kaçıyorsun.',
    },
  };

  const primaryData = analyses[primary.mentor.id] ?? analyses['jung']!;

  const shareText = secondary
    ? `Zihnimin %${primary.percentage}'i ${primary.mentor.name.split(' ').pop()}, %${secondary.percentage}'i ${secondary.mentor.name.split(' ').pop()} çıktı. ${primaryData.shareEmoji} Sen kiminle yönetiliyorsun? mentoriva.com/test`
    : `Zihnimin %${primary.percentage}'i ${primary.mentor.name.split(' ').pop()} çıktı. ${primaryData.shareEmoji} Sen kiminle yönetiliyorsun? mentoriva.com/test`;

  return {
    primary,
    secondary,
    all: results,
    analysis: primaryData.analysis,
    blindSpot: primaryData.blindSpot,
    growth: primaryData.growth,
    shareText,
    miniTask: primaryData.miniTask,
    insightSlap: primaryData.insightSlap,
  };
}

// -----------------------------------------------------------
// Quiz Component
// -----------------------------------------------------------

export default function QuizPage() {
  const [step, setStep] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);

  const scores = useMemo(() => {
    const s: Record<string, number> = { jung: 0, nietzsche: 0, mevlana: 0, marcus: 0 };
    answers.forEach((choiceIdx, qIdx) => {
      const q = QUESTIONS[qIdx];
      if (!q) return;
      const choice = q.choices[choiceIdx];
      if (!choice) return;
      Object.entries(choice.scores).forEach(([mid, pts]) => {
        s[mid] = (s[mid] ?? 0) + pts;
      });
    });
    return s;
  }, [answers]);

  const result = useMemo(() => {
    if (step !== 'result') return null;
    return analyzeResults(scores);
  }, [step, scores]);

  const handleAnswer = () => {
    if (selectedChoice === null) return;
    const newAnswers = [...answers, selectedChoice];
    setAnswers(newAnswers);
    setSelectedChoice(null);

    if (currentQ + 1 < QUESTIONS.length) {
      setCurrentQ(currentQ + 1);
    } else {
      setStep('result');
    }
  };

  const restart = () => {
    setStep('intro');
    setCurrentQ(0);
    setAnswers([]);
    setSelectedChoice(null);
  };

  const copyShareText = () => {
    if (result?.shareText) {
      navigator.clipboard.writeText(result.shareText).catch(() => {});
    }
  };

  const q = QUESTIONS[currentQ];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#070b14]/80 backdrop-filter backdrop-blur-md">
        <div className="mx-auto max-w-content px-5 py-3.5 flex items-center justify-between">
          <Link href="/" className="inline-flex"><Logo /></Link>
          <nav className="flex gap-3 text-sm">
            <Link href="/" className="text-white/35 hover:text-white/60 transition-colors text-xs">Ana Sayfa</Link>
            <Link href="/hakkimizda" className="text-white/35 hover:text-white/60 transition-colors text-xs">Hakkımızda</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[640px] px-5 py-10 sm:py-16">

        {/* INTRO */}
        {step === 'intro' && (
          <div className="text-center space-y-8 animate-fade-up">
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-wider text-brand-400/70">Kişilik testi</p>
              <h1 className="font-display text-h1 text-balance">
                Zihninin mimarı <span className="text-brand-500">kim</span>?
              </h1>
              <p className="text-[15px] text-white/45 leading-relaxed max-w-[440px] mx-auto">
                7 soru, 4 zihin. Seni en iyi hangi düşünür anlıyor? İçindeki
                felsefi pusulayı keşfet.
              </p>
            </div>

            <div className="flex justify-center -space-x-3">
              {ACTIVE_MENTORS.map((m) => (
                <div
                  key={m.id}
                  className="w-14 h-14 rounded-full overflow-hidden border-2 relative"
                  style={{ borderColor: getAccent(m.accentColor).dark }}
                >
                  <Image src={m.portraitUrl} alt={m.name} fill className="object-cover" sizes="56px" />
                </div>
              ))}
            </div>

            <button onClick={() => setStep('quiz')} className="btn-primary text-base px-8 py-3.5">
              Teste başla →
            </button>

            <p className="text-[11px] text-white/20">
              Yaklaşık 2 dakika · Sonuçlar anlık
            </p>
          </div>
        )}

        {/* QUIZ */}
        {step === 'quiz' && q && (
          <div className="space-y-8 animate-fade-up" key={currentQ}>
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/30">
                <span>Soru {currentQ + 1} / {QUESTIONS.length}</span>
                <span>{Math.round(((currentQ) / QUESTIONS.length) * 100)}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-500"
                  style={{ width: `${((currentQ) / QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="space-y-2">
              <h2 className="font-display text-2xl leading-tight text-balance">
                {q.question}
              </h2>
              {q.subtitle && (
                <p className="text-sm text-white/35">{q.subtitle}</p>
              )}
            </div>

            {/* Choices */}
            <div className="space-y-3">
              {q.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedChoice(i)}
                  className={cn(
                    'w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 text-[14px] leading-relaxed',
                    selectedChoice === i
                      ? 'bg-brand-500/10 border-brand-500/40 text-white/90'
                      : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:border-white/15 hover:bg-white/[0.04]',
                  )}
                >
                  {choice.text}
                </button>
              ))}
            </div>

            <button
              onClick={handleAnswer}
              disabled={selectedChoice === null}
              className="btn-primary w-full"
            >
              {currentQ + 1 < QUESTIONS.length ? 'Sonraki →' : 'Sonuçları gör →'}
            </button>
          </div>
        )}

        {/* RESULT */}
        {step === 'result' && result && (
          <div className="space-y-8 animate-fade-up">
            <div className="text-center space-y-3">
              <p className="text-[11px] uppercase tracking-wider text-brand-400/70">Sonuçların</p>
              <h1 className="font-display text-h1">Zihninin mimarı</h1>
            </div>

            {/* Primary mentor */}
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: getAccent(result.primary.mentor.accentColor).border }}
            >
              <div className="relative h-48 sm:h-56">
                <Image
                  src={result.primary.mentor.portraitUrl}
                  alt={result.primary.mentor.name}
                  fill
                  style={{ objectPosition: result.primary.mentor.portraitPosition ?? 'center' }}
                  className="object-cover brightness-75"
                  sizes="640px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-white/50 mb-1">Ana mentorun</p>
                      <h2
                        className="font-display text-3xl"
                        style={{ color: getAccent(result.primary.mentor.accentColor).hex }}
                      >
                        {result.primary.mentor.name}
                      </h2>
                      <p className="text-xs text-white/40 uppercase tracking-wider mt-1">{result.primary.mentor.title}</p>
                    </div>
                    <div
                      className="text-3xl font-display font-bold"
                      style={{ color: getAccent(result.primary.mentor.accentColor).hex }}
                    >
                      %{result.primary.percentage}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Score bars */}
            <div className="space-y-3">
              {result.all.map((r) => {
                const a = getAccent(r.mentor.accentColor);
                return (
                  <div key={r.mentor.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg overflow-hidden relative flex-shrink-0 border" style={{ borderColor: a.border }}>
                      <Image src={r.mentor.portraitUrl} alt={r.mentor.name} fill className="object-cover" sizes="32px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/60 truncate">{r.mentor.name.split(' ').pop()}</span>
                        <span style={{ color: a.hex }}>%{r.percentage}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.percentage}%`, background: a.hex }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Analiz */}
            <div className="space-y-5">
              {/* Tek cümlelik tokat */}
              <div
                className="p-6 rounded-2xl text-center border"
                style={{
                  borderColor: getAccent(result.primary.mentor.accentColor).border,
                  background: getAccent(result.primary.mentor.accentColor).bg,
                }}
              >
                <p
                  className="font-display text-xl sm:text-2xl leading-snug italic"
                  style={{ color: getAccent(result.primary.mentor.accentColor).hex }}
                >
                  {'\u201c'}{result.insightSlap}{'\u201d'}
                </p>
              </div>

              <div className="card-surface p-5 space-y-2">
                <h3 className="font-display text-lg text-white/90">Analiz</h3>
                <p className="text-sm text-white/55 leading-relaxed">{result.analysis}</p>
              </div>
              <div className="card-surface p-5 space-y-2">
                <h3 className="font-display text-lg text-white/90">Kör noktaların</h3>
                <p className="text-sm text-white/55 leading-relaxed">{result.blindSpot}</p>
              </div>
              <div className="card-surface p-5 space-y-2">
                <h3 className="font-display text-lg text-white/90">Gelişim önerisi</h3>
                <p className="text-sm text-white/55 leading-relaxed">{result.growth}</p>
              </div>

              {/* Mini görev */}
              <div className="card-surface p-5 space-y-2 border-l-2" style={{ borderLeftColor: getAccent(result.primary.mentor.accentColor).hex, borderRadius: 0 }}>
                <h3 className="font-display text-lg text-white/90">Bugünkü görevin</h3>
                <p className="text-sm text-white/70 leading-relaxed">{result.miniTask}</p>
              </div>
            </div>

            {/* CTA */}
            <div className="card-surface p-6 text-center space-y-4" style={{ borderColor: getAccent(result.primary.mentor.accentColor).border }}>
              <p className="text-sm text-white/50">
                {result.primary.mentor.name} ile konuşmaya hazır mısın?
              </p>
              <Link
                href="/"
                className="btn-primary inline-flex"
              >
                Mentorunla konuşmaya başla →
              </Link>
            </div>

            {/* Paylaş */}
            <div className="card-surface p-5 space-y-4">
              <h3 className="font-display text-base text-white/80">Paylaş</h3>

              {/* Story kartı */}
              <StoryCard
                mentor={result.primary.mentor}
                percentage={result.primary.percentage}
                insightSlap={result.insightSlap}
                secondaryMentor={result.secondary ? {
                  name: result.secondary.mentor.name,
                  percentage: result.secondary.percentage,
                } : null}
              />

              {/* Metin paylaşım */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/50 leading-relaxed">
                {result.shareText}
              </div>
              <button onClick={copyShareText} className="btn-secondary text-xs">
                Metni kopyala
              </button>
            </div>

            {/* Tekrar */}
            <div className="flex justify-center gap-3">
              <button onClick={restart} className="btn-secondary text-sm">
                Testi tekrarla
              </button>
              <Link href="/" className="btn-ghost text-sm">
                Ana sayfaya dön
              </Link>
            </div>

            <div className="flex items-center justify-center gap-4 mt-6 text-xs">
              <a href="mailto:info@mentoriva.com.tr" className="text-white/25 hover:text-white/50 transition-colors">
                info@mentoriva.com.tr
              </a>
              <a href="https://instagram.com/mentoriva_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-white/25 hover:text-white/50 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                @mentoriva_
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
