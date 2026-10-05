import { describe, expect, it } from 'vitest';
import { FEELINGS, FEELING_BY_ID, START_PHRASES } from '@/lib/feelings/content';
import { parseSuggestion, sanitizeInputs, staticSuggestions } from '@/lib/feelings/suggest';
import { cardToQuestion } from '@/lib/feelings/card';
import { sanitizeCard } from '@/lib/studies/cards';
import { parsePrepare, sanitizePrepare } from '@/lib/prepare';
import { INPUT_LIMITS } from '@/lib/features';

describe('duygu sözlüğü', () => {
  it('kimlikler benzersiz; "yakın duygu" ve giriş ipuçları sözlükte var', () => {
    expect(new Set(FEELINGS.map((f) => f.id)).size).toBe(FEELINGS.length);
    for (const f of FEELINGS) if (f.near) expect(FEELING_BY_ID.has(f.near.id)).toBe(true);
    for (const p of START_PHRASES) for (const h of p.hints) expect(FEELING_BY_ID.has(h)).toBe(true);
  });

  it('yalnızca zorlayıcı duygulardan oluşmuyor', () => {
    expect(FEELINGS.filter((f) => f.group === 'genisleten').length).toBeGreaterThanOrEqual(6);
  });
});

describe('duygu önerisi', () => {
  const text = 'Toplantıda fikrimi söyledim, kimse bir şey demedi. Beni önemsemiyorlar.';

  it('bilinmeyen kimlikleri ve tekrarları atar, en fazla beş öneri', () => {
    const r = parseSuggestion(
      { suggest: [{ id: 'kirginlik', why: 'a' }, { id: 'yok', why: 'b' }, { id: 'kirginlik', why: 'c' }, { id: 'uzuntu', why: 'd' }] },
      text,
    );
    expect(r.suggestions.map((s) => s.id)).toEqual(['kirginlik', 'uzuntu']);
  });

  it('metinde birebir geçmeyen "yorum"u kabul etmez', () => {
    expect(parseSuggestion({ suggest: [], thought: 'beni önemsemiyorlar' }, text).thought).toBe('beni önemsemiyorlar');
    expect(parseSuggestion({ suggest: [], thought: 'kimse beni sevmiyor' }, text).thought).toBe('');
  });

  it('anlatım yoksa giriş cümlelerinin ipuçlarını döner', () => {
    expect(staticSuggestions(['tepkili']).map((s) => s.id)).toContain('ofke');
    expect(staticSuggestions([])).toEqual([]);
  });

  it('yalnızca tanımlı giriş cümlelerini ve beden notlarını kabul eder', () => {
    const r = sanitizeInputs(['dolu', 'uydurma'], ['Kalbim hızlı', '<script>']);
    expect(r.phraseIds).toEqual(['dolu']);
    expect(r.body).toEqual(['Kalbim hızlı']);
  });
});

describe('farkındalık kartı', () => {
  it('alanları sınırlar, boş kartı reddeder', () => {
    expect(sanitizeCard({})).toBeNull();
    const c = sanitizeCard({ situation: 'x'.repeat(2000), feelings: ['Kırgınlık', 'Kırgınlık', '', 'a'.repeat(100)], matters: 'yanlış tip' });
    expect(c?.situation.length).toBe(600);
    expect(c?.feelings).toEqual(['Kırgınlık', 'a'.repeat(40)]);
    expect(c?.matters).toEqual([]);
  });

  it('mentora giden soru sınırı aşmaz ve yorumu ayrı gösterir', () => {
    const q = cardToQuestion({ situation: 'y'.repeat(900), feelings: ['Kırgınlık'], thought: 'Beni önemsemiyorlar', matters: ['Anlaşılmak'], note: '', step: '' });
    expect(q.length).toBeLessThanOrEqual(INPUT_LIMITS.MAX_QUESTION_LENGTH);
    const short = cardToQuestion({ situation: 'Toplantı', feelings: ['Kırgınlık'], thought: 'Beni önemsemiyorlar', matters: [], note: '', step: '' });
    expect(short).toContain('Aklımdan geçen: "Beni önemsemiyorlar"');
  });
});

describe('söyleyeceğimi hazırla', () => {
  it('girdiyi doğrular', () => {
    expect(typeof sanitizePrepare({ text: 'kısa', styles: ['net'] })).toBe('string');
    expect(typeof sanitizePrepare({ text: 'Bunu artık kabul etmiyorum, haberin olsun.', styles: [] })).toBe('string');
    const ok = sanitizePrepare({ text: 'Bunu artık kabul etmiyorum, haberin olsun.', styles: ['net', 'uydurma'] });
    expect(typeof ok === 'object' && ok.styles).toEqual(['net']);
  });

  it('yalnızca istenen biçimleri alır; güvenlik işaretini korur', () => {
    const r = parsePrepare({ versions: [{ style: 'net', text: 'A' }, { style: 'sakin', text: 'B' }, { style: 'net', text: 'C' }], kept: 'k' }, ['net']);
    expect(r?.versions).toEqual([{ style: 'net', text: 'A' }]);
    expect(parsePrepare({ safety: true }, ['net'])?.safety).toBe(true);
    expect(parsePrepare({ versions: [] }, ['net'])).toBeNull();
  });
});
