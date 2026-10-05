/**
 * Sohbette "Başka bir bakış ekle": kişi bir mentorla konuşurken başka bir
 * mentordan, o ana kadarki sohbeti okuyup kendi bakışını eklemesini ister.
 *
 * - Konuk mentorun mesajı istemcide `guest: <mentorId>` işaretli assistant
 *   mesajı olarak tutulur.
 * - Asıl mentora giderken bu mesajlar sırayı bozmasın diye bir sonraki
 *   kullanıcı mesajının başına etiketli not olarak katlanır (`foldPerspectives`).
 *   Böylece asıl mentor konuğun söylediğini görür ama kendisi yazmış sanmaz.
 * - Konuk mentora sohbet, okunacak bir döküm olarak tek kullanıcı mesajında gider
 *   (`perspectiveMessage`).
 */

import { INPUT_LIMITS } from '@/lib/features';
import { getActiveMentor } from '@/lib/mentors/metadata';
import { MENTOR_IDS, type MentorId, type Message } from '@/types';

/** Konuk mentora gönderilen dökümde en fazla bu kadar mesaj (ilk soru-cevap korunur). */
export const PERSPECTIVE_TRANSCRIPT_MESSAGES = 16;

/**
 * İstemciden gelen sohbet mesajlarını doğrular. Son pencere alınır; `guest`
 * yalnızca assistant mesajında ve geçerli bir mentor kimliğiyle kabul edilir.
 */
export function validateChatMessages(
  raw: unknown,
  lastRole: Message['role'],
): { ok: true; messages: Message[] } | { ok: false; error: string } {
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, error: 'messages boş olamaz' };
  const messages: Message[] = [];
  for (const m of raw.slice(-INPUT_LIMITS.MAX_CHAT_REQUEST_MESSAGES)) {
    if (
      !m ||
      typeof m !== 'object' ||
      (m.role !== 'user' && m.role !== 'assistant') ||
      typeof m.content !== 'string' ||
      m.content.trim().length === 0
    ) {
      return { ok: false, error: 'Geçersiz mesaj formatı' };
    }
    if (m.content.length > INPUT_LIMITS.MAX_CHAT_MESSAGE_LENGTH) {
      return { ok: false, error: `Mesaj en fazla ${INPUT_LIMITS.MAX_CHAT_MESSAGE_LENGTH} karakter olabilir` };
    }
    const guest = m.role === 'assistant' && typeof m.guest === 'string' && MENTOR_IDS.includes(m.guest as MentorId) ? (m.guest as MentorId) : undefined;
    messages.push({ role: m.role, content: m.content, ...(guest ? { guest } : {}) });
  }
  if (messages[messages.length - 1]?.role !== lastRole) {
    return { ok: false, error: lastRole === 'user' ? 'Son mesaj kullanıcıdan olmalı' : 'Son mesaj mentordan olmalı' };
  }
  return { ok: true, messages };
}

const noteFor = (guest: MentorId, content: string) =>
  `<baska_bir_bakis mentor="${getActiveMentor(guest).shortName}">\n${content.trim()}\n</baska_bir_bakis>`;

/**
 * Konuk mesajlarını asıl mentor için bir sonraki kullanıcı mesajına katlar.
 * Sonda kalan (henüz cevaplanmamış) konuk mesajı düşer.
 */
export function foldPerspectives(messages: Message[]): Message[] {
  const out: Message[] = [];
  let pending: string[] = [];
  for (const m of messages) {
    if (m.guest) {
      pending.push(noteFor(m.guest, m.content));
      continue;
    }
    if (m.role === 'user' && pending.length) {
      out.push({ role: 'user', content: `${pending.join('\n\n')}\n\n${m.content}` });
      pending = [];
    } else {
      out.push({ role: m.role, content: m.content });
    }
  }
  return out;
}

/** Konuk mentora giden tek mesaj: sohbet dökümü + ne istendiği. */
export function perspectiveMessage(hostId: MentorId, guestId: MentorId, messages: Message[]): string {
  const host = getActiveMentor(hostId).shortName;
  const limit = PERSPECTIVE_TRANSCRIPT_MESSAGES;
  const window = messages.length <= limit ? messages : [...messages.slice(0, 2), ...messages.slice(-(limit - 2))];
  const lines = window.map((m) => {
    const who = m.role === 'user' ? 'Kişi' : m.guest ? getActiveMentor(m.guest).shortName : host;
    return `${who}:\n${m.content.trim()}`;
  });
  const asked = guestId === hostId ? '' : getActiveMentor(guestId).shortName;
  return `<sohbet>
${lines.join('\n\n')}
</sohbet>

[Note: This person has been talking with ${host} (the conversation above). They now asked you${asked ? `, ${asked},` : ''} for your own view as well. Do not summarize the conversation and do not grade ${host}'s answers. From your own way of thinking, add what you see in the person's matter that has not been said yet; you may respectfully differ from ${host}. Speak to the person directly, as yourself. Rely only on what the person wrote. Keep it shorter than a first answer: about 80-170 words.]`;
}
