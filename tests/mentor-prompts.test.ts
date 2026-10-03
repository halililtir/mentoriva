import { describe, expect, it } from 'vitest';
import { MENTOR_PROMPTS, buildMentorRequest } from '@/lib/mentors/prompts';
import { MENTOR_IDS } from '@/types';
import { LAB_QUESTIONS } from '@/lib/admin/lab';

describe('mentor talimatları', () => {
  it('örnek cevaplar sahte konuşma turu değil, system prompt içinde', () => {
    const { system, messages } = buildMentorRequest({ mentorId: 'jung', userMessage: 'Merhaba', mode: 'initial' });
    expect(messages).toEqual([{ role: 'user', content: 'Merhaba' }]);
    expect(system).toContain('# VOICE EXAMPLES');
  });

  it('her mentorun en az üç farklı örneği var', () => {
    for (const id of MENTOR_IDS) {
      const ex = MENTOR_PROMPTS[id].examples;
      expect(ex.length, id).toBeGreaterThanOrEqual(3);
      expect(new Set(ex.map((e) => e.user)).size, id).toBe(ex.length);
    }
  });

  it('sohbet talimatı derinleşme bloğunu içerir, ilk cevap içermez', () => {
    for (const id of MENTOR_IDS) {
      expect(MENTOR_PROMPTS[id].chat, id).toContain('# CONTINUING THE CONVERSATION');
      expect(MENTOR_PROMPTS[id].initial, id).not.toContain('# CONTINUING THE CONVERSATION');
    }
  });

  it('örnekler markdown ve yasaklı genel öğüt kalıbı içermez', () => {
    for (const id of MENTOR_IDS) {
      for (const ex of MENTOR_PROMPTS[id].examples) {
        expect(ex.assistant, id).not.toMatch(/\*\*|^#|^- /m);
        expect(ex.assistant, id).not.toMatch(/senin için değil|yükü bırak|zaman her şeyin ilacı/i);
      }
    }
  });

  it('kayan pencere mentor cevabıyla başlarsa ilk kullanıcı mesajına kadar kırpılır', () => {
    const { messages } = buildMentorRequest({
      mentorId: 'seneca',
      userMessage: 'Sonra?',
      chatHistory: [
        { role: 'assistant', content: 'eski cevap' },
        { role: 'user', content: 'soru' },
        { role: 'assistant', content: 'cevap' },
      ],
      mode: 'chat',
    });
    expect(messages[0]).toEqual({ role: 'user', content: 'soru' });
    expect(messages).toHaveLength(3);
  });

  it('laboratuvar soruları benzersiz', () => {
    expect(new Set(LAB_QUESTIONS.map((q) => q.id)).size).toBe(LAB_QUESTIONS.length);
  });
});
