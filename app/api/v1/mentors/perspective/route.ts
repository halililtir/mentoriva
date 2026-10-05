/**
 * POST /api/v1/mentors/perspective
 *
 * Sohbete "Başka bir bakış ekle": konuk mentor o ana kadarki sohbeti okur ve
 * kendi bakışını tek mesajla ekler. 1 hak kullanır; cevap üretilemezse iade.
 *
 * Request:  { mentorId: <konuk>, hostMentorId: <sohbetin mentoru>, messages: [...] }
 *           (son mesaj mentordan olmalı; konuk mesajları `guest` işaretli)
 * Response: SSE — quota, delta…, end | error (ChatStreamEvent)
 *
 * Yeni kullanıcı metni yoktur; sohbetteki kullanıcı mesajları gönderildikleri
 * anda moderasyondan geçmiştir.
 */

import { streamMentorResponse } from '@/lib/claude/client';
import { recordEvent } from '@/lib/admin/metrics';
import { logError } from '@/lib/admin/errors';
import { getPerks } from '@/lib/badges';
import { canUseMentor } from '@/lib/mentors/access';
import { getEarlyMentors } from '@/lib/mentors/access-server';
import { perspectiveMessage, validateChatMessages } from '@/lib/mentors/perspective';
import { apiError, authorizeMentorRequest, encodeSSE, sseHeaders } from '@/lib/sse';
import { recordQuestion, releaseQuestion, reserveQuestion } from '@/lib/auth/users';
import { recordAnswer } from '@/lib/share/answers';
import { MENTOR_IDS } from '@/types';
import type { ChatStreamEvent, MentorId } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const isMentor = (v: unknown): v is MentorId => typeof v === 'string' && MENTOR_IDS.includes(v as MentorId);

export async function POST(request: Request): Promise<Response> {
  const auth = await authorizeMentorRequest(request, 'chat');
  if ('response' in auth) return auth.response;
  const { user } = auth;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError(400, 'INVALID_REQUEST', 'Geçersiz JSON');
  }
  const guestId = body['mentorId'];
  const hostId = body['hostMentorId'];
  if (!isMentor(guestId) || !isMentor(hostId)) return apiError(400, 'INVALID_REQUEST', 'Geçersiz mentor');
  if (guestId === hostId) return apiError(400, 'INVALID_REQUEST', 'Başka bir mentor seç');

  const checked = validateChatMessages(body['messages'], 'assistant');
  if (!checked.ok) return apiError(400, 'INVALID_REQUEST', checked.error);
  const messages = checked.messages;

  const [perks, early] = await Promise.all([getPerks(user.username), getEarlyMentors()]);
  if (!canUseMentor(guestId, perks, early)) {
    return apiError(403, 'MENTOR_NOT_ALLOWED', 'Bu mentor şimdilik yalnızca erken erişimi olan üyelere açık.');
  }

  const reservation = await reserveQuestion(user);
  if (!reservation) {
    return apiError(429, 'QUOTA_EXCEEDED', 'Bugünkü soru hakkın doldu. Yarın yeniden görüşmek üzere.');
  }

  const abortController = new AbortController();
  request.signal.addEventListener('abort', () => abortController.abort());
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

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
          mentorId: guestId,
          userMessage: perspectiveMessage(hostId, guestId, messages),
          chatHistory: [],
          mode: 'initial',
          feature: 'perspective',
          abortSignal: abortController.signal,
        })) {
          if (chunk.type === 'text_delta' && chunk.text) {
            produced = true;
            answer += chunk.text;
            emit({ type: 'delta', text: chunk.text });
          } else if (chunk.type === 'error') {
            await logError('server', `perspective:${guestId}`, chunk.error);
            failed = true;
            break;
          }
        }
      } catch (error) {
        await logError('server', `perspective:${guestId}`, error);
        failed = true;
      }

      if (produced && !failed) {
        emit({ type: 'end' });
        await recordQuestion(user.username).catch(() => {});
        await recordEvent('perspective');
        if (lastUser) await recordAnswer(user.username, { mentorId: guestId, question: lastUser, text: answer });
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
