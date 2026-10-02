'use client';

import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

interface Props {
  phrases: string[];
  className?: string;
  /** Tam yazılmış ifadenin ekranda kalma süresi (ms). */
  hold?: number;
}

/**
 * Daktilo efektiyle sırayla yazılıp silinen ifadeler.
 * Hareket azaltma açıksa ifadeler yalnızca sırayla değişir.
 */
export function RotatingText({ phrases, className, hold = 2200 }: Props) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [text, setText] = useState(phrases[0] ?? '');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[index] ?? '';

    if (reduced) {
      setText(phrase);
      const t = setTimeout(() => setIndex((i) => (i + 1) % phrases.length), hold + 1200);
      return () => clearTimeout(t);
    }

    if (!deleting && text === phrase) {
      const t = setTimeout(() => setDeleting(true), hold);
      return () => clearTimeout(t);
    }
    if (deleting && text === '') {
      setDeleting(false);
      setIndex((i) => (i + 1) % phrases.length);
      return;
    }
    const t = setTimeout(
      () => setText(deleting ? phrase.slice(0, text.length - 1) : phrase.slice(0, text.length + 1)),
      deleting ? 22 : 45,
    );
    return () => clearTimeout(t);
  }, [text, deleting, index, phrases, hold, reduced]);

  return (
    <span className={className}>
      {/* Ekran okuyucular dönen metni okumaz; tüm ifadeleri bir kez duyar */}
      <span className="sr-only">{phrases.join(', ')}</span>
      <span aria-hidden="true">
        {text}
        <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.12em] bg-brand-400 animate-cursor-blink" />
      </span>
    </span>
  );
}
