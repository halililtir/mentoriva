'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { ToastProvider, showToast } from '@/components/shared/Toast';
import { MentorGalleryCard } from '@/components/mentors/MentorGalleryCard';
import { AskView } from '@/components/mentors/AskView';
import { SingleResponseView } from '@/components/mentors/SingleResponseView';
import { CompareView } from '@/components/mentors/CompareView';
import { ChatView } from '@/components/chat/ChatView';
import { Logo } from '@/components/shared/Logo';
import { ACTIVE_MENTORS, COMING_SOON_MENTORS, getActiveMentor } from '@/lib/mentors/metadata';
import { useTokens } from '@/lib/useTokens';
import type { MentorId } from '@/types';

type View = 'gallery' | 'ask' | 'single-response' | 'compare' | 'chat' | 'premium';

interface ChatState {
  mentorId: MentorId;
  question: string;
  response: string;
}

export default function HomePage() {
  const [view, setView] = useState<View>('gallery');
  const [selectedIds, setSelectedIds] = useState<MentorId[]>([]);
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState<ChatState | null>(null);
  const [premiumEmail, setPremiumEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [cachedResponses, setCachedResponses] = useState<Record<string, string>>({});
  const tokens = useTokens();
  const consumeToken = tokens.consumeToken;

  const toggleMentor = useCallback((id: MentorId) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) {
        showToast('En fazla 4 mentor seçebilirsin', 'warning');
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const goToAsk = useCallback(() => {
    if (selectedIds.length === 0) return;
    if (!tokens.isLoggedIn) { window.location.href = '/giris'; return; }
    setView('ask');
  }, [selectedIds, tokens.isLoggedIn]);

  const handleSubmitQuestion = useCallback(async (q: string) => {
    if (!tokens.isLoggedIn) { window.location.href = '/giris'; return; }
    if (tokens.remaining <= 0) { setView('premium'); return; }
    // Token'ı burada tüketME — cevap geldikten sonra tüketilecek
    setQuestion(q);
    if (selectedIds.length === 1) {
      setView('single-response');
    } else {
      setView('compare');
    }
  }, [selectedIds, tokens.isLoggedIn, tokens.remaining]);

  const handleContinueToChat = useCallback((mentorId: MentorId, response: string) => {
    // Cevabı cache'le — geri tuşuna basılırsa tekrar API çağrılmasın
    const cacheKey = `${mentorId}:${question}`;
    setCachedResponses((prev) => ({ ...prev, [cacheKey]: response }));
    setChat({ mentorId, question, response });
    setView('chat');
  }, [question]);

  const resetToGallery = useCallback(() => {
    setSelectedIds([]);
    setQuestion('');
    setChat(null);
    setCachedResponses({});
    setView('gallery');
  }, []);

  const backToAsk = useCallback(() => {
    // Soruyu ve cache'i koru — geri gelirse tekrar sormasın
    setChat(null);
    setView('ask');
  }, []);

  const backToGallery = useCallback(() => {
    setQuestion('');
    setChat(null);
    setView('gallery');
  }, []);

  // Header props
  const headerProps = (() => {
    if (view === 'gallery') return {};
    if (view === 'ask') return { showBack: true, onBack: backToGallery };
    if (view === 'single-response') return { showBack: true, onBack: backToAsk, onNewQuestion: resetToGallery };
    if (view === 'compare') return { showBack: true, onBack: backToAsk, onNewQuestion: resetToGallery };
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

  return (
    <div className="min-h-dvh flex flex-col">
      <Header {...headerProps} />
      <ToastProvider />

      {/* Kalan hak sayacı — sadece giriş yapanlara */}
      {tokens.isLoggedIn && view !== 'premium' && (
        <div className="mx-auto max-w-[1140px] w-full px-5 pt-3 flex items-center justify-between">
          <span className="text-[11px] text-white/20">
            Hoş geldin, <span className="text-white/40">{tokens.username}</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white/25">
              Kalan: <span className="text-brand-400 font-medium">{tokens.remaining}</span>/{tokens.limit}
            </span>
            <button onClick={tokens.logout} className="text-[10px] text-white/15 hover:text-white/35 transition-colors">
              Çıkış
            </button>
          </div>
        </div>
      )}

      {/* GALLERY */}
      {view === 'gallery' && (
        <div className="mx-auto max-w-[1140px] w-full px-5 py-8 sm:py-12 flex-1">
          {/* Hero */}
          <section className="text-center max-w-[560px] mx-auto mb-2 animate-fade-up">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] text-brand-400/80 bg-brand-500/[0.06] border border-brand-500/[0.12]">
              <span className="w-[5px] h-[5px] rounded-full bg-brand-500 animate-pulse" />
              Aynı soru, farklı zihinler
            </span>
            <h1 className="font-display text-hero mt-4 mb-3">
              Tek bir soru, sonsuz <span className="text-brand-500">perspektif</span>.
            </h1>
            <p className="text-[15px] text-white/45 leading-relaxed">
              Tarihin en keskin zihinleriyle aynı soruya farklı pencerelerden bak.
            </p>
          </section>

          {/* Aktif mentorlar */}
          <p className="text-[11px] uppercase tracking-[0.1em] text-white/30 mt-9 mb-3.5 pl-0.5">
            Aktif mentorlar
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {ACTIVE_MENTORS.map((m, i) => (
              <MentorGalleryCard
                key={m.id}
                mentor={m}
                selected={selectedIds.includes(m.id as MentorId)}
                onSelect={() => toggleMentor(m.id as MentorId)}
                delay={0.1 + i * 0.06}
              />
            ))}
          </div>

          {/* Yakında */}
          <p className="text-[11px] uppercase tracking-[0.1em] text-white/30 mt-8 mb-3.5 pl-0.5">
            Yakında geliyor
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {COMING_SOON_MENTORS.map((m, i) => (
              <MentorGalleryCard
                key={m.id}
                mentor={m}
                delay={0.3 + i * 0.06}
              />
            ))}
          </div>

          {/* Action bar — mentor seçiliyken altta sabit */}
          {selectedIds.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#070b14]/95 backdrop-blur-md border-t border-white/[0.06] px-5 py-3 sm:relative sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:mt-8 sm:py-0">
              <div className="flex flex-col items-center gap-2 max-w-[1140px] mx-auto">
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  {selectedIds.length === 1 && (
                    <>
                      <button onClick={goToAsk} className="btn-primary">
                        {getActiveMentor(selectedIds[0]!).name}{"'"}a sor →
                      </button>
                      <span className="text-xs text-white/25 hidden sm:inline">veya 2-4 seçerek karşılaştır</span>
                    </>
                  )}
                  {selectedIds.length > 1 && (
                    <>
                      <button onClick={goToAsk} className="btn-primary">
                        Karşılaştır ({selectedIds.length}) →
                      </button>
                      <span className="text-xs text-white/25">{selectedIds.length} mentor seçildi</span>
                    </>
                  )}
                </div>
                {tokens.warningMessage && (
                  <span className="text-xs text-amber-400/70">
                    {tokens.warningMessage}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Mentor seçilmemişken hint */}
          {selectedIds.length === 0 && (
            <div className="flex justify-center mt-8">
              <span className="text-xs text-white/25">Bir mentor seç</span>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-14 pt-5 pb-20 sm:pb-5 border-t border-white/[0.04] text-center space-y-4">
            <div className="flex items-center justify-center gap-5 text-xs text-white/25">
              <Link href="/test" className="hover:text-white/50 transition-colors">Testi Çöz</Link>
              <Link href="/hakkimizda" className="hover:text-white/50 transition-colors">Hakkımızda</Link>
              <Link href="/geri-bildirim" className="hover:text-white/50 transition-colors">Geri Bildirim</Link>
            </div>
            <div className="flex items-center justify-center gap-4">
              <a href="mailto:info@mentoriva.com.tr" className="text-[11px] text-white/25 hover:text-white/50 transition-colors">
                info@mentoriva.com.tr
              </a>
              <a href="https://instagram.com/mentoriva_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] text-white/25 hover:text-white/50 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                @mentoriva_
              </a>
            </div>
            <p className="text-[10px] text-white/15 max-w-[500px] mx-auto">
              Mentoriva, profesyonel psikolojik destek veya tıbbi tavsiye yerine geçmez.
            </p>
          </footer>
        </div>
      )}

      {/* ASK */}
      {view === 'ask' && (
        <AskView
          mentorIds={selectedIds}
          onSubmit={handleSubmitQuestion}
          onBack={backToGallery}
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
          onResponseComplete={() => { consumeToken(); }}
        />
      )}

      {/* COMPARE */}
      {view === 'compare' && (
        <CompareView
          key={`cmp-${question}`}
          mentorIds={selectedIds}
          question={question}
          onSelect={handleContinueToChat}
          onBack={backToAsk}
          onResponseComplete={() => { consumeToken(); }}
        />
      )}

      {/* CHAT */}
      {view === 'chat' && chat && (
        <ChatView
          key={`chat-${chat.mentorId}-${chat.question}`}
          mentorId={chat.mentorId}
          initialQuestion={chat.question}
          initialResponse={chat.response}
        />
      )}

      {/* PREMIUM */}
      {view === 'premium' && (
        <div className="mx-auto max-w-[520px] px-5 py-12 sm:py-16 animate-fade-up">
          <div className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-amber-500/[0.04] to-transparent p-8 sm:p-10 text-center space-y-6">
            {/* Rozet */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" /></svg>
              Çok yakında
            </span>

            <h2 className="font-display text-2xl sm:text-3xl leading-tight text-balance">
              Düşünce meclisinde<br />
              <span className="text-amber-400">sınır olmasın.</span>
            </h2>

            <p className="text-[14px] text-white/45 leading-relaxed max-w-[380px] mx-auto">
              {tokens.used} farklı perspektif aldın ve mentorların sana söyleyecek
              çok şey var. Geri bildirimlerin bizim için çok değerli. Daha
              fazla soru sormak istersen bizimle iletişime geç.
            </p>

            <div className="space-y-3 text-left max-w-[340px] mx-auto">
              {[
                'Sınırsız mentor sohbeti',
                'Derin analiz modu',
                'Tüm mentorlarla karşılaştırma',
                'Öncelikli yeni mentor erişimi',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                    <path d="M3 8l3.5 3.5L13 5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm text-white/60">{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-amber-500/10 space-y-3">
              {emailSent ? (
                <div className="space-y-2">
                  <p className="text-amber-400 text-sm font-medium">Kaydettik!</p>
                  <p className="text-xs text-white/35">Premium hazır olduğunda sana haber vereceğiz.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-white/35">
                    Premium hazır olduğunda sana haber verelim
                  </p>
                  <div className="flex gap-2 max-w-[340px] mx-auto">
                    <input
                      type="email"
                      value={premiumEmail}
                      onChange={(e) => setPremiumEmail(e.target.value)}
                      placeholder="E-posta adresin"
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-amber-500/40"
                    />
                    <button
                      onClick={() => {
                        if (!premiumEmail.includes('@')) return;
                        fetch('/api/v1/feedback', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: 'Premium İlgi',
                            email: premiumEmail.trim(),
                            message: '[PREMIUM_INTEREST] Kullanıcı premium erişim için email bıraktı.',
                          }),
                        }).catch(() => {});
                        setEmailSent(true);
                      }}
                      className="px-5 py-3 rounded-xl bg-amber-500 text-[#070b14] text-sm font-medium hover:bg-amber-400 transition-colors flex-shrink-0"
                    >
                      Bana haber ver
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 space-y-2">
              <a href="mailto:info@mentoriva.com.tr" className="text-sm text-amber-400/70 hover:text-amber-400 transition-colors">
                info@mentoriva.com.tr
              </a>
              <br />
              <a href="https://instagram.com/mentoriva_" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-amber-400/70 hover:text-amber-400 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                @mentoriva_
              </a>
            </div>

            <button
              onClick={resetToGallery}
              className="text-xs text-white/25 hover:text-white/40 transition-colors"
            >
              Ana sayfaya dön
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
