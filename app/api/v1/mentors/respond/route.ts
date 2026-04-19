/**
 * POST /api/v1/mentors/respond
 *
 * 4 mentora paralel çağrı yapar, cevapları SSE (Server-Sent Events) ile
 * streaming olarak döner.
 *
 * Event formatı (StreamEvent, types/index.ts):
 *   data: {"type":"start","mentorId":"jung"}
 *   data: {"type":"delta","mentorId":"jung","text":"Bu "}
 *   data: {"type":"delta","mentorId":"jung","text":"soru "}
 *   data: {"type":"end","mentorId":"jung"}
 *   data: {"type":"error","mentorId":"nietzsche","message":"timeout"}
 *
 * Özel event'ler:
 *   - crisis: moderation kriz tespit ettiğinde (mentor çağrısı yapılmaz)
 *   - rate_limit: kullanıcı limiti aştığında
 */

import { NextResponse } from 'next/server';
import { streamMentorResponse } from '@/lib/claude/client';
import { checkRateLimit, getClientIp } from '@/lib/claude/rate-limit';
import { INPUT_LIMITS } from '@/lib/features';
import { moderateInput } from '@/lib/safety/moderation';
import { MENTOR_IDS } from '@/types';
import type { MentorId, RespondRequest, StreamEvent } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel hobby tier için 60sn

// -----------------------------------------------------------
// Request validation
// -----------------------------------------------------------

function validateRequest(body: unknown):
  | { ok: true; data: Required<Pick<RespondRequest, 'question'>> & { mentorIds: MentorId[] } }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Geçersiz istek gövdesi' };
  }
  const b = body as Record<string, unknown>;
  const question = typeof b['question'] === 'string' ? b['question'].trim() : '';

  if (question.length < INPUT_LIMITS.MIN_QUESTION_LENGTH) {
    return {
      ok: false,
      error: `Soru en az ${INPUT_LIMITS.MIN_QUESTION_LENGTH} karakter olmalı`,
    };
  }
  if (question.length > INPUT_LIMITS.MAX_QUESTION_LENGTH) {
    return {
      ok: false,
      error: `Soru en fazla ${INPUT_LIMITS.MAX_QUESTION_LENGTH} karakter olabilir`,
    };
  }

  // Hangi mentorlere soralım? Default: hepsi.
  const requestedIds = Array.isArray(b['mentorIds']) ? b['mentorIds'] : null;
  const mentorIds: MentorId[] = requestedIds
    ? (requestedIds.filter((id): id is MentorId =>
        MENTOR_IDS.includes(id as MentorId),
      ))
    : [...MENTOR_IDS];

  if (mentorIds.length === 0) {
    return { ok: false, error: 'En az bir mentor seçilmeli' };
  }

  return { ok: true, data: { question, mentorIds } };
}

// -----------------------------------------------------------
// SSE formatting
// -----------------------------------------------------------

function formatSSE(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// -----------------------------------------------------------
// Route Handler
// -----------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  // 1. Rate limit kontrolü
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(ip, 'respond');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: rateLimit.message,
        },
      },
      { status: 429 },
    );
  }

  // 2. Request parsing & validation
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'Geçersiz JSON' } },
      { status: 400 },
    );
  }

  const validation = validateRequest(body);
  if (!validation.ok) {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: validation.error } },
      { status: 400 },
    );
  }

  const { question, mentorIds } = validation.data;

  // 3. Moderation
  const moderation = moderateInput(question);
  if (!moderation.allowed) {
    // Kriz durumunda özel SSE event ile dön — client helpline gösterecek
    const event: StreamEvent = {
      type: 'crisis',
      message:
        moderation.reason === 'crisis'
          ? 'Bu konu, mentorların felsefi perspektiflerinin ötesinde bir destek gerektirebilir. Lütfen profesyonel bir uzmana danışmayı düşün.'
          : 'Bu istek mentorların cevaplayabileceği bir konu değil.',
    };

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(formatSSE(event)));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: sseHeaders(),
    });
  }

  // 4. 4 mentora paralel streaming
  const encoder = new TextEncoder();
  const abortController = new AbortController();

  // Client disconnect olursa upstream request'leri iptal et
  request.signal.addEventListener('abort', () => abortController.abort());

  const stream = new ReadableStream({
    async start(controller) {
      // Her mentor için ayrı async task — paralel çalışacak
      const tasks = mentorIds.map((mentorId) =>
        runMentor(mentorId, question, abortController.signal, (event) => {
          try {
            controller.enqueue(encoder.encode(formatSSE(event)));
          } catch {
            // Controller closed — client disconnected
          }
        }),
      );

      // Hepsi bitince stream'i kapat
      await Promise.allSettled(tasks);
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

  return new Response(stream, {
    headers: sseHeaders(),
  });
}

// -----------------------------------------------------------
// Tek mentor task'ı
// -----------------------------------------------------------

async function runMentor(
  mentorId: MentorId,
  question: string,
  signal: AbortSignal,
  emit: (event: StreamEvent) => void,
): Promise<void> {
  emit({ type: 'start', mentorId });

  try {
    for await (const chunk of streamMentorResponse({
      mentorId,
      userMessage: question,
      mode: 'initial',
      abortSignal: signal,
    })) {
      if (chunk.type === 'text_delta' && chunk.text) {
        emit({ type: 'delta', mentorId, text: chunk.text });
      } else if (chunk.type === 'error') {
        emit({
          type: 'error',
          mentorId,
          message: chunk.error ?? 'Bilinmeyen hata',
        });
        return;
      }
    }
    emit({ type: 'end', mentorId });
  } catch (error) {
    emit({
      type: 'error',
      mentorId,
      message: error instanceof Error ? error.message : 'Bilinmeyen hata',
    });
  }
}

// -----------------------------------------------------------
// SSE Headers
// -----------------------------------------------------------

function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Vercel/Nginx buffering'i kapat
  };
}
