/**
 * Hafıza — yalnızca kullanıcının ONAYLADIĞI notlar.
 *
 * Gizli profil yok, otomatik çıkarım yok: mentorlar yalnızca kişinin
 * "Yolculuğum → Hafızam" bölümünde gördüğü, düzeltebildiği ve silebildiği
 * notları bilir. Bir not ya kişinin kendi yazdığıdır ya da Mentoriva'nın
 * önerip kişinin düzenleyerek onayladığıdır.
 *
 *   memory:<email> → { enabled, notes: [{ id, text, source, createdAt }] }
 *
 * Admin panelinde gösterilmez; `deleteUser` siler.
 */

import { randomBytes } from 'node:crypto';
import { getKV } from '@/lib/kv';

export const NOTE_MAX = 200;
export const MAX_NOTES = 20;

export type NoteSource = 'self' | 'chat' | 'card';

export interface MemoryNote {
  id: string;
  text: string;
  source: NoteSource;
  createdAt: string;
}

export interface Memory {
  /** Kapalıysa notlar saklı kalır ama mentorlara gönderilmez. */
  enabled: boolean;
  notes: MemoryNote[];
}

const key = (u: string) => `memory:${u}`;
export const memoryKey = key;

export function cleanNote(v: unknown): string {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, NOTE_MAX) : '';
}

export async function getMemory(username: string): Promise<Memory> {
  const raw = await getKV().get<unknown>(key(username));
  try {
    const m = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Partial<Memory> | null;
    if (m && Array.isArray(m.notes)) return { enabled: m.enabled !== false, notes: m.notes };
  } catch {}
  return { enabled: true, notes: [] };
}

async function put(username: string, m: Memory): Promise<Memory> {
  await getKV().set(key(username), JSON.stringify(m));
  return m;
}

export async function addNote(username: string, text: string, source: NoteSource): Promise<Memory | 'full' | 'empty'> {
  const t = cleanNote(text);
  if (!t) return 'empty';
  const m = await getMemory(username);
  if (m.notes.length >= MAX_NOTES) return 'full';
  m.notes.unshift({ id: randomBytes(6).toString('hex'), text: t, source, createdAt: new Date().toISOString() });
  return put(username, m);
}

export async function editNote(username: string, id: string, text: string): Promise<Memory | null> {
  const t = cleanNote(text);
  const m = await getMemory(username);
  const n = m.notes.find((x) => x.id === id);
  if (!n || !t) return null;
  n.text = t;
  return put(username, m);
}

export async function deleteNote(username: string, id: string): Promise<Memory | null> {
  const m = await getMemory(username);
  const kept = m.notes.filter((x) => x.id !== id);
  if (kept.length === m.notes.length) return null;
  return put(username, { ...m, notes: kept });
}

export async function setMemoryEnabled(username: string, enabled: boolean): Promise<Memory> {
  return put(username, { ...(await getMemory(username)), enabled });
}

export async function clearMemory(username: string): Promise<void> {
  await getKV().del(key(username));
}

/**
 * Mentora giden mesajın başına eklenen not bloğu. Notlar açık değilse ya da
 * yoksa mesaj olduğu gibi döner.
 */
export function withMemory(message: string, memory: Memory | null): string {
  if (!memory?.enabled || memory.notes.length === 0) return message;
  const list = memory.notes.map((n) => `- ${n.text}`).join('\n');
  return `<kisinin_onayladigi_notlar>
${list}
</kisinin_onayladigi_notlar>
[Not: Bunlar kişinin önceki konuşmalardan hatırlanmasını kendi istediği notlar. Yalnızca bu mesajla gerçekten ilgiliyse kullan; ilgisizse hiç anma. Notlardan yeni bir çıkarım, teşhis ya da geçmiş üretme; notları sohbetin konusu yapma.]

${message}`;
}

/** Hata fırlatmaz: hafıza okunamazsa mesaj notsuz gider. */
export async function memoryFor(username: string): Promise<Memory | null> {
  try {
    return await getMemory(username);
  } catch {
    return null;
  }
}
