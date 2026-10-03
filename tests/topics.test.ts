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

  it('tekrar eden hatalar kendini tanımaya girer; "olumlu" kayıp sayılmaz', () => {
    expect(classifyQuestion('Neden hep aynı hataları tekrarlıyorum?')).toContain('benlik');
    expect(classifyQuestion('Daha olumlu nasıl düşünürüm?')).not.toContain('kayip');
    expect(classifyQuestion('Babamın ölümünü kabullenemiyorum')).toContain('kayip');
  });

  it('alakasız metin boş döner', () => {
    expect(classifyQuestion('Merhaba')).toEqual([]);
  });
});
