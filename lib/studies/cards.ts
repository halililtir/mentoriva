/**
 * Çalışma kartları — kullanıcının AÇIKÇA kaydettiği farkındalık kartları.
 *
 * Ortak çalışma altyapısının kart parçası: şimdilik "İçimde ne var?" kartları
 * (`kind: 'feelings'`); yeni çalışmalar aynı listeye kendi türüyle eklenir.
 * Küçük adımlar ayrı tutulur ve Kendine Yolculuk ile ortaktır
 * (`lib/journey/store.ts → journey-step:<email>`, ana sayfa hatırlatması).
 *
 *   cards:<email> → en yeni başta, en fazla MAX_CARDS kart (JSON)
 *
 * Admin panelinde gösterilmez; kullanıcı silebilir; `deleteUser` hepsini siler.
 */

import { randomBytes } from 'node:crypto';
import { getKV } from '@/lib/kv';
import { CARD_LIMITS } from '@/lib/feelings/content';

export type CardKind = 'feelings' | 'study';

export interface StudyCard {
  id: string;
  kind: CardKind;
  createdAt: string;
  /** Yaşadığım durum. */
  situation: string;
  /** Bana yakın gelen duygular (ad olarak; kişinin kendi yazdıkları da olabilir). */
  feelings: string[];
  /** Aklımdan geçen yorum. */
  thought: string;
  /** Benim için önemli olan. */
  matters: string[];
  /** Kişinin eklediği serbest not. */
  note: string;
  /** Varsa seçtiği adım (metin olarak). */
  step: string;
  /** Rehberli çalışmada çalışmanın adı. */
  title?: string;
  /** Rehberli çalışmada kişinin söylediklerinin aynası. */
  reflection?: string;
}

export const MAX_CARDS = 30;
const key = (u: string) => `cards:${u}`;

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const list = (v: unknown) =>
  Array.isArray(v)
    ? [...new Set(v.map((x) => text(x, CARD_LIMITS.item)).filter(Boolean))].slice(0, CARD_LIMITS.items)
    : [];

/** İstemciden gelen kartı alan alan sınırlar; boşsa null. */
export function sanitizeCard(raw: unknown): Omit<StudyCard, 'id' | 'createdAt' | 'kind'> | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const card = {
    situation: text(o['situation'], CARD_LIMITS.situation),
    feelings: list(o['feelings']),
    thought: text(o['thought'], CARD_LIMITS.thought),
    matters: list(o['matters']),
    note: text(o['note'], CARD_LIMITS.note),
    step: text(o['step'], 220),
    ...(text(o['title'], 80) ? { title: text(o['title'], 80) } : {}),
    ...(text(o['reflection'], 700) ? { reflection: text(o['reflection'], 700) } : {}),
  };
  return card.situation || card.feelings.length || card.matters.length || card.thought || card.note ? card : null;
}

const parse = (r: unknown): StudyCard | null => {
  try { return (typeof r === 'string' ? JSON.parse(r) : r) as StudyCard; } catch { return null; }
};

export async function listCards(username: string): Promise<StudyCard[]> {
  const raw = await getKV().lrange<unknown>(key(username), 0, MAX_CARDS - 1);
  return raw.map(parse).filter((c): c is StudyCard => !!c);
}

export async function saveCard(username: string, kind: CardKind, fields: Omit<StudyCard, 'id' | 'createdAt' | 'kind'>): Promise<StudyCard> {
  const card: StudyCard = { id: randomBytes(6).toString('hex'), kind, createdAt: new Date().toISOString(), ...fields };
  const kv = getKV();
  await kv.lpush(key(username), JSON.stringify(card));
  await kv.ltrim(key(username), 0, MAX_CARDS - 1);
  return card;
}

export async function deleteCard(username: string, id: string): Promise<boolean> {
  const all = await listCards(username);
  const kept = all.filter((c) => c.id !== id);
  if (kept.length === all.length) return false;
  const kv = getKV();
  await kv.del(key(username));
  for (const c of [...kept].reverse()) await kv.lpush(key(username), JSON.stringify(c));
  return true;
}

export async function deleteAllCards(username: string): Promise<void> {
  await getKV().del(key(username));
}

export const cardsKey = key;
