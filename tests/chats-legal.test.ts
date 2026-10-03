import { beforeEach, describe, expect, it } from 'vitest';
import { _resetKVForTesting, getKV } from '@/lib/kv';
import { SAVED_CHAT_LIMIT, createChat, deleteChat, getChat, listChats, sanitizeMessages, updateChat } from '@/lib/chats';
import { deleteUser } from '@/lib/auth/users';
import { toSavable } from '@/components/chat/ChatSave';
import { POST as register } from '@/app/api/v1/auth/register/route';

const U = 'kayit@example.com';
const pair = (q: string) => [
  { role: 'user' as const, content: q },
  { role: 'assistant' as const, content: `${q} cevabı` },
];

beforeEach(() => {
  _resetKVForTesting();
});

describe('kayıtlı sohbetler', () => {
  it('sırayla değişmeyen ya da kullanıcıyla başlamayan mesajları reddeder', () => {
    expect(sanitizeMessages(pair('a'))).toHaveLength(2);
    expect(sanitizeMessages([{ role: 'assistant', content: 'x' }, { role: 'user', content: 'y' }])).toBeNull();
    expect(sanitizeMessages([{ role: 'user', content: 'x' }, { role: 'user', content: 'y' }])).toBeNull();
    expect(sanitizeMessages([{ role: 'user', content: '  ' }, { role: 'assistant', content: 'y' }])).toBeNull();
    expect(sanitizeMessages('yok')).toBeNull();
  });

  it('çok uzun sohbette ilk soru-cevap ve son mesajlar kalır', () => {
    const long = Array.from({ length: 60 }, (_, i) => pair(`s${i}`)).flat();
    const out = sanitizeMessages(long)!;
    expect(out.length).toBeLessThanOrEqual(80);
    expect(out[0]!.content).toBe('s0');
    expect(out[1]!.role).toBe('assistant');
    expect(out[2]!.role).toBe('user');
    expect(out.at(-1)!.content).toBe('s59 cevabı');
  });

  it(`en fazla ${SAVED_CHAT_LIMIT} sohbet kaydedilir; silince yer açılır`, async () => {
    const ids: string[] = [];
    for (let i = 0; i < SAVED_CHAT_LIMIT; i++) {
      const r = await createChat(U, 'jung', pair(`soru ${i}`));
      expect(r.ok).toBe(true);
      if (r.ok) ids.push(r.chat.id);
    }
    expect(await createChat(U, 'jung', pair('fazla'))).toEqual({ ok: false, reason: 'limit' });
    await deleteChat(U, ids[0]!);
    expect((await createChat(U, 'seneca', pair('yeni'))).ok).toBe(true);
    expect(await listChats(U)).toHaveLength(SAVED_CHAT_LIMIT);
  });

  it('güncelleme mesajları ve sayıyı yazar, başkasının kaydına erişilemez', async () => {
    const r = await createChat(U, 'marcus', pair('ilk'));
    if (!r.ok) throw new Error('kayıt olmadı');
    const meta = await updateChat(U, r.chat.id, [...pair('ilk'), ...pair('ikinci')]);
    expect(meta?.count).toBe(4);
    expect((await getChat(U, r.chat.id))?.messages).toHaveLength(4);
    expect(await getChat('baska@example.com', r.chat.id)).toBeNull();
    expect(await updateChat('baska@example.com', r.chat.id, pair('x'))).toBeNull();
  });

  it('hesap silinince bütün kayıtlı sohbetler de silinir', async () => {
    const r = await createChat(U, 'nietzsche', pair('soru'));
    if (!r.ok) throw new Error('kayıt olmadı');
    await deleteUser(U);
    expect(await listChats(U)).toEqual([]);
    expect(await getKV().get(`chat:${U}:${r.chat.id}`)).toBeNull();
  });

  it('istemci kaydı soru-cevap çiftlerine indirger', () => {
    const msgs = [
      { role: 'user' as const, content: 'soru', id: '1' },
      { role: 'assistant' as const, content: 'cevap', id: '2' },
      { role: 'user' as const, content: 'kriz mesajı', id: '3' },
      { role: 'user' as const, content: 'yeni soru', id: '4' },
      { role: 'assistant' as const, content: 'yeni cevap', id: '5' },
      { role: 'user' as const, content: 'cevapsız', id: '6' },
    ];
    expect(toSavable(msgs).map((m) => m.content)).toEqual(['soru', 'cevap', 'yeni soru', 'yeni cevap']);
  });
});

describe('kayıt onayları', () => {
  const req = (body: Record<string, unknown>) =>
    new Request('http://localhost/api/v1/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
      body: JSON.stringify({ name: 'Deneme', email: 'onay@example.com', password: 'cok-guclu-parola-123', ...body }),
    });

  it('yaş/şart onayı ya da yurt dışı aktarım rızası yoksa kayıt reddedilir', async () => {
    expect((await register(req({ adult: true, terms: true }))).status).toBe(400);
    expect((await register(req({ transfer: true }))).status).toBe(400);
    expect((await register(req({ adult: 'true', terms: true, transfer: true }))).status).toBe(400);
  });
});
