import { describe, expect, it } from 'vitest';
import { comitative, dative, genitive } from '@/lib/tr';

describe('Türkçe ekler', () => {
  it('mentor adlarına doğru yönelme eki', () => {
    expect(['Jung', 'Nietzsche', 'Mevlânâ', 'Marcus', 'Seneca'].map(dative)).toEqual(["Jung'a", "Nietzsche'ye", "Mevlânâ'ya", "Marcus'a", "Seneca'ya"]);
  });
  it('tamlayan ve birliktelik ekleri', () => {
    expect(['Jung', 'Nietzsche', 'Mevlânâ', 'Seneca'].map(genitive)).toEqual(["Jung'un", "Nietzsche'nin", "Mevlânâ'nın", "Seneca'nın"]);
    expect(['Jung', 'Nietzsche', 'Seneca'].map(comitative)).toEqual(["Jung'la", "Nietzsche'yle", "Seneca'yla"]);
  });
});
