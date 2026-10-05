import { describe, expect, it } from 'vitest';
import { messageForMentor, needsClarify, sanitizeContext } from '@/lib/clarify';

describe('netleştirme adımı', () => {
  it('yalnızca kısa ya da belirsiz sorularda önerilir', () => {
    expect(needsClarify('Çok yoruldum.')).toBe(true);
    expect(needsClarify('Kendimi tanımıyorum.')).toBe(true);
    expect(needsClarify('Güvenli bir işim var ama içim sıkılıyor, her şeyi bırakıp kendi işimi kurmak istiyorum.')).toBe(false);
  });

  it('bağlam doğrulanır: geçersiz niyet düşer, boşsa null', () => {
    expect(sanitizeContext({ detail: '  iki haftadır  ', intent: 'anlatmak' })).toEqual({ detail: 'iki haftadır', intent: 'anlatmak' });
    expect(sanitizeContext({ intent: 'hack' })).toBeNull();
    expect(sanitizeContext({ detail: 'x'.repeat(900) })?.detail).toHaveLength(500);
    expect(sanitizeContext('metin')).toBeNull();
  });

  it('mentora soru, etiketli bağlam ve niyet notu gider; bağlam yoksa soru aynen', () => {
    expect(messageForMentor('Çok yoruldum.', null)).toBe('Çok yoruldum.');
    const m = messageForMentor('Çok yoruldum.', { detail: 'İşte her şey üstüme kalıyor.', intent: 'anlatmak' });
    expect(m).toContain('<kisinin_ekledigi_baglam>');
    expect(m).toContain('İşte her şey üstüme kalıyor.');
    expect(m).toMatch(/wants to be heard/);
  });
});
