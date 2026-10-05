import { describe, expect, it } from 'vitest';
import { foldPerspectives, perspectiveMessage, validateChatMessages } from '@/lib/mentors/perspective';
import { parsePicks } from '@/lib/mentors/recommend';
import { toSavable } from '@/components/chat/ChatSave';
import type { Message } from '@/types';

const chat: Message[] = [
  { role: 'user', content: 'İşimden sıkıldım.' },
  { role: 'assistant', content: 'Marcus cevabı.' },
  { role: 'assistant', content: 'Nietzsche bakışı.', guest: 'nietzsche' },
  { role: 'user', content: 'Peki ne yapayım?' },
];

describe('başka bir bakış', () => {
  it('konuk işaretini yalnızca assistant mesajında ve geçerli kimlikle kabul eder', () => {
    const r = validateChatMessages(
      [
        { role: 'user', content: 'a', guest: 'jung' },
        { role: 'assistant', content: 'b', guest: 'yok' },
        { role: 'assistant', content: 'c', guest: 'seneca' },
      ],
      'assistant',
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.messages[0]).not.toHaveProperty('guest');
    expect(r.messages[1]).not.toHaveProperty('guest');
    expect(r.messages[2]?.guest).toBe('seneca');
  });

  it('son mesajın rolünü denetler', () => {
    expect(validateChatMessages(chat, 'assistant').ok).toBe(false);
    expect(validateChatMessages(chat, 'user').ok).toBe(true);
  });

  it('konuk mesajını sonraki kullanıcı mesajına etiketli not olarak katlar', () => {
    const folded = foldPerspectives(chat);
    expect(folded.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
    expect(folded[2]?.content).toContain('<baska_bir_bakis mentor="Nietzsche">');
    expect(folded[2]?.content).toContain('Nietzsche bakışı.');
    expect(folded[2]?.content.endsWith('Peki ne yapayım?')).toBe(true);
  });

  it('cevaplanmamış konuk mesajı asıl mentora gitmez', () => {
    expect(foldPerspectives(chat.slice(0, 3)).map((m) => m.role)).toEqual(['user', 'assistant']);
  });

  it('konuk mentorun dökümü kimin ne dediğini ayırır', () => {
    const msg = perspectiveMessage('marcus', 'seneca', chat.slice(0, 3));
    expect(msg).toContain('Kişi:\nİşimden sıkıldım.');
    expect(msg).toContain('Marcus:\nMarcus cevabı.');
    expect(msg).toContain('Nietzsche:\nNietzsche bakışı.');
  });

  it('kayıtlı sohbete konuk mesajları yazılmaz', () => {
    expect(toSavable(chat.slice(0, 3)).map((m) => m.content)).toEqual(['İşimden sıkıldım.', 'Marcus cevabı.']);
  });
});

describe('mentor önerisi', () => {
  it('yalnızca izinli, tekrarsız kimlikleri ve sınır kadarını alır', () => {
    const raw = {
      picks: [
        { id: 'sokrates', why: 'kilitli' },
        { id: 'jung', why: 'Jung kalıplara bakar.' },
        { id: 'jung', why: 'tekrar' },
        { id: 'uydurma', why: 'yok' },
        { id: 'seneca', why: '' },
        { id: 'marcus', why: 'Marcus elindekine bakar.' },
        { id: 'mevlana', why: 'fazla' },
      ],
    };
    expect(parsePicks(raw, ['jung', 'marcus', 'mevlana', 'seneca'], 2)).toEqual([
      { id: 'jung', why: 'Jung kalıplara bakar.' },
      { id: 'marcus', why: 'Marcus elindekine bakar.' },
    ]);
  });

  it('bozuk çıktıda boş liste döner', () => {
    expect(parsePicks(null, ['jung'], 2)).toEqual([]);
    expect(parsePicks({ picks: 'x' }, ['jung'], 2)).toEqual([]);
  });
});
