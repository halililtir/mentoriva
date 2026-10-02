'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** 6 hane dolduğunda çağrılır (otomatik gönderim için). */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

/** 6 kutulu doğrulama kodu girişi — yapıştırma ve klavyeyle gezinme destekli. */
export function CodeInput({ value, onChange, onComplete, length = 6, disabled }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  // Odak yönlendirmesi state güncellenmeden önce çalışır; güncel değeri ref'te tut.
  const valueRef = useRef(value);
  valueRef.current = value;
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  // Kod dışarıdan temizlenince (ör. yanlış kod) ilk kutuya dön
  useEffect(() => {
    if (value === '' && refs.current.some((el) => el === document.activeElement)) refs.current[0]?.focus();
  }, [value]);

  const update = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    valueRef.current = clean;
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  };

  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5" role="group" aria-label="Doğrulama kodu">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          autoFocus={i === 0}
          aria-label={`${i + 1}. hane`}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, '').slice(-1);
            if (!ch) return;
            const arr = Array.from({ length }, (_, k) => valueRef.current[k] ?? '');
            arr[i] = ch;
            update(arr.join(''));
            focus(i + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              e.preventDefault();
              const arr = Array.from({ length }, (_, k) => valueRef.current[k] ?? '');
              if (arr[i]) {
                arr[i] = '';
              } else if (i > 0) {
                arr[i - 1] = '';
                focus(i - 1);
              }
              valueRef.current = arr.join('').slice(0, length);
              onChange(valueRef.current);
            } else if (e.key === 'ArrowLeft') {
              focus(i - 1);
            } else if (e.key === 'ArrowRight') {
              focus(i + 1);
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const clean = update(e.clipboardData.getData('text'));
            focus(clean.length);
          }}
          onFocus={(e) => {
            // Kod hep soldan doldurulur; boş bir kutunun ilerisine atlanmasın.
            if (i > valueRef.current.length) focus(valueRef.current.length);
            else e.target.select();
          }}
          className={cn(
            'h-14 w-11 rounded-xl border bg-ink-0/60 text-center font-display text-2xl text-paper transition-all duration-300 sm:w-12',
            'focus:border-brand-500/70 focus:outline-none focus:shadow-[0_0_0_4px_rgba(0,188,212,0.14)]',
            d ? 'border-brand-500/40' : 'border-white/10',
            'disabled:opacity-50',
          )}
        />
      ))}
    </div>
  );
}
