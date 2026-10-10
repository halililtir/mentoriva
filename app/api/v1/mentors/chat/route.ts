/**
 * POST /api/v1/mentors/chat
 *
 * Seçilen tek mentor ile devam eden sohbet. Streaming ile cevap döner.
 *
 * Request:
 *   { mentorId: "jung", messages: [...] }
 *
 * Response: SSE stream
 *   data: {"type":"quota","remaining":3}
 *   data: {"type":"delta","text":"..."}
 *   data: {"type":"end"}
 *
 * Akış: oturum → rate limit → doğrulama → moderasyon → kota ayır → stream.
 * Mentor cevap üretemezse ayrılan kota iade edilir.
 */

import { streamMentorResponse } from '@/lib/claude/client';
import { CRISIS_RESPONSE, INPUT_LIMITS } from '@/lib/features';
import { moderateInput } from '@/lib/safety/moderation';
import { recordEvent } from '@/lib/admin/metrics';
import { logError } from '@/lib/admin/errors';
import { awardBadges, getPerks } from '@/lib/badges';
import { canUseMentor } from '@/lib/mentors/access';
import { getEarlyMentors } from '@/lib/mentors/access-server';
import { apiError, authorizeMentorRequest, encodeSSE, singleEventResponse, sseHeaders } from '@/lib/sse';
import { recordQuestion, releaseQuestion, reserveQuestion } from '@/lib/auth/users';
import { recordAnswer } from '@/lib/share/answers';
import { foldPerspectives, validateChatMessages } from '@/lib/mentors/perspective';
import { memoryFor, withMemory } from '@/lib/memory/notes';
import { MENTOR_IDS } from '@/types';
import type { ChatStreamEvent, Message, MentorId } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

// -----------------------------------------------------------
// Validation
// -----------------------------------------------------------

function validateRequest(body: unknown):
  | { ok: true; data: { mentorId: MentorId; messages: Message[] } }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Geçersiz istek gövdesi' };
  }
  const b = body as Record<string, unknown>;

  const mentorId = b['mentorId'];
  if (typeof mentorId !== 'string' || !MENTOR_IDS.includes(mentorId as MentorId)) {
    return { ok: false, error: 'Geçersiz mentorId' };
  }

  // Yalnızca modele gidecek son pencere doğrulanır; son mesaj kullanıcıdan olmalı.
  const checked = validateChatMessages(b['messages'], 'user');
  if (!checked.ok) return checked;
  return { ok: true, data: { mentorId: mentorId as MentorId, messages: checked.messages } };
}

// -----------------------------------------------------------
// Route Handler
// -----------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const auth = await authorizeMentorRequest(request, 'chat');
  if ('response' in auth) return auth.response;
  const { user } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, 'INVALID_REQUEST', 'Geçersiz JSON');
  }
  const validation = validateRequest(body);
  if (!validation.ok) return apiError(400, 'INVALID_REQUEST', validation.error);
  const { mentorId, messages } = validation.data;
  const [perks, early, memory] = await Promise.all([getPerks(user.username), getEarlyMentors(), memoryFor(user.username)]);
  if (!canUseMentor(mentorId, perks, early)) {
    return apiError(403, 'MENTOR_NOT_ALLOWED', 'Bu mentor şimdilik yalnızca erken erişimi olan üyelere açık.');
  }

  // Son kullanıcı mesajı için moderation — kota düşülmeden önce
  const typed = messages[messages.length - 1]!.content;
  const moderation = moderateInput(typed);
  if (!moderation.allowed) {
    await recordEvent('crisis');
    const event: ChatStreamEvent = { type: 'crisis', message: CRISIS_RESPONSE[moderation.reason] };
    return singleEventResponse(event);
  }

  const reservation = await reserveQuestion(user);
  if (!reservation) {
    return apiError(429, 'QUOTA_EXCEEDED', 'Bugünkü soru hakkın doldu. Yarın yeniden görüşmek üzere.');
  }

  const abortController = new AbortController();
  request.signal.addEventListener('abort', () => abortController.abort());

  // "Başka bir bakış" mesajları asıl mentor için kullanıcı mesajlarına not olarak katlanır.
  const folded = foldPerspectives(messages);
  const userMessage = withMemory(folded[folded.length - 1]!.content, memory);

  // Sliding window (son user mesajı hariç, o zaten userMessage). Uzun sohbette
  // ilk soru ve ilk cevap korunur, aradakiler düşer.
  const past = folded.slice(0, -1);
  const limit = INPUT_LIMITS.MAX_CHAT_HISTORY_MESSAGES;
  const history = past.length <= limit ? past : [...past.slice(0, 2), ...past.slice(-(limit - 2))];

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: ChatStreamEvent): void => {
        try {
          controller.enqueue(encodeSSE(event));
        } catch {
          // Controller closed
        }
      };

      emit({ type: 'quota', remaining: reservation.remaining });

      let produced = false;
      let failed = false;
      let answer = '';
      try {
        for await (const chunk of streamMentorResponse({
          mentorId,
          userMessage,
          chatHistory: history,
          mode: 'chat',
          abortSignal: abortController.signal,
        })) {
          if (chunk.type === 'text_delta' && chunk.text) {
            produced = true;
            answer += chunk.text;
            emit({ type: 'delta', text: chunk.text });
          } else if (chunk.type === 'error') {
            console.error('[chat] mentor hatası:', chunk.error);
            await logError('server', `chat:${mentorId}`, chunk.error);
            failed = true;
            break;
          }
        }
      } catch (error) {
        console.error('[chat] beklenmeyen hata:', error);
        await logError('server', `chat:${mentorId}`, error);
        failed = true;
      }

      if (produced && !failed) {
        emit({ type: 'end' });
        await recordQuestion(user.username).catch(() => {});
        await recordEvent('chat');
        const earned = await awardBadges(user.username, { type: 'chat', mentorId, userMessages: messages.filter((m) => m.role === 'user').length });
        if (earned.length) emit({ type: 'badges', ids: earned });
        await recordAnswer(user.username, { mentorId, question: typed, text: answer });
      } else {
        await releaseQuestion(user, reservation).catch(() => {});
        emit({ type: 'quota', remaining: reservation.remaining + 1 });
        emit({ type: 'error', message: 'Mentor şu an cevap veremiyor. Hakkın iade edildi, biraz sonra tekrar dene.' });
      }

      try {
        controller.close();
      } catch {
        // Already closed
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
