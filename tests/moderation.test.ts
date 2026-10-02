import { describe, expect, it } from 'vitest';
import { moderateInput, normalizeForModeration } from '@/lib/safety/moderation';

describe('normalizeForModeration', () => {
  it('Türkçe büyük harfleri ve aksanları katlar', () => {
    expect(normalizeForModeration('İNTİHAR EDECEĞİM')).toBe('intihar edecegim');
    expect(normalizeForModeration('ÇOCUĞA  Şiddet')).toBe('cocuga siddet');
  });
});

describe('moderateInput — kriz', () => {
  it.each([
    'intihar edeceğim',
    'İNTİHAR EDECEĞİM',
    'intihar edecegim',
    'KENDİMİ ÖLDÜRMEK İSTİYORUM',
    'kendimi oldurmek istiyorum',
    'HAYATIMA SON VERECEĞİM',
    'Artık yaşamak istemiyorum',
    'bugün kendimi bitireceğim',
  ])('"%s" kriz olarak yakalanır', (text) => {
    expect(moderateInput(text)).toMatchObject({ allowed: false, reason: 'crisis' });
  });

  it.each([
    'Ölümün anlamı nedir?',
    'Hayat bazen anlamsız geliyor, ne yapmalıyım?',
    'Çok yorgunum ve motivasyonum yok',
    'Nietzsche intihar hakkında ne düşünürdü?',
    'Kendimi kesin bir karar vermiş gibi hissetmiyorum',
  ])('"%s" felsefi soru olarak geçer', (text) => {
    expect(moderateInput(text)).toEqual({ allowed: true });
  });
});

describe('moderateInput — zararlı içerik', () => {
  it('Türkçe karakterle başlayan desenler de eşleşir (eski \b hatası)', () => {
    expect(moderateInput('bir çocuğa zarar vermek istiyorum')).toMatchObject({ allowed: false, reason: 'harmful' });
  });

  it('bomba tarifi engellenir', () => {
    expect(moderateInput('BOMBA NASIL yapılır')).toMatchObject({ allowed: false, reason: 'harmful' });
  });

  it('çocuk yetiştirme sorusu engellenmez', () => {
    expect(moderateInput('Çocuğuma nasıl daha sabırlı davranabilirim?')).toEqual({ allowed: true });
  });
});
