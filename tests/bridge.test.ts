import { describe, expect, it } from 'vitest';
import {
  MAX_OPEN_ROOMS, addMessage, closeRoom, createRoom, deleteUserRooms, getRoom, isRoomId, joinRoom, isHere, isMuted, listMessages, listRooms, markHere, markSeen, memberIndex, renewInvite, setMuted, unreadRooms,
} from '@/lib/bridge/store';
import { parseSoften } from '@/lib/bridge/ai';

const u = () => `aramizda-${Math.random().toString(36).slice(2)}@example.test`;

async function open(a = u()) {
  const r = await createRoom(a, 'Ayşe', 'Hafta sonları');
  if (r === 'limit') throw new Error('limit');
  return { a, ...r };
}

describe('Aramızda odası', () => {
  it('davetle ikinci kişi katılır; davet tek kullanımlıktır', async () => {
    const { a, room, inviteToken } = await open();
    expect(isRoomId(room.id)).toBe(true);
    const b = u();
    expect(await joinRoom(room.id, 'yanlis', b, 'Mehmet')).toBe('invalid');
    expect(await joinRoom(room.id, inviteToken, a, 'Ayşe')).toBe('self');
    const joined = await joinRoom(room.id, inviteToken, b, 'Mehmet');
    if (typeof joined === 'string') throw new Error(joined);
    expect(memberIndex(joined, b)).toBe(1);
    expect(await joinRoom(room.id, inviteToken, u(), 'Üçüncü')).toBe('invalid');
    expect(await renewInvite(joined)).toBeNull();
  });

  it('yenilenen davet eskisini geçersiz kılar', async () => {
    const { room, inviteToken } = await open();
    const fresh = await renewInvite(room);
    expect(fresh).toBeTruthy();
    expect(await joinRoom(room.id, inviteToken, u(), 'X')).toBe('invalid');
    expect(typeof (await joinRoom(room.id, fresh!, u(), 'Y'))).toBe('object');
  });

  it(`kişi başı en fazla ${MAX_OPEN_ROOMS} açık konuşma`, async () => {
    const a = u();
    for (let i = 0; i < MAX_OPEN_ROOMS; i++) await open(a);
    expect(await createRoom(a, 'Ayşe', 'Fazlası')).toBe('limit');
  });

  it('mesajlar eskiden yeniye listelenir; kapatınca iki taraf için de silinir', async () => {
    const { a, room, inviteToken } = await open();
    const b = u();
    const joined = await joinRoom(room.id, inviteToken, b, 'Mehmet');
    if (typeof joined === 'string') throw new Error(joined);
    await addMessage(joined, 0, 'birinci');
    await addMessage(joined, 1, 'ikinci');
    expect((await listMessages(room.id)).map((m) => [m.from, m.text])).toEqual([[0, 'birinci'], [1, 'ikinci']]);
    await closeRoom(joined);
    expect(await getRoom(room.id)).toBeNull();
    expect(await listMessages(room.id)).toEqual([]);
    expect(await listRooms(a)).toEqual([]);
    expect(await listRooms(b)).toEqual([]);
  });

  it('hesap silinince kişinin konuşmaları karşı taraf için de kapanır', async () => {
    const { a, room, inviteToken } = await open();
    const b = u();
    await joinRoom(room.id, inviteToken, b, 'Mehmet');
    await deleteUserRooms(a);
    expect(await listRooms(b)).toEqual([]);
  });
});

describe('parseSoften', () => {
  it('güvenlik işaretini ve öneriyi okur, boşu reddeder', () => {
    expect(parseSoften({ safety: true })).toEqual({ safety: true });
    expect(parseSoften({ heard: 'Yorulmuşsun.', text: 'Bunu konuşmak istiyorum.', kept: 'İsteğin korundu.' })).toEqual({ safety: false, heard: 'Yorulmuşsun.', text: 'Bunu konuşmak istiyorum.', kept: 'İsteğin korundu.' });
    expect(parseSoften({ text: '   ' })).toBeNull();
    expect(parseSoften('metin')).toBeNull();
  });
});

describe('Aramızda eşzamanlılık', () => {
  it('kapatmadan sonra gelen gönderim odayı geri getirmez', async () => {
    const { a, room, inviteToken } = await open();
    const joined = await joinRoom(room.id, inviteToken, u(), 'Mehmet');
    if (typeof joined === 'string') throw new Error(joined);
    const stale = structuredClone(joined);
    await closeRoom(joined);
    expect(await addMessage(stale, 1, 'geç kalan')).toBeNull();
    expect(await getRoom(room.id)).toBeNull();
    expect(await listMessages(room.id)).toEqual([]);
    expect(await listRooms(a)).toEqual([]);
  });

  it('aynı davetle aynı anda yalnızca bir kişi katılır', async () => {
    const { room, inviteToken } = await open();
    const results = await Promise.all([joinRoom(room.id, inviteToken, u(), 'B'), joinRoom(room.id, inviteToken, u(), 'C')]);
    expect(results.filter((r) => typeof r === 'object')).toHaveLength(1);
    expect((await getRoom(room.id))?.members).toHaveLength(2);
  });
});

describe('Aramızda okunmamış ve bildirim', () => {
  it('karşı tarafın mesajı görülene kadar yeni sayılır', async () => {
    const { a, room, inviteToken } = await open();
    const b = u();
    const joined = await joinRoom(room.id, inviteToken, b, 'Mehmet');
    if (typeof joined === 'string') throw new Error(joined);
    await addMessage(joined, 0, 'merhaba');
    expect((await unreadRooms(await listRooms(b), b)).has(room.id)).toBe(true);
    expect((await unreadRooms(await listRooms(a), a)).has(room.id)).toBe(false);
    await markSeen((await getRoom(room.id))!, 1);
    expect((await unreadRooms(await listRooms(b), b)).has(room.id)).toBe(false);
  });

  it('bildirim kapatılabilir, kişiye özeldir ve oda kapanınca silinir', async () => {
    const { room, inviteToken } = await open();
    const joined = await joinRoom(room.id, inviteToken, u(), 'Mehmet');
    if (typeof joined === 'string') throw new Error(joined);
    await setMuted(room.id, 1, true);
    expect(await isMuted(room.id, 1)).toBe(true);
    expect(await isMuted(room.id, 0)).toBe(false);
    await setMuted(room.id, 1, false);
    expect(await isMuted(room.id, 1)).toBe(false);
    await setMuted(room.id, 0, true);
    await markHere(room.id, 1);
    expect(await isHere(room.id, 1)).toBe(true);
    await closeRoom(joined);
    expect(await isMuted(room.id, 0)).toBe(false);
    expect(await isHere(room.id, 1)).toBe(false);
  });
});
