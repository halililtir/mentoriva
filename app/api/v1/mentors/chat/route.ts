/**
 * POST /api/v1/mentors/chat
 *
 * Seçilen tek mentor ile devam eden sohbet. Streaming ile cevap döner.
 *
 * Request:
 *   { mentorId: "jung", messages: [...], initialQuestion?: "..." }
 *
 * Response: SSE stream
 *   data: {"type":"delta","text":"..."}
 *   data: {"type":"end"}
 */

import { NextResponse } from 'next/server';
import { getKV } from '@/lib/kv';
import { streamMentorResponse } from '@/lib/claude/client';
import { checkRateLimit, getClientIp } from '@/lib/claude/rate-limit';
import { INPUT_LIMITS } from '@/lib/features';
import { moderateInput } from '@/lib/safety/moderation';
import { MENTOR_IDS } from '@/types';
import type { Message, MentorId } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

// -----------------------------------------------------------
// Chat-specific stream event tipi
// (Chat'te tek mentor olduğu için mentorId redundant)
// -----------------------------------------------------------

type ChatStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'end' }
  | { type: 'error'; message: string }
  | { type: 'crisis'; message: string };

// -----------------------------------------------------------
// Validation
// -----------------------------------------------------------

function validateRequest(body: unknown):
  | {
      ok: true;
      data: {
        mentorId: MentorId;
        messages: Message[];
        initialQuestion?: string;
      };
    }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Geçersiz istek gövdesi' };
  }
  const b = body as Record<string, unknown>;

  const mentorId = b['mentorId'];
  if (
    typeof mentorId !== 'string' ||
    !MENTOR_IDS.includes(mentorId as MentorId)
  ) {
    return { ok: false, error: 'Geçersiz mentorId' };
  }

  if (!Array.isArray(b['messages']) || b['messages'].length === 0) {
    return { ok: false, error: 'messages boş olamaz' };
  }

  // Mesajları temizle & validate
  const messages: Message[] = [];
  for (const m of b['messages']) {
    if (
      !m ||
      typeof m !== 'object' ||
      !('role' in m) ||
      !('content' in m) ||
      (m.role !== 'user' && m.role !== 'assistant') ||
      typeof m.content !== 'string'
    ) {
      return { ok: false, error: 'Geçersiz mesaj formatı' };
    }
    if (m.content.length > INPUT_LIMITS.MAX_CHAT_MESSAGE_LENGTH) {
      return {
        ok: false,
        error: `Mesaj en fazla ${INPUT_LIMITS.MAX_CHAT_MESSAGE_LENGTH} karakter olabilir`,
      };
    }
    messages.push({ role: m.role, content: m.content });
  }

  // Son mesaj user olmalı (Claude bu şart)
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== 'user') {
    return { ok: false, error: 'Son mesaj kullanıcıdan olmalı' };
  }

  const initialQuestion =
    typeof b['initialQuestion'] === 'string'
      ? b['initialQuestion']
      : undefined;

  const result: {
    mentorId: MentorId;
    messages: Message[];
    initialQuestion?: string;
  } = { mentorId: mentorId as MentorId, messages };

  if (initialQuestion !== undefined) {
    result.initialQuestion = initialQuestion;
  }

  return { ok: true, data: result };
}

// -----------------------------------------------------------
// SSE Helper
// -----------------------------------------------------------

function formatSSE(event: ChatStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  };
}

// -----------------------------------------------------------
// Route Handler
// -----------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  // Rate limit
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(ip, 'chat');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: rateLimit.message || 'Bugün yeterince düşündün. Yarın devam et.',
        },
      },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  // Kullanıcı kota kontrolü (beta)
  const username = request.headers.get('x-mentoriva-user');
  if (username) {
    try {
      const redis = getKV();
      if (redis) {
        const raw = await redis.get(`user:${username}`);
        if (raw) {
          const user = typeof raw === 'string' ? JSON.parse(raw) : raw as Record<string, number>;
          if (user.questionsUsed >= user.questionLimit) {
            return NextResponse.json(
              { error: { code: 'QUOTA_EXCEEDED', message: 'Soru limitine ulaştın.' } },
              { status: 429 },
            );
          }
        }
      }
    } catch {}
  }

  // Validation
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

  const { mentorId, messages } = validation.data;

  // Son kullanıcı mesajı için moderation
  const lastUserMessage = messages[messages.length - 1];
  if (lastUserMessage) {
    const moderation = moderateInput(lastUserMessage.content);
    if (!moderation.allowed) {
      const event: ChatStreamEvent = {
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
      return new Response(stream, { headers: sseHeaders() });
    }
  }

  // Streaming cevap
  const encoder = new TextEncoder();
  const abortController = new AbortController();
  request.signal.addEventListener('abort', () => abortController.abort());

  // Sliding window: son N mesajı al (son user mesajı hariç, o zaten userMessage)
  const history = messages.slice(-INPUT_LIMITS.MAX_CHAT_HISTORY_MESSAGES, -1);
  const userMessage = messages[messages.length - 1]!.content;

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: ChatStreamEvent): void => {
        try {
          controller.enqueue(encoder.encode(formatSSE(event)));
        } catch {
          // Controller closed
        }
      };

      try {
        for await (const chunk of streamMentorResponse({
          mentorId,
          userMessage,
          chatHistory: history,
          mode: 'chat',
          abortSignal: abortController.signal,
        })) {
          if (chunk.type === 'text_delta' && chunk.text) {
            emit({ type: 'delta', text: chunk.text });
          } else if (chunk.type === 'error') {
            emit({
              type: 'error',
              message: chunk.error ?? 'Bilinmeyen hata',
            });
            break;
          }
        }
        emit({ type: 'end' });
      } catch (error) {
        emit({
          type: 'error',
          message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        });
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
