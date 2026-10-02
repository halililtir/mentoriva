'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { cn } from '@/lib/cn';

export default function FeedbackPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const canSubmit =
    status !== 'sending' &&
    form.name.trim().length >= 2 &&
    form.email.includes('@') &&
    form.message.trim().length >= 10;

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) return;
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? 'Gönderilemedi');
      }

      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Bir hata oluştu');
    }
  };

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <Header />

      <main className="mx-auto max-w-narrow px-5 py-12 sm:py-16 space-y-10">
        <section className="text-center space-y-4">
          <h1 className="font-display text-h1 text-balance">Geri bildiriminiz</h1>
          <p className="text-muted text-[15px] max-w-reading mx-auto leading-relaxed text-pretty">
            Mentoriva, sizin geri bildirimlerinizle şekilleniyor. Hangi mentorlar
            eklenmeli? Neyi beğendiniz, neyi geliştirelim? Her görüş bizim için değerli.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-brand-500/8 border border-brand-500/15 text-xs text-brand-400">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            <span>Platformumuz geri bildirimlere göre şekilleniyor</span>
          </div>
        </section>

        {status === 'sent' ? (
          <div className="card-surface p-8 sm:p-10 text-center space-y-5">
            <div className="text-4xl">🙏</div>
            <h2 className="font-display text-2xl">Teşekkürler!</h2>
            <p className="text-muted text-[15px] leading-relaxed">
              Geri bildiriminiz bize ulaştı. Her mesaj, Mentoriva{"'"}yı daha iyi
              yapmamıza yardımcı oluyor. Teşekkür ederiz.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setStatus('idle')}
                className="btn-secondary text-sm"
              >
                Yeni geri bildirim
              </button>
              <Link href="/" className="btn-primary text-sm">
                Ana sayfaya dön
              </Link>
            </div>
          </div>
        ) : (
          <div className="card-surface p-6 sm:p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="fb-name" className="text-xs uppercase tracking-wider text-muted font-medium">
                  Ad Soyad *
                </label>
                <input
                  id="fb-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Adınız Soyadınız"
                  className="input-field !min-h-0 !py-2.5 text-sm"
                  maxLength={100}
                  disabled={status === 'sending'}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="fb-email" className="text-xs uppercase tracking-wider text-muted font-medium">
                  E-posta *
                </label>
                <input
                  id="fb-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ornek@email.com"
                  className="input-field !min-h-0 !py-2.5 text-sm"
                  maxLength={200}
                  disabled={status === 'sending'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="fb-message" className="text-xs uppercase tracking-wider text-muted font-medium">
                Mesajınız *
              </label>
              <textarea
                id="fb-message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Önerileriniz, istekleriniz, beğendikleriniz veya eleştirileriniz..."
                className="input-field text-sm"
                rows={5}
                maxLength={5000}
                disabled={status === 'sending'}
              />
              <p className="text-[11px] text-faint text-right">
                {form.message.length} / 5000
              </p>
            </div>

            {status === 'error' && errorMsg && (
              <div className="p-3 rounded-card bg-danger/10 border border-danger/30 text-sm text-danger">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={cn('btn-primary', status === 'sending' && 'animate-pulse')}
              >
                {status === 'sending' ? 'Gönderiliyor...' : 'Gönder'}
              </button>
              <span className="text-xs text-faint">
                * Zorunlu alanlar
              </span>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-faint">
          Bilgileriniz yalnızca geri bildirim değerlendirmesi amacıyla kullanılır
          ve üçüncü şahıslarla paylaşılmaz.
        </p>
      </main>
      <Footer />
    </div>
  );
}
