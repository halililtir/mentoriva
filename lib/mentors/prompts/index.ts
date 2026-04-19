/**
 * Prompt Registry — tüm mentorların prompt bundle'larını tek yerden erişilebilir kılar.
 *
 * Yeni mentor eklemek:
 * 1. prompts/yeniMentor.ts oluştur, MentorPromptBundle export et
 * 2. Aşağıdaki MENTOR_PROMPTS'e ekle
 * 3. types/index.ts içinde MENTOR_IDS'e ID ekle
 * 4. metadata.ts'de MentorMetadata oluştur
 */

import type { MentorId, Message } from '@/types';
import { JUNG_PROMPT } from './jung';
import { MARCUS_PROMPT } from './marcus';
import { MEVLANA_PROMPT } from './mevlana';
import { NIETZSCHE_PROMPT } from './nietzsche';
import type { MentorPromptBundle } from './types';

export const MENTOR_PROMPTS: Record<MentorId, MentorPromptBundle> = {
  jung: JUNG_PROMPT,
  nietzsche: NIETZSCHE_PROMPT,
  mevlana: MEVLANA_PROMPT,
  marcus: MARCUS_PROMPT,
};

/**
 * Bir mentor için Claude API'ye gönderilecek mesajları oluşturur.
 *
 * Few-shot örnekleri Claude'un karakteri tutturmasına yardımcı olur,
 * ama her çağrıda ~800-1200 input token ekler. Prompt caching ile
 * (lib/claude/client.ts) bu maliyet tek sefere düşer.
 *
 * @param mentorId - Hangi mentor
 * @param userMessage - Kullanıcının son mesajı
 * @param chatHistory - Önceki mesajlar (sliding window zaten uygulanmış olmalı)
 * @param mode - 'initial' = ilk soru, 'chat' = devam eden sohbet
 */
export function buildMentorRequest(params: {
  mentorId: MentorId;
  userMessage: string;
  chatHistory?: Message[];
  mode: 'initial' | 'chat';
}): {
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
} {
  const { mentorId, userMessage, chatHistory = [], mode } = params;
  const bundle = MENTOR_PROMPTS[mentorId];
  const systemPrompt = mode === 'chat' ? bundle.chat : bundle.initial;

  // Few-shot örneklerini messages array'inin başına yerleştir.
  const fewShotMessages = bundle.examples.flatMap(
    (ex) =>
      [
        { role: 'user' as const, content: ex.user },
        { role: 'assistant' as const, content: ex.assistant },
      ] as const,
  );

  // Chat geçmişini role/content formatına çevir.
  const historyMessages = chatHistory.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return {
    system: systemPrompt,
    messages: [
      ...fewShotMessages,
      ...historyMessages,
      { role: 'user', content: userMessage },
    ],
  };
}
