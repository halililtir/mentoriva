import { describe, expect, it } from 'vitest';
import { classifyQuestion } from '@/lib/admin/topics';

describe('soru konuları', () => {
  it('iş ve karar sorularını yakalar', () => {
    expect(classifyQuestion('İşimi bırakıp kendi yolumu çizmeli miyim?')).toEqual(expect.arrayContaining(['kariyer', 'karar']));
  });

  it('aile ve anlam', () => {
    expect(classifyQuestion('Annemle sürekli tartışıyoruz')).toContain('aile');
    expect(classifyQuestion('Hayatın anlamını kaybettim gibi hissediyorum.')).toContain('anlam');
  });

  it('büyük harf ve Türkçe karakterden etkilenmez', () => {
    expect(classifyQuestion('KAYGILARIMLA NASIL BAŞA ÇIKARIM')).toContain('kaygi');
  });

  it('alakasız metin boş döner', () => {
    expect(classifyQuestion('Merhaba')).toEqual([]);
  });
});
