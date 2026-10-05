/**
 * Kendine Yolculuk — sabit içerikler (başlangıç noktaları, küçük adımlar,
 * mentor yönlendirmeleri). Metinleri değiştirmek için bileşenlere dokunma.
 */

import type { MentorId } from '@/types';

/** Yolculuk başına düşen soru hakkı (sorular + sonuç = iki yapay zekâ çağrısı). */
export const JOURNEY_COST = 2;

export const STORY_MIN = 30;
export const STORY_MAX = 2000;
export const ANSWER_MAX = 600;
export const QUESTION_COUNT = 3;

export const STARTING_POINTS = [
  { id: 'tanimak', label: 'Kendimi tanımak istiyorum.' },
  { id: 'karar', label: 'Bir kararın eşiğindeyim.' },
  { id: 'yon', label: 'Hayatımda yön arıyorum.' },
  { id: 'sikisma', label: 'Kendimi yorgun ve sıkışmış hissediyorum.' },
  { id: 'degisim', label: 'Değişmek istiyorum ama nereden başlayacağımı bilmiyorum.' },
  { id: 'anlamak', label: 'İçimde ne olduğunu anlamakta zorlanıyorum.' },
] as const;

/** Yolculuğun sonunda önerilebilecek küçük adımlar. Model yalnızca bu kimlikleri seçer. */
export const SMALL_STEPS = {
  konusma: 'Bir konuşmayı açıkça yapmak',
  sinir: 'Kendin için küçük bir sınır koymak',
  baslamak: 'Ertelediğin bir işe başlamak',
  ihtiyac: 'Bir ihtiyacını ifade etmek',
  dusunme: '10 dakikalık bir düşünme egzersizi yapmak',
  birakmak: 'Kontrol edemediğin bir şeyi bırakmayı denemek',
} as const;

export type SmallStepId = keyof typeof SMALL_STEPS;
export const SMALL_STEP_IDS = Object.keys(SMALL_STEPS) as SmallStepId[];

/** Sonuç ekranında mentorla devam çağrısı — mentorun bakış açısına göre. */
export const MENTOR_INVITES: Record<MentorId, string> = {
  jung: 'Bu duygunun köküne Jung’la bak',
  nietzsche: 'Başkalarının beklentilerini Nietzsche’yle sorgula',
  mevlana: 'Kendine daha merhametli bakmayı Mevlânâ’yla dene',
  marcus: 'Kontrol edebileceğin adıma Marcus’la dön',
  seneca: 'Zamanını ve öfkeni Seneca’yla gözden geçir',
  sokrates: 'Bunun neye dayandığını Sokrates’le birlikte sına',
};

export const MAP_FIELDS = [
  { key: 'topic', label: 'Şu an üzerinde durduğun konu' },
  { key: 'feelings', label: 'Öne çıkan duygular' },
  { key: 'needs', label: 'Temel ihtiyaçların' },
  { key: 'pattern', label: 'Fark edebileceğin olası örüntü' },
  { key: 'control', label: 'Kontrol edebileceğin alan' },
  { key: 'question', label: 'Üzerinde düşünebileceğin soru' },
] as const;

export type MapKey = (typeof MAP_FIELDS)[number]['key'];
