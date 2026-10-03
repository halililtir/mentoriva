'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { ToastProvider, showToast } from '@/components/shared/Toast';
import { Hero } from '@/components/home/Hero';
import { GoodToKnow, HowItWorks, SectionHeading, TraditionsStrip, WhyMentoriva } from '@/components/home/Sections';
import { UseCases } from '@/components/home/UseCases';
import { Faq } from '@/components/home/Faq';
import { FinalCta } from '@/components/home/FinalCta';
import { FlowSteps } from '@/components/home/FlowSteps';
import { DailyQuestion } from '@/components/home/DailyQuestion';
import { JourneyTeaser } from '@/components/home/JourneyTeaser';
import { SelectionDock } from '@/components/home/SelectionDock';
import { MentorGalleryCard } from '@/components/mentors/MentorGalleryCard';
import { AskView } from '@/components/mentors/AskView';
import { SingleResponseView } from '@/components/mentors/SingleResponseView';
import { CompareView } from '@/components/mentors/CompareView';
import { LimitReachedView } from '@/components/mentors/LimitReachedView';
import { ChatView } from '@/components/chat/ChatView';
import { Reveal } from '@/components/ui/Reveal';
import { ACTIVE_MENTORS, COMING_SOON_MENTORS, getActiveMentor, isActiveMentor } from '@/lib/mentors/metadata';
import { useSession } from '@/lib/session';
import { DRAFT_KEY, PRESELECT_KEY } from '@/lib/flow-keys';
import { track } from '@/lib/analytics';
import type { MentorId } from '@/types';

type View = 'gallery' | 'ask' | 'single-response' | 'compare' | 'chat' | 'limit';

interface ChatState {
  mentorId: MentorId;
  question: string;
  response: string;
}

const MAX_SELECTED = 4;

export default function HomePage() {
  const router = useRouter();
  const session = useSession();
  const user = session.user;
  const [view, setView] = useState<View>('gallery');
  const [selectedIds, setSelectedIds] = useState<MentorId[]>([]);
  const [question, setQuestion] = useState('');
  const [draft, setDraft] = useState('');
  const [chat, setChat] = useState<ChatState | null>(null);
  const [cachedResponses, setCachedResponses] = useState<Record<string, string>>({});
  const galleryRef = useRef<HTMLElement>(null);

  // Görünüm değişince sayfanın başına dön
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  // Kayıttan dönen ziyaretçinin seçtiği örnek soruyu geri yükle
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) setDraft(saved);
    } catch {}
  }, []);

  // Kişilik testinden gelen kullanıcı: mentoru seçili aç; giriş yaptıysa doğrudan soru ekranı
  useEffect(() => {
    if (session.status === 'loading') return;
    let id: string | null = null;
    try { id = sessionStorage.getItem(PRESELECT_KEY); } catch {}
    // Alıntı sayfalarından gelen ?mentor= parametresi
    const url = new URL(window.location.href);
    id = id ?? url.searchParams.get('mentor');
    if (url.searchParams.has('mentor')) {
      url.searchParams.delete('mentor');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
    if (!id || !isActiveMentor(id)) return;
    try { sessionStorage.removeItem(PRESELECT_KEY); } catch {}
    setSelectedIds([id]);
    if (session.status === 'user' && (session.user?.remaining ?? 0) > 0) setView('ask');
    else setTimeout(() => galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  }, [session.status, session.user?.remaining]);

  const saveDraft = useCallback((q: string) => {
    setDraft(q);
    try {
      if (q) sessionStorage.setItem(DRAFT_KEY, q);
      else sessionStorage.removeItem(DRAFT_KEY);
    } catch {}
  }, []);

  const toggleMentor = useCallback((id: MentorId) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTED) {
        showToast('En fazla 4 mentor seçebilirsin', 'warning');
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const scrollToGallery = useCallback(() => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToHow = useCallback(() => {
    document.getElementById('nasil-calisir')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const requireAccount = useCallback(() => {
    showToast('Soru sormak için ücretsiz hesabını oluştur ya da giriş yap', 'info');
    router.push('/kayit?next=/');
  }, [router]);

  const goToAsk = useCallback(() => {
    if (selectedIds.length === 0) return;
    if (session.status !== 'user') return requireAccount();
    if (user && user.remaining <= 0) return setView('limit');
    setView('ask');
  }, [selectedIds, session.status, user, requireAccount]);

  /** "Ne sorabilirim?" bölümünden bir soru seçildi. */
  const handlePickQuestion = useCallback((q: string) => {
    saveDraft(q);
    if (session.status !== 'user') return requireAccount();
    if (selectedIds.length > 0) {
      if (user && user.remaining <= 0) return setView('limit');
      return setView('ask');
    }
    showToast('Güzel soru. Şimdi kime soracağını seç.', 'success');
    scrollToGallery();
  }, [saveDraft, session.status, selectedIds.length, user, requireAccount, scrollToGallery]);

  const handleSubmitQuestion = useCallback((q: string) => {
    if (user && user.remaining <= 0) return setView('limit');
    saveDraft('');
    track('question_asked', { mentors: selectedIds.length });
    setQuestion(q);
    setView(selectedIds.length === 1 ? 'single-response' : 'compare');
  }, [selectedIds, user, saveDraft]);

  const handleContinueToChat = useCallback((mentorId: MentorId, response: string) => {
    // Cevabı cache'le — geri dönülürse aynı soru tekrar ücretlendirilmesin
    setCachedResponses((prev) => ({ ...prev, [`${mentorId}:${question}`]: response }));
    setChat({ mentorId, question, response });
    setView('chat');
  }, [question]);

  /** Sunucu oturum düştü (401) veya kota bitti (429) dediğinde. */
  const handleAuthRequired = useCallback(() => {
    void session.refresh();
    router.push('/giris?next=/');
  }, [router, session]);

  const handleQuotaExceeded = useCallback(() => {
    session.setRemaining(0);
    setView('limit');
  }, [session]);

  const resetToGallery = useCallback(() => {
    setSelectedIds([]);
    setQuestion('');
    setChat(null);
    setCachedResponses({});
    setView('gallery');
  }, []);

  const backToAsk = useCallback(() => {
    setChat(null);
    setView('ask');
  }, []);

  const backToGallery = useCallback(() => {
    setQuestion('');
    setChat(null);
    setView('gallery');
  }, []);

  const headerProps = (() => {
    if (view === 'ask') return { showBack: true, onBack: backToGallery };
    if (view === 'single-response' || view === 'compare') return { showBack: true, onBack: backToAsk, onNewQuestion: resetToGallery };
    if (view === 'limit') return { showBack: true, onBack: resetToGallery };
    if (view === 'chat' && chat) {
      return {
        showBack: true,
        onBack: () => {
          setChat(null);
          setView(selectedIds.length > 1 ? 'compare' : 'single-response');
        },
        onNewQuestion: resetToGallery,
        title: getActiveMentor(chat.mentorId).name,
      };
    }
    return {};
  })();

  const streamHandlers = {
    onQuota: session.setRemaining,
    onAuthRequired: handleAuthRequired,
    onQuotaExceeded: handleQuotaExceeded,
  };

  const flowStep = view === 'ask' ? 1 : view === 'single-response' || view === 'compare' ? 2 : null;

  // Mentor seçimi — hem misafir hem üye akışında kullanılır
  const mentorSection = (
    <section ref={galleryRef} id="mentorlar" className="mx-auto max-w-content scroll-mt-24 px-5 py-16 sm:py-20" aria-labelledby="mentors-title">
      <SectionHeading eyebrow="Mentorlar" title="Mentorunu" accent="seç" id="mentors-title">
        Derinleşmek için birini, farklı bakışları yan yana görmek için birkaç mentor seç. Kararsızsan birden fazla mentor seç;
        cevaplar geldikten sonra seni en çok düşündürenle devam edersin.
      </SectionHeading>

      {draft && (
        <Reveal className="mx-auto mt-6 max-w-xl">
          <div className="flex items-center gap-3 rounded-2xl border border-brand-500/25 bg-brand-500/[0.06] px-4 py-3">
            <span className="text-[11px] uppercase tracking-[0.14em] text-brand-300">Sorun hazır</span>
            <span className="min-w-0 flex-1 truncate font-display text-sm text-white/85">&ldquo;{draft}&rdquo;</span>
            <button onClick={() => saveDraft('')} className="text-xs text-white/35 hover:text-white/70" aria-label="Taslak soruyu kaldır">
              Kaldır
            </button>
          </div>
        </Reveal>
      )}

      <Reveal className="mt-8">
        <FlowSteps current={0} className="max-w-md" />
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
        {ACTIVE_MENTORS.map((m, i) => (
          <MentorGalleryCard
            key={m.id}
            mentor={m}
            selected={selectedIds.includes(m.id as MentorId)}
            onSelect={() => toggleMentor(m.id as MentorId)}
            delay={0.05 + i * 0.07}
          />
        ))}
      </div>

      <Reveal className="mt-16">
        <div className="flex items-center gap-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Yakında aramıza katılacaklar</p>
          <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
        </div>
      </Reveal>
      <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
        {COMING_SOON_MENTORS.map((m, i) => (
          <Reveal key={m.id} delay={i * 70}>
            <MentorGalleryCard mentor={m} />
          </Reveal>
        ))}
      </div>
    </section>
  );

  return (
    <div className="min-h-dvh flex flex-col">
      <Header {...headerProps} />
      <ToastProvider />
      <main className="flex flex-1 flex-col">

      {/* GALLERY — ziyaretçiye önce "ne, neden, nasıl" anlatılır;
          üyeye ise doğrudan mentor seçimi ve örnek sorular gösterilir. */}
      {view === 'gallery' && (
        <div className="flex-1">
          <Hero user={user} onStart={scrollToGallery} onHowItWorks={scrollToHow} />
          {/* .band: gündüz temasında bölümleri açık mavi şeritlerle ayırır */}
          <div className="band"><DailyQuestion onAskYourself={handlePickQuestion} /></div>

          {user ? (
            <>
              {mentorSection}
              <div className="band"><JourneyTeaser /></div>
              <UseCases onPick={handlePickQuestion} />
              <div className="band"><HowItWorks id="nasil-calisir" /></div>
              <Faq />
            </>
          ) : (
            <>
              <TraditionsStrip />
              <div className="band"><WhyMentoriva /></div>
              <JourneyTeaser />
              <div className="band"><HowItWorks id="nasil-calisir" /></div>
              {mentorSection}
              <div className="band"><UseCases onPick={handlePickQuestion} /></div>
              <GoodToKnow />
              <div className="band"><Faq /></div>
            </>
          )}

          <FinalCta user={user} selectedIds={selectedIds} onToggle={toggleMentor} onStart={scrollToGallery} />

          <SelectionDock
            selectedIds={selectedIds}
            onContinue={goToAsk}
            onClear={() => setSelectedIds([])}
            hint={
              user && user.remaining <= 2
                ? user.remaining === 0
                  ? 'Bugünkü hakların doldu'
                  : `Bugün ${user.remaining} soru hakkın kaldı`
                : draft
                  ? 'Sorun hazır — devam et'
                  : null
            }
          />
          <div className={selectedIds.length > 0 ? 'h-24' : ''} />
          <Footer />
        </div>
      )}

      {flowStep !== null && <FlowSteps current={flowStep} className="pt-6" />}

      {/* ASK */}
      {view === 'ask' && (
        <AskView
          mentorIds={selectedIds}
          onSubmit={handleSubmitQuestion}
          onBack={backToGallery}
          remaining={user?.remaining}
          initialValue={draft}
        />
      )}

      {/* SINGLE RESPONSE */}
      {view === 'single-response' && selectedIds[0] && (
        <SingleResponseView
          key={`${selectedIds[0]}-${question}`}
          mentorId={selectedIds[0]}
          question={question}
          cachedResponse={cachedResponses[`${selectedIds[0]}:${question}`]}
          onContinue={(resp) => handleContinueToChat(selectedIds[0]!, resp)}
          onBack={resetToGallery}
          {...streamHandlers}
        />
      )}

      {/* COMPARE — sohbete geçince gizlenir ama sökülmez; geri dönüldüğünde
          cevaplar yeniden istenmez (ve yeniden ücretlendirilmez). */}
      {(view === 'compare' || (view === 'chat' && selectedIds.length > 1)) && question && (
        <div className={view === 'compare' ? undefined : 'hidden'}>
          <CompareView
            key={`cmp-${question}`}
            mentorIds={selectedIds}
            question={question}
            onSelect={handleContinueToChat}
            onBack={backToAsk}
            {...streamHandlers}
          />
        </div>
      )}

      {/* CHAT */}
      {view === 'chat' && chat && (
        <ChatView
          key={`chat-${chat.mentorId}-${chat.question}`}
          mentorId={chat.mentorId}
          initialQuestion={chat.question}
          initialResponse={chat.response}
          {...streamHandlers}
        />
      )}

      {/* LIMIT */}
      {view === 'limit' && <LimitReachedView onHome={resetToGallery} />}
      </main>
    </div>
  );
}
