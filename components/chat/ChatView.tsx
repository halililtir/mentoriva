'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { getActiveMentor, getAccent } from '@/lib/mentors/metadata';
import { routeStreamError, useSSEStream, type MentorStreamHandlers } from '@/lib/useSSEStream';
import { INPUT_LIMITS } from '@/lib/features';
import { useSession } from '@/lib/session';
import { TypingDots } from '@/components/ui/TypingDots';
import { cn } from '@/lib/cn';
import { ShareCardButton } from '@/components/share/ShareCardDialog';
import { RateAnswer } from '@/components/shared/RateAnswer';
import { announceBadges } from '@/components/shared/BadgeToaster';
import { ChatExport } from '@/components/chat/ChatExport';
import type { ChatStreamEvent, MentorId, Message } from '@/types';

interface Props extends MentorStreamHandlers {
  mentorId: MentorId;
  initialQuestion: string;
  initialResponse: string;
}

let idSeq = 0;
const nextId = (p: string) => `${p}${Date.now()}-${idSeq++}`;

export function ChatView({ mentorId, initialQuestion, initialResponse, onQuota, onAuthRequired, onQuotaExceeded }: Props) {
  const mentor = getActiveMentor(mentorId);
  const accent = getAccent(mentor.accentColor);
  const { user } = useSession();

  const [messages, setMessages] = useState<Message[]>([
    { role: 'user', content: initialQuestion, id: 'iq' },
    { role: 'assistant', content: initialResponse, id: 'ir' },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { start, isStreaming } = useSSEStream<ChatStreamEvent>();
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const outOfQuota = user ? user.remaining <= 0 : false;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streaming, isStreaming]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const send = async () => {
    const text = input.trim();
    if (!text || isStreaming || outOfQuota) return;
    const userMsg: Message = { role: 'user', content: text, id: nextId('u') };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setStreaming('');
    setError(null);
    setNotice(null);

    let acc = '';
    await start({
      url: '/api/v1/mentors/chat',
      body: { mentorId, messages: next.map(({ role, content }) => ({ role, content })) },
      onEvent: (ev) => {
        if (ev.type === 'quota') onQuota(ev.remaining);
        else if (ev.type === 'badges') announceBadges(ev.ids);
        else if (ev.type === 'delta') { acc += ev.text; setStreaming(acc); }
        else if (ev.type === 'end') {
          setMessages((p) => [...p, { role: 'assistant', content: acc, id: nextId('a') }]);
          setStreaming('');
        } else if (ev.type === 'error') {
          setError(ev.message);
          setStreaming('');
        } else if (ev.type === 'crisis') {
          setNotice(ev.message);
          setStreaming('');
        }
      },
      onError: (e) => {
        setStreaming('');
        if (!routeStreamError(e, { onQuota, onAuthRequired, onQuotaExceeded })) setError(e.message);
      },
    });
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-64px)] w-full max-w-3xl flex-col px-4 sm:px-5" style={{ '--accent': accent.hex } as React.CSSProperties}>
      {/* Mentor başlığı */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] py-4 animate-fade-down">
        <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border-2" style={{ borderColor: accent.hex, boxShadow: `0 0 24px -4px ${accent.glow}` }}>
          <Image src={mentor.portraitUrl} alt={mentor.name} fill sizes="44px" className="object-cover" style={{ objectPosition: mentor.portraitPosition ?? 'center' }} />
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg" style={{ color: accent.text }}>{mentor.name}</h2>
          <p className="flex items-center gap-1.5 text-[11px] text-white/40">
            <span className={cn('h-1.5 w-1.5 rounded-full', isStreaming ? 'animate-pulse' : '')} style={{ background: accent.hex }} />
            {isStreaming ? 'yazıyor…' : mentor.title}
          </p>
        </div>
        <div className="ml-auto">
          <ChatExport mentorName={mentor.name} messages={messages} unlocked={!!user?.perks?.includes('sohbet-indir')} />
        </div>
        {user && (
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/50">
            Kalan <span className="font-semibold text-brand-300">{user.remaining}</span>
          </span>
        )}
      </div>

      {/* Mesajlar */}
      <div className="flex-1 space-y-4 overflow-y-auto py-6" aria-live="polite">
        {messages.map((msg, i) => {
          // Paylaşım kartı için: bu cevabı doğuran kullanıcı mesajı
          const asked = msg.role === 'assistant' ? messages[i - 1]?.content : undefined;
          return (
            <div key={msg.id}>
              <Bubble role={msg.role} accentBg={accent.bg} accentBorder={accent.border}>
                {msg.content}
              </Bubble>
              {asked && (
                <div className="mt-1.5 flex flex-wrap items-start gap-3 pl-1">
                  <ShareCardButton data={{ source: 'answer', mentorId, question: asked, answer: msg.content }} compact className="!border-transparent opacity-70 hover:opacity-100" />
                  <RateAnswer mentorId={mentorId} source="chat" />
                </div>
              )}
            </div>
          );
        })}

        {isStreaming && streaming && (
          <Bubble role="assistant" accentBg={accent.bg} accentBorder={accent.border} streaming>
            {streaming}
          </Bubble>
        )}
        {isStreaming && !streaming && (
          <div className="flex items-center gap-2 pl-1 text-xs text-white/40 animate-fade-in">
            <TypingDots color={accent.hex} /> {mentor.shortName} düşünüyor
          </div>
        )}

        {notice && (
          <div role="alert" className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm leading-relaxed text-amber-100/85 animate-fade-up">
            {notice}
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.07] p-4 text-sm text-red-200/90 animate-fade-up">{error}</div>
        )}
        <div ref={endRef} />
      </div>

      {/* Giriş alanı */}
      <div className="pb-4 pt-2" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        {outOfQuota ? (
          <div className="glass rounded-2xl px-5 py-4 text-center animate-fade-up">
            <p className="text-sm text-amber-300/90">Bugünkü soru hakların doldu</p>
            <p className="mt-1 text-xs text-white/40">Hakların gece yarısı yenilenir. Sohbetin burada seni bekliyor.</p>
          </div>
        ) : (
          <div className="focus-ring-gradient">
            <div className="flex items-end gap-2 rounded-[calc(1.25rem-1px)] bg-ink-50/95 p-2 pl-4 backdrop-blur-xl">
              <textarea
                ref={taRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
                placeholder={`${mentor.shortName}'a cevap ver…`}
                className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-relaxed text-paper placeholder:text-white/25 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                maxLength={INPUT_LIMITS.MAX_CHAT_MESSAGE_LENGTH}
                disabled={isStreaming}
                rows={1}
                aria-label="Mesajın"
              />
              <button
                onClick={() => void send()}
                disabled={!input.trim() || isStreaming}
                className="btn-primary !h-11 !w-11 flex-shrink-0 !rounded-xl !p-0"
                aria-label="Gönder"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}
        {!outOfQuota && (
          <p className="mt-2 text-center text-[10px] text-white/25">Enter ile gönder · Shift+Enter yeni satır · her mesaj 1 hak kullanır</p>
        )}
      </div>
    </div>
  );
}

function Bubble({
  role,
  children,
  accentBg,
  accentBorder,
  streaming,
}: {
  role: Message['role'];
  children: React.ReactNode;
  accentBg: string;
  accentBorder: string;
  streaming?: boolean;
}) {
  const isUser = role === 'user';
  return (
    <div className={cn('flex animate-fade-up', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[88%] whitespace-pre-wrap rounded-2xl border px-4 py-3 text-[15px] leading-relaxed sm:max-w-[80%]',
          isUser ? 'rounded-br-md border-brand-500/25 bg-brand-500/[0.1] text-white/90' : 'rounded-bl-md text-white/85',
          streaming && 'streaming-cursor',
        )}
        style={isUser ? undefined : { background: accentBg, borderColor: accentBorder }}
      >
        {children}
      </div>
    </div>
  );
}
