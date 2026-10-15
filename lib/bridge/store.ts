/**
 * "Aramızda" — iki kişilik konuşma odaları (ilişki modülü).
 *
 * Ham metin HİÇBİR YERDE saklanmaz; yalnızca yazanın onayladığı, Mentoriva'nın
 * yumuşattığı hâl ortak alana yazılır. Bir taraf odayı kapatınca oda ve bütün
 * mesajlar iki taraf için de silinir; 30 gün hareketsiz oda kendiliğinden silinir.
 *
 *   bridge:<id>        → { id, topic, members, invite, createdAt, updatedAt } (JSON)
 *   bridge-msgs:<id>   → onaylı mesajlar (liste, en yeni başta; atomik ekleme)
 *   bridges:<email>    → kişinin odaları (hash: id → '1')
 *
 * Admin panelinde gösterilmez. `deleteUser` → `deleteUserRooms`.
 */

import { randomBytes } from 'node:crypto';
import { getKV } from '@/lib/kv';
import { digest } from '@/lib/auth/tokens';

export const ROOM_TTL = 30 * 24 * 3600;
export const INVITE_TTL_MS = 7 * 24 * 3600 * 1000;
export const MAX_OPEN_ROOMS = 3;
export const MAX_MESSAGES = 200;
export const TOPIC_MAX = 80;
export const MESSAGE_MAX = 1200;

export interface RoomMember {
  username: string;
  name: string;
  joinedAt: string;
}

export interface Room {
  id: string;
  topic: string;
  members: RoomMember[];
  /** Bekleyen davet (yalnızca özeti tutulur). */
  invite: { hash: string; exp: number } | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomMessage {
  id: string;
  /** Gönderenin `members` içindeki sırası (0: odayı açan, 1: katılan). */
  from: 0 | 1;
  text: string;
  at: string;
}

const roomKey = (id: string) => `bridge:${id}`;
const msgKey = (id: string) => `bridge-msgs:${id}`;
const indexKey = (u: string) => `bridges:${u}`;
export const isRoomId = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{16}$/.test(v);

const parse = <T>(raw: unknown): T | null => {
  if (!raw) return null;
  try { return (typeof raw === 'string' ? JSON.parse(raw) : raw) as T; } catch { return null; }
};

async function saveRoom(room: Room): Promise<void> {
  const kv = getKV();
  room.updatedAt = new Date().toISOString();
  await kv.set(roomKey(room.id), JSON.stringify(room), { ex: ROOM_TTL });
  await kv.expire(msgKey(room.id), ROOM_TTL).catch(() => 0);
}

export async function getRoom(id: string): Promise<Room | null> {
  return isRoomId(id) ? parse<Room>(await getKV().get(roomKey(id))) : null;
}

export function memberIndex(room: Room, username: string): 0 | 1 | -1 {
  const i = room.members.findIndex((m) => m.username === username);
  return i === 0 || i === 1 ? i : -1;
}

/** Kişinin hâlâ var olan odaları (süresi dolanlar dizinden temizlenir). */
export async function listRooms(username: string): Promise<Room[]> {
  const kv = getKV();
  const ids = Object.keys((await kv.hgetall<Record<string, unknown>>(indexKey(username))) ?? {});
  const rooms: Room[] = [];
  for (const id of ids) {
    const r = await getRoom(id);
    if (r && memberIndex(r, username) !== -1) rooms.push(r);
    else await kv.hdel(indexKey(username), id);
  }
  return rooms.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Oda açar; davet anahtarı yalnızca burada düz döner. */
export async function createRoom(username: string, name: string, topic: string): Promise<{ room: Room; inviteToken: string } | 'limit'> {
  if ((await listRooms(username)).length >= MAX_OPEN_ROOMS) return 'limit';
  const now = new Date().toISOString();
  const inviteToken = randomBytes(24).toString('base64url');
  const room: Room = {
    id: randomBytes(8).toString('hex'),
    topic: topic.slice(0, TOPIC_MAX),
    members: [{ username, name, joinedAt: now }],
    invite: { hash: digest(inviteToken), exp: Date.now() + INVITE_TTL_MS },
    createdAt: now,
    updatedAt: now,
  };
  await saveRoom(room);
  await getKV().hset(indexKey(username), { [room.id]: '1' });
  return { room, inviteToken };
}

/** Yeni davet bağlantısı (eskisi geçersiz olur). Yalnızca odayı açan, ikinci kişi yokken. */
export async function renewInvite(room: Room): Promise<string | null> {
  if (room.members.length >= 2) return null;
  const token = randomBytes(24).toString('base64url');
  room.invite = { hash: digest(token), exp: Date.now() + INVITE_TTL_MS };
  await saveRoom(room);
  return token;
}

export type JoinResult = Room | 'invalid' | 'full' | 'self' | 'limit';

export async function joinRoom(id: string, token: string, username: string, name: string): Promise<JoinResult> {
  const room = await getRoom(id);
  if (!room || !room.invite || room.invite.exp < Date.now() || room.invite.hash !== digest(token)) return 'invalid';
  if (memberIndex(room, username) === 0) return 'self';
  if (room.members.length >= 2) return 'full';
  if ((await listRooms(username)).length >= MAX_OPEN_ROOMS) return 'limit';
  room.members.push({ username, name, joinedAt: new Date().toISOString() });
  room.invite = null;
  await saveRoom(room);
  await getKV().hset(indexKey(username), { [room.id]: '1' });
  return room;
}

export async function addMessage(room: Room, from: 0 | 1, text: string): Promise<RoomMessage> {
  const msg: RoomMessage = { id: randomBytes(6).toString('hex'), from, text: text.slice(0, MESSAGE_MAX), at: new Date().toISOString() };
  const kv = getKV();
  await kv.lpush(msgKey(room.id), JSON.stringify(msg));
  await kv.ltrim(msgKey(room.id), 0, MAX_MESSAGES - 1);
  await saveRoom(room);
  return msg;
}

/** Eskiden yeniye mesajlar. */
export async function listMessages(roomId: string): Promise<RoomMessage[]> {
  const raw = await getKV().lrange<unknown>(msgKey(roomId), 0, MAX_MESSAGES - 1);
  return raw.map((r) => parse<RoomMessage>(r)).filter((m): m is RoomMessage => !!m).reverse();
}

/** Odayı iki taraf için de siler. */
export async function closeRoom(room: Room): Promise<void> {
  const kv = getKV();
  await kv.del(roomKey(room.id), msgKey(room.id));
  for (const m of room.members) await kv.hdel(indexKey(m.username), room.id);
}

/** Hesap silinirken: kişinin bulunduğu bütün odalar kapanır. */
export async function deleteUserRooms(username: string): Promise<void> {
  for (const r of await listRooms(username)) await closeRoom(r);
  await getKV().del(indexKey(username));
}
