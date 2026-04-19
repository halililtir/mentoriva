/**
 * Claude API Client — Anthropic SDK wrapper.
 *
 * Sorumluluklar:
 * - SDK singleton yönetimi
 * - Prompt caching ile maliyet optimizasyonu
 * - Streaming (SSE için kullanılacak ham chunk üretir)
 * - Timeout + retry
 * - Fallback model desteği
 *
 * Bu modül API route'ları için bir "yardımcı"dır; iş mantığı değil.
 */

import Anthropic from '@anthropic-ai/sdk';
import { API, FEATURES } from '@/lib/features';
import type { MentorId, Message } from '@/types';
import { buildMentorRequest } from '@/lib/mentors/prompts';

// -----------------------------------------------------------
// SDK Singleton
// -----------------------------------------------------------

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;

  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY ortam değişkeni tanımlı değil. .env.local veya Vercel env vars kontrol et.',
    );
  }

  _client = new Anthropic({
    apiKey,
    // SDK default timeout 10 dakika; biz daha sıkı tutuyoruz
    timeout: API.REQUEST_TIMEOUT_MS,
    maxRetries: 0, // retry'ı kendimiz yönetiyoruz
  });
  return _client;
}

// -----------------------------------------------------------
// Tipler
// -----------------------------------------------------------

export interface StreamMentorResponseParams {
  mentorId: MentorId;
  userMessage: string;
  chatHistory?: Message[];
  mode: 'initial' | 'chat';
  abortSignal?: AbortSignal;
}

export interface StreamChunk {
  type: 'text_delta' | 'complete' | 'error';
  /** text_delta için: yeni gelen metin parçası. */
  text?: string;
  /** complete için: toplam cevap (finalize). */
  fullText?: string;
  /** error için: hata mesajı. */
  error?: string;
}

// -----------------------------------------------------------
// Ana Streaming Fonksiyonu
// -----------------------------------------------------------

/**
 * Bir mentor için Claude API'ye streaming istek atar ve async generator döner.
 *
 * Kullanım:
 * ```ts
 * for await (const chunk of streamMentorResponse({ mentorId: 'jung', ... })) {
 *   if (chunk.type === 'text_delta') sendToClient(chunk.text);
 * }
 * ```
 */
export async function* streamMentorResponse(
  params: StreamMentorResponseParams,
): AsyncGenerator<StreamChunk, void, unknown> {
  const { mentorId, userMessage, chatHistory, mode, abortSignal } = params;
  const client = getClient();

  const { system, messages } = buildMentorRequest({
    mentorId,
    userMessage,
    chatHistory: chatHistory ?? [],
    mode,
  });

  const maxTokens =
    mode === 'initial' ? API.MAX_TOKENS_INITIAL : API.MAX_TOKENS_CHAT;

  // Prompt caching: system prompt'u cache'le.
  // Her mentor için sabit system prompt → %90 input token tasarrufu.
  // https://docs.claude.com/en/docs/build-with-claude/prompt-caching
  const systemParam = FEATURES.PROMPT_CACHING_ENABLED
    ? [
        {
          type: 'text' as const,
          text: system,
          cache_control: { type: 'ephemeral' as const },
        },
      ]
    : system;

  let fullText = '';
  let attempt = 0;
  const maxAttempts = API.MAX_RETRIES + 1;

  while (attempt < maxAttempts) {
    try {
      // Hangi modeli kullanacağız? İlk denemede ana, retry'da fallback.
      const modelToUse = attempt === 0 ? API.MODEL : API.FALLBACK_MODEL;

      const stream = client.messages.stream(
        {
          model: modelToUse,
          max_tokens: maxTokens,
          temperature: API.TEMPERATURE,
          system: systemParam,
          messages,
        },
        {
          signal: abortSignal,
        },
      );

      // SDK stream eventlerini bizim chunk formatımıza çevir
      for await (const event of stream) {
        if (abortSignal?.aborted) {
          yield { type: 'error', error: 'İstek iptal edildi' };
          return;
        }

        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const text = event.delta.text;
          fullText += text;
          yield { type: 'text_delta', text };
        }
      }

      yield { type: 'complete', fullText };
      return;
    } catch (error) {
      attempt += 1;
      const isLastAttempt = attempt >= maxAttempts;
      const errorMessage =
        error instanceof Error ? error.message : 'Bilinmeyen hata';

      // Log the error (production'da proper logging'e geçilecek)
      console.error(
        `[Claude] ${mentorId} denemesi ${attempt}/${maxAttempts} başarısız:`,
        errorMessage,
      );

      if (isLastAttempt) {
        yield {
          type: 'error',
          error: errorMessage,
        };
        return;
      }

      // Exponential backoff: 500ms, 1000ms, 2000ms...
      const backoffMs = 500 * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}
