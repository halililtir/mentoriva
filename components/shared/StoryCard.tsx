'use client';

import { useMemo, useState } from 'react';
import { track } from '@/lib/analytics';
import type { MentorId } from '@/types';

interface Props {
  primaryId: MentorId;
  /** Sonuç sayfasındaki sırayla: mentor ve yüzde. */
  results: Array<{ id: string; pct: number }>;
  /** Tek cümle seçimi için tohum (sonuç sayfasındakiyle aynı cümle çıkar). */
  seed: number;
}

/**
 * Kişilik testi hikâye kartı (1080×1920). Görsel sunucuda (Edge) üretilir:
 * gerçek fontlar, mentor portresi ve tüm dağılım. Burada önizleme, paylaş ve indir.
 */
export function StoryCard({ primaryId, results, seed }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const src = useMemo(() => {
    const r = results.map((x) => `${x.id}-${x.pct}`).join(',');
    return `/api/v1/share/test-card?m=${primaryId}&r=${encodeURIComponent(r)}&s=${seed}`;
  }, [primaryId, results, seed]);

  const fileName = `mentoriva-test-${primaryId}.png`;

  const getFile = async () => {
    const blob = await (await fetch(src)).blob();
    return new File([blob], fileName, { type: 'image/png' });
  };

  const share = async () => {
    setBusy(true);
    try {
      const file = await getFile();
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Zihninin mimarı kim?' });
        track('test_card', { action: 'share' });
      } else {
        download(file);
      }
    } catch {
      // kullanıcı paylaşımı iptal etti
    } finally {
      setBusy(false);
    }
  };

  const download = (file?: File) => {
    const a = document.createElement('a');
    a.href = file ? URL.createObjectURL(file) : src;
    a.download = fileName;
    a.click();
    if (file) setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    track('test_card', { action: 'download' });
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative w-44 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-ink-0 shadow-2xl sm:w-40" style={{ aspectRatio: '9 / 16' }}>
        {!loaded && !failed && <div className="skeleton absolute inset-0" />}
        {failed ? (
          <p className="absolute inset-0 flex items-center justify-center p-3 text-center text-xs text-white/55">Kart şu an hazırlanamadı.</p>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Test sonucu hikâye kartı" className="h-full w-full object-cover" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
        )}
      </div>
      <div className="flex-1 space-y-3 text-center sm:text-left">
        <p className="font-display text-lg text-white/90">Hikâye kartın hazır</p>
        <p className="text-sm leading-relaxed text-white/60">Instagram hikâyesi boyutunda (1080×1920). Telefonda “Paylaş” ile doğrudan hikâyene ekleyebilirsin.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={share} disabled={busy || failed} className="btn-primary !py-2.5 text-sm">{busy ? 'Hazırlanıyor…' : 'Paylaş'}</button>
          <button onClick={() => download()} disabled={failed} className="btn-secondary !py-2.5 text-sm">İndir</button>
        </div>
      </div>
    </div>
  );
}
