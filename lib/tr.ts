/**
 * Özel adlara Türkçe ek: kesme işaretiyle, büyük ünlü uyumuna ve ünlüyle
 * biten adda kaynaştırma harfine göre. Mentor adları için yeterli (Jung'a,
 * Nietzsche'ye, Mevlânâ'ya, Marcus'un, Seneca'yla).
 */

const VOWELS = 'aeıioöuüâîû';
const BACK = 'aıouâû';
const ROUNDED = 'oöuüû';
const FRONT_ROUNDED = 'öü';

function lastVowel(word: string): string {
  const w = word.toLocaleLowerCase('tr-TR');
  for (let i = w.length - 1; i >= 0; i--) if (VOWELS.includes(w[i]!)) return w[i]!;
  return 'e';
}

const endsWithVowel = (word: string) => VOWELS.includes(word.toLocaleLowerCase('tr-TR').slice(-1));

/** Yönelme: Jung'a, Nietzsche'ye. */
export function dative(name: string): string {
  const a = BACK.includes(lastVowel(name)) ? 'a' : 'e';
  return `${name}'${endsWithVowel(name) ? 'y' : ''}${a}`;
}

/** Tamlayan: Jung'un, Seneca'nın, Nietzsche'nin. */
export function genitive(name: string): string {
  const v = lastVowel(name);
  const i = ROUNDED.includes(v) ? (FRONT_ROUNDED.includes(v) ? 'ü' : 'u') : BACK.includes(v) ? 'ı' : 'i';
  return `${name}'${endsWithVowel(name) ? 'n' : ''}${i}n`;
}

/** Birliktelik: Jung'la, Seneca'yla, Nietzsche'yle. */
export function comitative(name: string): string {
  const a = BACK.includes(lastVowel(name)) ? 'a' : 'e';
  return `${name}'${endsWithVowel(name) ? 'y' : ''}l${a}`;
}
