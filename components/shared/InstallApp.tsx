'use client';

import { useEffect, useState } from 'react';
import { track } from '@/lib/analytics';

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window { __mentorivaInstall?: InstallPrompt | null }
}

const READY = 'mentoriva:install-ready';

/** Servis çalışanını kaydeder ve kurulum davetini bileşenler için saklar (layout'ta bir kez). */
export function PwaRegister() {
  useEffect(() => {
    const keep = (e: Event) => {
      e.preventDefault();
      window.__mentorivaInstall = e as InstallPrompt;
      window.dispatchEvent(new Event(READY));
    };
    window.addEventListener('beforeinstallprompt', keep);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    return () => window.removeEventListener('beforeinstallprompt', keep);
  }, []);
  return null;
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** iPhone/iPad: Safari kurulum daveti vermez, adımlar gösterilir. */
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** "Telefona ekle": Android'de kurulum penceresi, iPhone'da adımlar; kuruluysa ya da destek yoksa görünmez. */
export function InstallApp({ className }: { className?: string }) {
  const [mode, setMode] = useState<'none' | 'prompt' | 'ios'>('none');
  const [steps, setSteps] = useState(false);

  useEffect(() => {
    const update = () => {
      if (isStandalone()) return setMode('none');
      if (window.__mentorivaInstall) return setMode('prompt');
      setMode(isIos() ? 'ios' : 'none');
    };
    update();
    window.addEventListener(READY, update);
    return () => window.removeEventListener(READY, update);
  }, []);

  if (mode === 'none') return null;

  const install = async () => {
    if (mode === 'ios') {
      setSteps((v) => !v);
      track('pwa_ios_steps');
      return;
    }
    const p = window.__mentorivaInstall;
    if (!p) return;
    await p.prompt().catch(() => {});
    const choice = await p.userChoice.catch(() => null);
    track('pwa_install', { outcome: choice?.outcome ?? 'unknown' });
    window.__mentorivaInstall = null;
    setMode('none');
  };

  return (
    <div className={className}>
      <button onClick={() => void install()} aria-expanded={mode === 'ios' ? steps : undefined} className="text-left text-sm text-brand-300 transition-colors hover:text-brand-200">
        Telefona uygulama olarak ekle
      </button>
      {steps && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">
          Safari&apos;de alttaki Paylaş simgesine dokun, sonra &ldquo;Ana Ekrana Ekle&rdquo;yi seç.
        </p>
      )}
    </div>
  );
}
