'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { getActiveMentor, getAccent } from '@/lib/mentors/metadata';
import { useSSEStream } from '@/lib/useSSEStream';
import { INPUT_LIMITS } from '@/lib/features';
import { cn } from '@/lib/cn';
import type { MentorId, Message } from '@/types';

type ChatEvent = { type: 'delta'; text: string } | { type: 'end' } | { type: 'error'; message: string } | { type: 'crisis'; message: string };

interface Props {
  mentorId: MentorId;
  initialQuestion: string;
  initialResponse: string;
}

export function ChatView({ mentorId, initialQuestion, initialResponse }: Props) {
  const mentor = getActiveMentor(mentorId);
  const accent = getAccent(mentor.accentColor);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'user', content: initialQuestion, id: 'iq', timestamp: Date.now() },
    { role: 'assistant', content: initialResponse, id: 'ir', timestamp: Date.now() + 1 },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { start, isStreaming } = useSSEStream<ChatEvent>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 150)}px`;
  }, [input]);

  const send = async () => {
    const t = input.trim();
    if (!t || isStreaming) return;
    const userMsg: Message = { role: 'user', content: t, id: `u${Date.now()}`, timestamp: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setStreaming('');
    setError(null);

    let acc = '';
    await start({
      url: '/api/v1/mentors/chat',
      body: { mentorId, messages: next.map((m) => ({ role: m.role, content: m.content })), initialQuestion },
      onEvent: (ev) => {
        if (ev.type === 'delta') { acc += ev.text; setStreaming(acc); }
        else if (ev.type === 'end') {
          setMessages((p) => [...p, { role: 'assistant', content: acc, id: `a${Date.now()}`, timestamp: Date.now() }]);
          setStreaming('');
        }
        else if (ev.type === 'error') { setError(ev.message); setStreaming(''); }
        else if (ev.type === 'crisis') { setError(ev.message); setStreaming(''); }
      },
      onError: (e) => { setError(e.message); setStreaming(''); },
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-5 flex flex-col h-[calc(100dvh-64px)]">
      {/* Mentor header */}
      <div className="flex items-center gap-3 py-4 border-b border-white/[0.06]">
        <div className="w-10 h-10 rounded-xl overflow-hidden border-[1.5px] relative flex-shrink-0" style={{ borderColor: accent.border }}>
          <Image src={mentor.portraitUrl} alt={mentor.name} fill style={{objectPosition:mentor.portraitPosition||"center"}} className="object-cover" sizes="40px" />
        </div>
        <div>
          <h2 className="font-display text-base" style={{ color: accent.hex }}>{mentor.name}</h2>
          <p className="text-[9px] uppercase tracking-wider text-white/35">{mentor.title}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-5 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')} style={{ maxWidth: '85%', marginLeft: msg.role === 'user' ? 'auto' : undefined }}>
            <div className={cn(
              'px-4 py-3 rounded-2xl text-sm leading-relaxed border whitespace-pre-wrap',
              msg.role === 'user'
                ? 'bg-brand-500/10 border-brand-500/20'
                : '',
            )} style={msg.role === 'assistant' ? { background: accent.bg, borderColor: accent.border } : undefined}>
              {msg.content}
            </div>
          </div>
        ))}
        {isStreaming && streaming && (
          <div className="flex justify-start" style={{ maxWidth: '85%' }}>
            <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed border streaming-cursor" style={{ background: accent.bg, borderColor: accent.border }}>
              {streaming}
            </div>
          </div>
        )}
        {isStreaming && !streaming && (
          <div className="flex items-center gap-2 text-xs text-white/30">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            {mentor.name.split(' ')[0]} düşünüyor…
          </div>
        )}
        {error && <div className="p-3 rounded-card bg-red-500/10 border border-red-500/30 text-sm text-red-300">{error}</div>}
      </div>

      {/* Input */}
      <div className="py-3 border-t border-white/[0.06]">
        <div className="flex items-end gap-3">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
            placeholder={`${mentor.name.split(' ')[0]}'a cevap ver…`}
            className="input-field min-h-[48px] flex-1 text-sm"
            maxLength={INPUT_LIMITS.MAX_CHAT_MESSAGE_LENGTH}
            disabled={isStreaming}
          />
          <button onClick={() => void send()} disabled={!input.trim() || isStreaming} className="btn-primary !px-4 !py-3 h-[48px]" aria-label="Gönder">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 12L22 2L15 22L12 13L2 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <p className="text-[10px] text-white/15 mt-1.5">Enter ile gönder · Shift+Enter ile yeni satır</p>
      </div>
    </div>
  );
}
