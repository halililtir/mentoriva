/**
 * POST /api/v1/mentors/respond
 *
 * Seçili mentorlara paralel çağrı yapar, cevapları SSE (Server-Sent Events)
 * ile streaming olarak döner.
 *
 * Event formatı (StreamEvent, types/index.ts):
 *   data: {"type":"quota","remaining":4}
 *   data: {"type":"start","mentorId":"jung"}
 *   data: {"type":"delta","mentorId":"jung","text":"Bu "}
 *   data: {"type":"end","mentorId":"jung"}
 *   data: {"type":"error","mentorId":"nietzsche","message":"timeout"}
 *   data: {"type":"crisis","message":"..."}   (moderation; mentor çağrısı yapılmaz)
 *
 * Akış: oturum → rate limit → doğrulama → moderasyon → kota ayır → stream.
 * Hiçbir mentor cevap üretemezse ayrılan kota iade edilir.
 */

import { getKV } from '@/lib/kv';
import { streamMentorResponse } from '@/lib/claude/client';
import { CRISIS_RESPONSE, INPUT_LIMITS } from '@/lib/features';
import { moderateInput } from '@/lib/safety/moderation';
import { recordEvent } from '@/lib/admin/metrics';
import { recordTopics } from '@/lib/admin/topics';
import { logError } from '@/lib/admin/errors';
import { awardBadges, getPerks } from '@/lib/badges';
import { checkMentorSelection } from '@/lib/mentors/access';
import { getEarlyMentors } from '@/lib/mentors/access-server';
import { apiError, authorizeMentorRequest, encodeSSE, singleEventResponse, sseHeaders } from '@/lib/sse';
import { recordQuestion, releaseQuestion, reserveQuestion } from '@/lib/auth/users';
import { todayKey } from '@/lib/time';
import { recordAnswer } from '@/lib/share/answers';
import { MENTOR_IDS } from '@/types';
import type { MentorId, StreamEvent } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel hobby tier için 60sn

// -----------------------------------------------------------
// Request validation
// -----------------------------------------------------------

function validateRequest(body: unknown):
  | { ok: true; data: { question: string; mentorIds: MentorId[] } }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Geçersiz istek gövdesi' };
  }
  const b = body as Record<string, unknown>;
  const question = typeof b['question'] === 'string' ? b['question'].trim() : '';

  if (question.length < INPUT_LIMITS.MIN_QUESTION_LENGTH) {
    return { ok: false, error: `Soru en az ${INPUT_LIMITS.MIN_QUESTION_LENGTH} karakter olmalı` };
  }
  if (question.length > INPUT_LIMITS.MAX_QUESTION_LENGTH) {
    return { ok: false, error: `Soru en fazla ${INPUT_LIMITS.MAX_QUESTION_LENGTH} karakter olabilir` };
  }

  // Hangi mentorlere soralım? Default: hepsi. Tekrarlar elenir.
  const requested = Array.isArray(b['mentorIds']) ? b['mentorIds'] : [...MENTOR_IDS];
  const mentorIds = [...new Set(requested)].filter((id): id is MentorId =>
    MENTOR_IDS.includes(id as MentorId),
  );

  if (mentorIds.length === 0) {
    return { ok: false, error: 'En az bir mentor seçilmeli' };
  }

  return { ok: true, data: { question, mentorIds } };
}

// -----------------------------------------------------------
// Route Handler
// -----------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  // 1. Oturum + rate limit
  const auth = await authorizeMentorRequest(request, 'respond');
  if ('response' in auth) return auth.response;
  const { user } = auth;

  // 2. Request parsing & validation
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, 'INVALID_REQUEST', 'Geçersiz JSON');
  }
  const validation = validateRequest(body);
  if (!validation.ok) return apiError(400, 'INVALID_REQUEST', validation.error);
  const { question, mentorIds } = validation.data;

  // Seçim sınırı ve erken erişim (arayüz de uygular; asıl denetim burada)
  const [perks, early] = await Promise.all([getPerks(user.username), getEarlyMentors()]);
  const selectionError = checkMentorSelection(mentorIds, perks, early);
  if (selectionError) return apiError(403, 'MENTOR_NOT_ALLOWED', selectionError);

  // 3. Moderation — kriz/zararlı içerikte kota düşülmez, analitiğe yazılmaz
  const moderation = moderateInput(question);
  if (!moderation.allowed) {
    await recordEvent('crisis');
    const event: StreamEvent = { type: 'crisis', message: CRISIS_RESPONSE[moderation.reason] };
    return singleEventResponse(event);
  }

  // 4. Kota ayır (bir soru = bir hak, kaç mentor seçildiğinden bağımsız)
  const reservation = await reserveQuestion(user);
  if (!reservation) {
    return apiError(429, 'QUOTA_EXCEEDED', 'Bugünkü soru hakkın doldu. Yarın yeniden görüşmek üzere.');
  }

  // Admin metrikleri (hata fırlatmaz; sunucusuz ortamda kesilmesin diye beklenir)
  await Promise.all([recordAnalytics(question, mentorIds), recordEvent('question'), recordTopics(question)]);

  // 5. Mentorlara paralel streaming
  const abortController = new AbortController();
  request.signal.addEventListener('abort', () => abortController.abort());

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: StreamEvent) => {
        try {
          controller.enqueue(encodeSSE(event));
        } catch {
          // Controller closed — client disconnected
        }
      };

      emit({ type: 'quota', remaining: reservation.remaining });

      const results = await Promise.allSettled(
        mentorIds.map((mentorId) => runMentor(mentorId, question, abortController.signal, emit)),
      );
      const completed = results.flatMap((r, i) => (r.status === 'fulfilled' && r.value !== null ? [{ mentorId: mentorIds[i]!, text: r.value }] : []));
      const anySucceeded = completed.length > 0;
      // Paylaşım kartı yalnızca gerçekten üretilmiş cevaplardan cümle basabilsin
      await Promise.all(completed.map((c) => recordAnswer(user.username, { mentorId: c.mentorId, question, text: c.text })));

      if (anySucceeded) {
        await recordQuestion(user.username).catch(() => {});
        const earned = await awardBadges(user.username, { type: 'answered', mentorIds: completed.map((c) => c.mentorId) });
        if (earned.length) emit({ type: 'badges', ids: earned });
      } else {
        await releaseQuestion(user, reservation).catch(() => {});
        emit({ type: 'quota', remaining: reservation.remaining + 1 });
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

// -----------------------------------------------------------
// Tek mentor task'ı — başarıyla bittiyse üretilen metni, yoksa null döner
// -----------------------------------------------------------

async function runMentor(
  mentorId: MentorId,
  question: string,
  signal: AbortSignal,
  emit: (event: StreamEvent) => void,
): Promise<string | null> {
  emit({ type: 'start', mentorId });

  try {
    let text = '';
    for await (const chunk of streamMentorResponse({
      mentorId,
      userMessage: question,
      mode: 'initial',
      abortSignal: signal,
    })) {
      if (chunk.type === 'text_delta' && chunk.text) {
        text += chunk.text;
        emit({ type: 'delta', mentorId, text: chunk.text });
      } else if (chunk.type === 'error') {
        await Promise.all([recordEvent('mentor_error'), logError('server', `respond:${mentorId}`, chunk.error)]);
        emit({ type: 'error', mentorId, message: publicError(chunk.error) });
        return null;
      }
    }
    emit({ type: 'end', mentorId });
    return text || null;
  } catch (error) {
    await Promise.all([recordEvent('mentor_error'), logError('server', `respond:${mentorId}`, error)]);
    emit({ type: 'error', mentorId, message: publicError(error instanceof Error ? error.message : undefined) });
    return null;
  }
}

/** Upstream hata detayları (API anahtarı, model adı vb.) kullanıcıya gösterilmez. */
function publicError(detail?: string): string {
  if (detail) console.error('[respond] mentor hatası:', detail);
  return 'Bu mentor şu an cevap veremiyor. Biraz sonra tekrar dene.';
}

// -----------------------------------------------------------
// Admin analitiği (en iyi çaba — hata akışı bozmaz)
// -----------------------------------------------------------

/**
 * Mentor sayaçları ve son sorular. Son sorular listesine kullanıcı bilgisi
 * YAZILMAZ: admin panelinde soru metni kimseyle eşleştirilmeden görünür.
 */
async function recordAnalytics(question: string, mentorIds: MentorId[]) {
  try {
    const kv = getKV();
    const today = todayKey();
    await Promise.all(
      mentorIds.flatMap((mid) => [
        kv.incr(`stats:mentor:${mid}`),
        kv.incr(`stats:mentor:${mid}:${today}`).then((n) => (n === 1 ? kv.expire(`stats:mentor:${mid}:${today}`, 60 * 60 * 24 * 120) : 0)),
      ]),
    );
    await kv.lpush(
      'stats:recent-questions',
      JSON.stringify({ q: question.slice(0, 200), mentors: mentorIds, at: new Date().toISOString() }),
    );
    await kv.ltrim('stats:recent-questions', 0, 99);
  } catch (e) {
    console.error('[respond] analitik yazılamadı:', e);
  }
}
