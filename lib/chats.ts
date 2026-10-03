/**
 * Kaydedilen sohbetler — YALNIZCA kullanıcı "Kaydet" dediğinde.
 *
 *   chats:<email>          → hash: id → özet (mentor, başlık, mesaj sayısı, tarih)
 *   chat:<email>:<id>      → sohbetin tamamı
 *
 * Ücretsiz üyelikte en fazla SAVED_CHAT_LIMIT sohbet; fazlası ileride ücretli
 * planla gelecek (arayüz bunu bilgilendirme olarak gösterir). Kayıtlar admin
 * panelinde gösterilmez; kullanıcı silebilir, hesap silinince hepsi silinir.
 */

import { randomBytes } from 'node:crypto';
import { getKV } from '@/lib/kv';
import { INPUT_LIMITS } from '@/lib/features';
import { MENTOR_IDS, type MentorId, type Message } from '@/types';

export const SAVED_CHAT_LIMIT = 5;
/** Bir sohbette saklanan en fazla mesaj; uzarsa ilk soru-cevap + son mesajlar tutulur. */
export const MAX_SAVED_MESSAGES = 80;
/** Mentor cevapları kullanıcı mesajından uzun olabilir. */
const MAX_MESSAGE_CHARS = Math.max(INPUT_LIMITS.MAX_CHAT_MESSAGE_LENGTH, 6000);

export interface SavedChatMeta {
  id: string;
  mentorId: MentorId;
  title: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavedChat extends SavedChatMeta {
  messages: Array<Pick<Message, 'role' | 'content'>>;
}

const indexKey = (u: string) => `chats:${u}`;
const chatKey = (u: string, id: string) => `chat:${u}:${id}`;

const parse = <T>(raw: unknown): T | null => {
  if (!raw) return null;
  try { return (typeof raw === 'string' ? JSON.parse(raw) : raw) as T; } catch { return null; }
};

export const isMentorId = (v: unknown): v is MentorId =>
  typeof v === 'string' && (MENTOR_IDS as readonly string[]).includes(v);

export const isChatId = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{16}$/.test(v);

/**
 * İstemciden gelen mesajları doğrular: user ile başlar, roller sırayla değişir,
 * metinler kırpılır. Geçersizse null.
 */
export function sanitizeMessages(raw: unknown): SavedChat['messages'] | null {
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const out: SavedChat['messages'] = [];
  for (const m of raw) {
    if (!m || typeof m !== 'object') return null;
    const role = (m as Record<string, unknown>)['role'];
    const content = (m as Record<string, unknown>)['content'];
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim()) return null;
    const expected = out.length % 2 === 0 ? 'user' : 'assistant';
    if (role !== expected) return null;
    out.push({ role, content: content.slice(0, MAX_MESSAGE_CHARS) });
  }
  if (out.length <= MAX_SAVED_MESSAGES) return out;
  // İlk soru-cevap kalsın (sohbetin konusu), gerisi sondan; çift sayı → user ile devam eder
  return [...out.slice(0, 2), ...out.slice(-(MAX_SAVED_MESSAGES - 2))];
}

function titleFrom(messages: SavedChat['messages']): string {
  const first = messages[0]?.content.replace(/\s+/g, ' ').trim() ?? '';
  return first.length > 90 ? `${first.slice(0, 87)}…` : first;
}

export async function listChats(username: string): Promise<SavedChatMeta[]> {
  const all = (await getKV().hgetall<Record<string, unknown>>(indexKey(username))) ?? {};
  return Object.values(all)
    .map((v) => parse<SavedChatMeta>(v))
    .filter((m): m is SavedChatMeta => !!m)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export async function getChat(username: string, id: string): Promise<SavedChat | null> {
  return parse<SavedChat>(await getKV().get(chatKey(username, id)));
}

async function write(username: string, chat: SavedChat): Promise<void> {
  const { messages: _messages, ...meta } = chat;
  const kv = getKV();
  await kv.set(chatKey(username, chat.id), chat);
  await kv.hset(indexKey(username), { [chat.id]: meta });
}

export type CreateResult = { ok: true; chat: SavedChatMeta } | { ok: false; reason: 'limit' };

export async function createChat(username: string, mentorId: MentorId, messages: SavedChat['messages']): Promise<CreateResult> {
  const existing = await listChats(username);
  if (existing.length >= SAVED_CHAT_LIMIT) return { ok: false, reason: 'limit' };
  const now = new Date().toISOString();
  const chat: SavedChat = {
    id: randomBytes(8).toString('hex'),
    mentorId,
    title: titleFrom(messages),
    count: messages.length,
    createdAt: now,
    updatedAt: now,
    messages,
  };
  await write(username, chat);
  const { messages: _m, ...meta } = chat;
  return { ok: true, chat: meta };
}

/** Kayıtlı sohbete yeni mesajları yazar. Kayıt yoksa (silinmişse) null. */
export async function updateChat(username: string, id: string, messages: SavedChat['messages']): Promise<SavedChatMeta | null> {
  const chat = await getChat(username, id);
  if (!chat) return null;
  const next: SavedChat = { ...chat, messages, count: messages.length, updatedAt: new Date().toISOString() };
  await write(username, next);
  const { messages: _m, ...meta } = next;
  return meta;
}

export async function deleteChat(username: string, id: string): Promise<void> {
  const kv = getKV();
  await kv.del(chatKey(username, id));
  await kv.hdel(indexKey(username), id);
}

/** Hesap silinirken: bütün kayıtlı sohbetler. */
export async function deleteAllChats(username: string): Promise<void> {
  const kv = getKV();
  const all = (await kv.hgetall<Record<string, unknown>>(indexKey(username))) ?? {};
  const ids = Object.keys(all);
  await kv.del(indexKey(username), ...ids.map((id) => chatKey(username, id)));
}
