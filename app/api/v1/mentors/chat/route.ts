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
import { apiError, authorizeMentorRequest, encodeSSE, singleEventResponse, sseHeaders } from '@/lib/sse';
import { recordQuestion, releaseQuestion, reserveQuestion } from '@/lib/auth/users';
import { recordAnswer } from '@/lib/share/answers';
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

  if (!Array.isArray(b['messages']) || b['messages'].length === 0) {
    return { ok: false, error: 'messages boş olamaz' };
  }

  // Yalnızca modele gidecek son pencere doğrulanır; çok eski mesajlar atılır.
  const raw = b['messages'].slice(-INPUT_LIMITS.MAX_CHAT_REQUEST_MESSAGES);
  const messages: Message[] = [];
  for (const m of raw) {
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
    messages.push({ role: m.role, content: m.content });
  }

  // Son mesaj user olmalı (Claude bu şart)
  if (messages[messages.length - 1]?.role !== 'user') {
    return { ok: false, error: 'Son mesaj kullanıcıdan olmalı' };
  }

  return { ok: true, data: { mentorId: mentorId as MentorId, messages } };
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

  // Son kullanıcı mesajı için moderation — kota düşülmeden önce
  const userMessage = messages[messages.length - 1]!.content;
  const moderation = moderateInput(userMessage);
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

  // Sliding window: son N mesajı al (son user mesajı hariç, o zaten userMessage)
  const history = messages.slice(-INPUT_LIMITS.MAX_CHAT_HISTORY_MESSAGES, -1);

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
            failed = true;
            break;
          }
        }
      } catch (error) {
        console.error('[chat] beklenmeyen hata:', error);
        failed = true;
      }

      if (produced && !failed) {
        emit({ type: 'end' });
        await recordQuestion(user.username).catch(() => {});
        await recordEvent('chat');
        await recordAnswer(user.username, { mentorId, question: userMessage, text: answer });
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
