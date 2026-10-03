'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { ChatView } from '@/components/chat/ChatView';
import { getActiveMentor, isActiveMentor } from '@/lib/mentors/metadata';
import { useSession } from '@/lib/session';
import type { SavedChat } from '@/lib/chats';

/** Kayıtlı bir sohbete kaldığı yerden devam. Yeni mesajlar kayda eklenir. */
export default function SavedChatPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const session = useSession();
  const [chat, setChat] = useState<SavedChat | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (session.status !== 'user') return;
    fetch(`/api/v1/chats/${encodeURIComponent(params.id)}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) return setMissing(true);
        const d = (await r.json()) as { chat?: SavedChat };
        if (d.chat && isActiveMentor(d.chat.mentorId)) setChat(d.chat);
        else setMissing(true);
      })
      .catch(() => setMissing(true));
  }, [session.status, params.id]);

  return (
    <div className="min-h-dvh">
      <Header
        showBack
        onBack={() => router.push('/sohbetlerim')}
        title={chat ? getActiveMentor(chat.mentorId).name : undefined}
      />
      {session.status === 'guest' ? (
        <div className="mx-auto mt-20 max-w-md px-5 text-center">
          <p className="text-white/70">Bu sohbeti görmek için giriş yap.</p>
          <Link href={`/giris?next=/sohbetlerim/${params.id}`} className="btn-primary mt-5 inline-flex">Giriş yap</Link>
        </div>
      ) : missing ? (
        <div className="mx-auto mt-20 max-w-md px-5 text-center">
          <p className="text-white/75">Bu sohbet bulunamadı; silinmiş olabilir.</p>
          <Link href="/sohbetlerim" className="btn-secondary mt-5 inline-flex">Sohbetlerime dön</Link>
        </div>
      ) : chat ? (
        <ChatView
          mentorId={chat.mentorId}
          initialMessages={chat.messages}
          savedChatId={chat.id}
          onQuota={session.setRemaining}
          onAuthRequired={() => { void session.refresh(); router.push(`/giris?next=/sohbetlerim/${chat.id}`); }}
          onQuotaExceeded={() => session.setRemaining(0)}
        />
      ) : (
        <div className="mx-auto mt-10 max-w-3xl space-y-4 px-5">
          <div className="skeleton h-16 rounded-2xl" />
          <div className="skeleton h-40 rounded-2xl" />
        </div>
      )}
    </div>
  );
}
