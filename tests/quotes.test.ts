import { describe, expect, it } from 'vitest';
import { QuoteTagFilter, resolveQuoteTags } from '@/lib/mentors/quote-stream';
import { VERIFIED_QUOTES, quoteCatalogPrompt } from '@/lib/mentors/quotes';
import { SENECA_PROMPT } from '@/lib/mentors/prompts/seneca';
import { MENTOR_PROMPTS } from '@/lib/mentors/prompts';

describe('alıntı etiketleri', () => {
  it('bilinen kimliği doğrulanmış alıntı ve kaynakla değiştirir', () => {
    const out = resolveQuoteTags('Sağlıcakla kal.\n\n[[alinti:sen-12]]', 'seneca');
    expect(out).toBe('Sağlıcakla kal.\n\n“Öfkenin en büyük ilacı beklemektir.”\n— Seneca, Öfke Üzerine 2.29.1');
  });

  it('uydurma kimliği sessizce düşürür', () => {
    expect(resolveQuoteTags('Son.\n[[alinti:sen-99]]', 'seneca')).toBe('Son.\n');
  });

  it('başka mentorun alıntısını kabul etmez', () => {
    expect(resolveQuoteTags('[[alinti:sen-01]]', 'marcus')).toBe('');
  });

  it('akışta parçalara bölünmüş etiketi doğru birleştirir', () => {
    const f = new QuoteTagFilter('seneca');
    const parts = ['Dostum, ', 'bekle.\n[', '[ali', 'nti:sen-', '12', ']', ']'];
    const out = parts.map((p) => f.push(p)).join('') + f.flush();
    expect(out).toBe('Dostum, bekle.\n“Öfkenin en büyük ilacı beklemektir.”\n— Seneca, Öfke Üzerine 2.29.1');
  });

  it('etiket olmayan köşeli parantezleri bozmaz', () => {
    expect(resolveQuoteTags('Bir [not] ve [[başka]] şey', 'seneca')).toBe('Bir [not] ve [[başka]] şey');
  });

  it('yarım kalan etiketi akış sonunda düşürür', () => {
    const f = new QuoteTagFilter('seneca');
    expect(f.push('Metin [[alinti:sen-0') + f.flush()).toBe('Metin ');
  });
});

describe('doğrulanmış alıntı kütüphanesi', () => {
  const all = Object.values(VERIFIED_QUOTES).flatMap((v) => v.quotes);

  it('kimlikler benzersiz ve her alıntının kaynağı dolu', () => {
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
    for (const q of all) {
      expect(q.original.length).toBeGreaterThan(5);
      expect(q.work).toBeTruthy();
      expect(q.ref).toMatch(/^(\d+(\.\d+)*)?$/);
      expect(q.verifiedFrom).toBeTruthy();
    }
  });

  it('Seneca promptu kataloğu içerir ve gerçek alıntı yazmayı istemez', () => {
    expect(SENECA_PROMPT.initial).toContain('[[alinti:<id>]]');
    expect(SENECA_PROMPT.initial).toContain('sen-12');
    expect(SENECA_PROMPT.initial).not.toMatch(/real quote/i);
    expect(quoteCatalogPrompt('yok')).toContain('NO QUOTATIONS');
  });

  it('örnek cevaplardaki etiketler katalogda var ve doğru mentora ait', () => {
    for (const [mentor, bundle] of Object.entries(MENTOR_PROMPTS)) {
      for (const ex of bundle.examples) {
        for (const m of ex.assistant.matchAll(/\[\[alinti:([a-z0-9-]+)\]\]/g)) {
          expect(resolveQuoteTags(m[0], mentor), `${mentor} örneği: ${m[1]}`).not.toBe('');
        }
      }
    }
  });

  it('hiçbir mentor promptu hafızadan "gerçek alıntı" istemez', () => {
    for (const bundle of [...Object.values(MENTOR_PROMPTS), SENECA_PROMPT]) {
      expect(bundle.initial).not.toMatch(/real quote|quote from your works/i);
    }
  });

  it('listesi olmayan mentor alıntı yazmaz', () => {
    expect(MENTOR_PROMPTS.jung.initial).toContain('# NO QUOTATIONS');
    expect(MENTOR_PROMPTS.mevlana.initial).toContain('mev-04');
    expect(MENTOR_PROMPTS.marcus.initial).toContain('mar-04');
    expect(MENTOR_PROMPTS.nietzsche.initial).toContain('nie-06');
  });

  it('Mevlânâ kataloğunda yanlış atfedilen sözler yok', () => {
    const texts = VERIFIED_QUOTES.mevlana!.quotes.map((q) => q.text).join(' ');
    expect(texts).not.toMatch(/ne olursan ol/i);
    expect(texts).not.toMatch(/ışığın (sana |içeri )?girdiği/i);
  });

  it('bölüm numarası olmayan alıntıda sonda boşluk kalmaz', () => {
    expect(resolveQuoteTags('[[alinti:nie-05]]', 'nietzsche')).toBe('“Ol, olduğun kişi!”\n— Nietzsche, Böyle Buyurdu Zerdüşt IV, Bal Sunusu');
  });

  it('Seneca promptu ölümü bir seçenek olarak sunmayı yasaklar', () => {
    expect(SENECA_PROMPT.initial).toMatch(/Never present death/);
  });
});
