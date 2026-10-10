import { describe, expect, it } from 'vitest';
import { MAX_NOTES, addNote, deleteNote, editNote, getMemory, setMemoryEnabled, withMemory } from '@/lib/memory/notes';
import { parseNoteSuggestions } from '@/lib/memory/suggest';
import { cardToNote } from '@/lib/feelings/card';
import { deleteUser } from '@/lib/auth/users';

const u = () => `hafiza-${Math.random().toString(36).slice(2)}@example.test`;

describe('hafıza (onaylı notlar)', () => {
  it('not ekler, düzeltir, siler; boş notu reddeder', async () => {
    const user = u();
    expect(await addNote(user, '   ', 'self')).toBe('empty');
    const m = await addNote(user, 'Kısa ve net cevapları seviyorum.', 'self');
    if (typeof m === 'string') throw new Error(m);
    const id = m.notes[0]!.id;
    expect((await editNote(user, id, 'Kısa cevapları seviyorum.'))?.notes[0]?.text).toBe('Kısa cevapları seviyorum.');
    expect((await deleteNote(user, id))?.notes).toEqual([]);
    expect(await deleteNote(user, id)).toBeNull();
  });

  it(`en fazla ${MAX_NOTES} not tutar`, async () => {
    const user = u();
    for (let i = 0; i < MAX_NOTES; i++) await addNote(user, `not ${i}`, 'self');
    expect(await addNote(user, 'fazlası', 'self')).toBe('full');
  });

  it('kapalıysa ya da not yoksa mentora giden mesaj değişmez', async () => {
    const user = u();
    expect(withMemory('Soru', await getMemory(user))).toBe('Soru');
    await addNote(user, 'Bu yıl yeni bir işe başladım.', 'self');
    const on = withMemory('Soru', await getMemory(user));
    expect(on).toContain('<kisinin_onayladigi_notlar>');
    expect(on).toContain('- Bu yıl yeni bir işe başladım.');
    expect(on.endsWith('Soru')).toBe(true);
    await setMemoryEnabled(user, false);
    expect(withMemory('Soru', await getMemory(user))).toBe('Soru');
  });

  it('hesap silinince notlar da silinir', async () => {
    const user = u();
    await addNote(user, 'Silinecek not', 'self');
    await deleteUser(user);
    expect((await getMemory(user)).notes).toEqual([]);
  });

  it('öneri çıktısını temizler: en fazla iki, tırnaksız, çok kısa olanlar atılır', () => {
    expect(parseNoteSuggestions({ notes: ['“Yeni bir işe başladım.”', 'kısa', 'Yeni bir işe başladım.', 'Annemle sınır koymaya çalışıyorum.', 'üçüncü uzun bir not daha'] })).toEqual([
      'Yeni bir işe başladım.',
      'Annemle sınır koymaya çalışıyorum.',
    ]);
    expect(parseNoteSuggestions({ notes: 'x' })).toEqual([]);
  });

  it('karttan not taslağı yorumu içermez', () => {
    const n = cardToNote({ situation: 'Toplantı', feelings: ['Kırgınlık'], thought: 'Beni önemsemiyorlar', matters: ['Anlaşılmak'], note: '', step: '' });
    expect(n).toContain('kırgınlık');
    expect(n).toContain('anlaşılmak');
    expect(n).not.toContain('önemsemiyorlar');
    expect(cardToNote({ situation: '', feelings: [], thought: '', matters: [], note: '', step: '' })).toBe('');
  });
});
