/**
 * Yerel geliştirme için sahte mentor cevabı.
 *
 * MENTORIVA_MOCK_AI=1 ve NODE_ENV !== 'production' iken Claude API çağrılmaz;
 * arayüz ve streaming animasyonları API anahtarı olmadan denenebilir.
 * Production'da asla devreye girmez.
 */

import type { MentorId } from '@/types';
import type { StreamChunk } from './client';

const SAMPLES: Record<MentorId, string> = {
  jung: 'Sorduğun şeyin kendisi, bilinçdışının sana uzattığı bir ip ucu. Kaçtığın her şey, bir gün kapını başka bir kılıkta çalar. Bu soruyu sana sorduran gölgeye bakmaya hazır mısın?',
  nietzsche: 'Kolay cevap istiyorsun; oysa seni büyütecek olan, cevabın kendisi değil, ona tırmanırken yaşadığın acıdır. Sürünün güvenli patikasını bırak. Kendi değerini yaratmaya cesaretin var mı?',
  mevlana: 'Ey can, aradığın şey seni de arıyor. Kalbindeki bu sızı, aşkın kapıyı çalışıdır. Biraz sus, biraz dinle; cevap sözcüklerde değil, sükûnetin içinde saklı. Kapı açık.',
  seneca: 'Bana yazdığın şeyi okudum dostum ve kendimi gördüm. Hepimiz zamanın az olduğundan yakınırız; oysa onu farkında olmadan dağıtırız. Bu akşam günü baştan sona gözden geçir ve hangi saatin gerçekten senin olduğunu bul. Sağlıcakla kal.',
  marcus: 'Kontrol edebildiğin ile edemediğini ayır. Geriye kalan tek soru şudur: bugün, şu an, erdemle ne yapabilirsin? Gerisi zihninin kurduğu gürültüdür. Kalk ve görevini yap.',
};

/** Doğrulanmış alıntı kataloğu olan mentorlar için örnek etiket — filtre zinciri yerelde de denensin. */
const SAMPLE_TAGS: Partial<Record<MentorId, string>> = {
  marcus: '\n\n[[alinti:mar-04]]',
  nietzsche: '\n\n[[alinti:nie-06]]',
  mevlana: '\n\n[[alinti:mev-04]]',
  seneca: '\n\n[[alinti:sen-01]]',
};

export function isMockEnabled(): boolean {
  return process.env['MENTORIVA_MOCK_AI'] === '1' && process.env.NODE_ENV !== 'production';
}

export async function* mockStream(mentorId: MentorId, signal?: AbortSignal): AsyncGenerator<StreamChunk> {
  const words = (SAMPLES[mentorId] + (SAMPLE_TAGS[mentorId] ?? '')).split(/(?<=\s)/);
  await sleep(400 + Math.random() * 900);
  let fullText = '';
  for (const word of words) {
    if (signal?.aborted) return;
    fullText += word;
    yield { type: 'text_delta', text: word };
    await sleep(25 + Math.random() * 60);
  }
  yield { type: 'complete', fullText };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
