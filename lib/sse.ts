/**
 * SSE yardımcıları — mentor route'ları ortak kullanır.
 */

import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/http';
import { hitAll, type Limit, RATE_LIMITS } from '@/lib/rate-limit';
import { getSessionUser } from '@/lib/auth/session';
import type { StoredUser } from '@/lib/auth/users';

const encoder = new TextEncoder();

export function encodeSSE(event: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

export function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Vercel/Nginx buffering'i kapat
  };
}

/** Tek bir olay gönderip kapanan SSE yanıtı (kriz, moderasyon vb.). */
export function singleEventResponse(event: unknown): Response {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encodeSSE(event));
      controller.close();
    },
  });
  return new Response(stream, { headers: sseHeaders() });
}

export function apiError(status: number, code: string, message: string, headers?: HeadersInit) {
  return NextResponse.json({ error: { code, message } }, { status, headers });
}

/**
 * Oturum + rate limit kontrolü. Başarılıysa kullanıcıyı, değilse
 * hazır hata yanıtını döner.
 */
export async function authorizeMentorRequest(
  request: Request,
  scope: 'respond' | 'chat',
): Promise<{ user: StoredUser } | { response: Response }> {
  const user = await getSessionUser(request);
  if (!user) {
    return { response: apiError(401, 'UNAUTHORIZED', 'Devam etmek için giriş yapmalısın.') };
  }

  const userLimit: Limit = scope === 'respond' ? RATE_LIMITS.RESPOND_USER : RATE_LIMITS.CHAT_USER;
  const allowed = await hitAll([
    [`${scope}-user`, user.username, userLimit],
    ['mentor-ip', getClientIp(request), RATE_LIMITS.MENTOR_IP],
  ]);
  if (!allowed) {
    return {
      response: apiError(429, 'RATE_LIMITED', 'Çok hızlı gidiyorsun. Biraz bekleyip tekrar dene.', { 'Retry-After': '60' }),
    };
  }
  return { user };
}
