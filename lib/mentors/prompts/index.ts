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
import { SENECA_PROMPT } from './seneca';
import type { MentorPromptBundle } from './types';

export const MENTOR_PROMPTS: Record<MentorId, MentorPromptBundle> = {
  jung: JUNG_PROMPT,
  nietzsche: NIETZSCHE_PROMPT,
  mevlana: MEVLANA_PROMPT,
  marcus: MARCUS_PROMPT,
  seneca: SENECA_PROMPT,
};

/**
 * Bir mentor için Claude API'ye gönderilecek mesajları oluşturur.
 *
 * Örnek cevaplar system prompt'ta durur; prompt caching ile
 * (lib/claude/client.ts) her çağrıda yeniden faturalanmaz.
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

  // Örnek cevaplar artık system prompt'un içinde (prompts/shared.ts → examplesBlock);
  // sahte konuşma turu olarak verilmez.

  // Chat geçmişini role/content formatına çevir. Kayan pencere bir mentor
  // cevabıyla başlayabilir; konuşma kullanıcıyla başlamalı.
  const firstUser = chatHistory.findIndex((m) => m.role === 'user');
  const historyMessages = (firstUser === -1 ? [] : chatHistory.slice(firstUser)).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return {
    system: systemPrompt,
    messages: [
      ...historyMessages,
      { role: 'user', content: userMessage },
    ],
  };
}
