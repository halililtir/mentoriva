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
import { isMockEnabled, mockStream } from './mock';
import { QuoteTagFilter } from '@/lib/mentors/quote-stream';
import { recordUsage, type CostFeature, type TokenUsage } from '@/lib/admin/cost';

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

/**
 * Modele göre örnekleme/düşünme ayarları. Sonnet 5.5 varsayılan dışı
 * temperature'ı 400 ile reddeder, düşünmeyi effort ile ayarlar; fallback
 * (Haiku 4.5) eski usul temperature ile çalışır.
 */
function modelParams(model: string, temperature: number) {
  return model === API.MODEL ? { output_config: { effort: API.EFFORT } } : { temperature };
}

/**
 * Sonnet 5.5'te düşünme max_tokens'a dahildir ve tokenizer aynı metni daha çok
 * token sayar; JSON üreten çağrılar yarıda kesilmesin diye ana modele pay verilir.
 */
function tokenBudget(model: string, maxTokens: number): number {
  return model === API.MODEL ? Math.ceil(maxTokens * 1.6) : maxTokens;
}

/** Model güvenlik gerekçesiyle cevap vermeyi reddetti; metin akmadıysa fallback denenir. */
class RefusalError extends Error {
  constructor() {
    super('Model bu isteğe cevap vermedi');
  }
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
  /** Maliyet raporunda hangi özelliğe yazılsın (varsayılan: mode'a göre answer/chat). */
  feature?: CostFeature;
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
  // Modelin seçtiği [[alinti:<id>]] etiketleri doğrulanmış alıntıyla değiştirilir;
  // model alıntı metnini kendisi üretmez (lib/mentors/quotes.ts).
  const filter = new QuoteTagFilter(params.mentorId);
  let fullText = '';
  let source: AsyncGenerator<StreamChunk, void, unknown>;
  try {
    source = rawMentorStream(params);
  } catch (e) {
    yield { type: 'error', error: e instanceof Error ? e.message : 'Yapay zekâ istemcisi kurulamadı' };
    return;
  }
  for await (const chunk of guard(source)) {
    if (chunk.type === 'text_delta' && chunk.text) {
      const text = filter.push(chunk.text);
      if (text) {
        fullText += text;
        yield { type: 'text_delta', text };
      }
    } else if (chunk.type === 'complete') {
      const rest = filter.flush();
      if (rest) {
        fullText += rest;
        yield { type: 'text_delta', text: rest };
      }
      yield { type: 'complete', fullText };
    } else {
      yield chunk;
    }
  }
}

/** Üreteç içinde fırlayan hataları (ör. eksik API anahtarı) hata parçasına çevirir. */
async function* guard(gen: AsyncGenerator<StreamChunk, void, unknown>): AsyncGenerator<StreamChunk, void, unknown> {
  try {
    yield* gen;
  } catch (e) {
    console.error('[Claude] akış başlatılamadı:', e instanceof Error ? e.message : 'bilinmeyen hata');
    yield { type: 'error', error: e instanceof Error ? e.message : 'Yapay zekâ isteği başarısız' };
  }
}

async function* rawMentorStream(
  params: StreamMentorResponseParams,
): AsyncGenerator<StreamChunk, void, unknown> {
  const { mentorId, userMessage, chatHistory, mode, abortSignal } = params;
  const feature: CostFeature = params.feature ?? (mode === 'chat' ? 'chat' : 'answer');

  if (isMockEnabled()) {
    yield* mockStream(mentorId, abortSignal);
    return;
  }

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
    // Hangi modeli kullanacağız? İlk denemede ana, retry'da fallback.
    const modelToUse = attempt === 0 ? API.MODEL : API.FALLBACK_MODEL;
    // Bu denemenin token kullanımı (yarıda kesilse de faturalanır, o yüzden her durumda yazılır)
    const usage: TokenUsage = {};
    try {

      const stream = client.messages.stream(
        {
          model: modelToUse,
          max_tokens: maxTokens,
          ...modelParams(modelToUse, API.TEMPERATURE),
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

        if (event.type === 'message_start') {
          Object.assign(usage, event.message.usage);
        } else if (event.type === 'message_delta') {
          usage.output_tokens = event.usage.output_tokens;
          if (event.delta.stop_reason === 'refusal' && fullText.length === 0) throw new RefusalError();
        } else if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const text = event.delta.text;
          fullText += text;
          yield { type: 'text_delta', text };
        }
      }

      await recordUsage(feature, modelToUse, usage);
      yield { type: 'complete', fullText };
      return;
    } catch (error) {
      await recordUsage(feature, modelToUse, usage);
      attempt += 1;
      // Client'a metin akmaya başladıysa retry yapma: fallback model baştan
      // yazacağı için kullanıcı aynı cevabın iki farklı başlangıcını görürdü.
      const isLastAttempt = attempt >= maxAttempts || fullText.length > 0;
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

// -----------------------------------------------------------
// Tek seferlik (akışsız) çağrı — yapılandırılmış JSON üreten özellikler için
// -----------------------------------------------------------

export interface CompleteParams {
  system: string;
  user: string;
  maxTokens: number;
  temperature?: number;
  /** MENTORIVA_MOCK_AI açıkken API yerine dönecek metin. */
  mock: () => string;
  /** Maliyet raporundaki özellik. */
  feature?: CostFeature;
}

/**
 * Tek mesajlık istek atar, metni döner. Ana model hata verirse bir kez
 * fallback modeli dener. Hata mesajları kullanıcı metnini içermez.
 */
export async function completeText({ system, user, maxTokens, temperature = 0.6, mock, feature = 'other' }: CompleteParams): Promise<string> {
  if (isMockEnabled()) {
    await new Promise((r) => setTimeout(r, 900));
    return mock();
  }
  const client = getClient();
  let lastError: unknown;
  for (const model of [API.MODEL, API.FALLBACK_MODEL]) {
    try {
      const res = await client.messages.create({
        model,
        max_tokens: tokenBudget(model, maxTokens),
        ...modelParams(model, temperature),
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: user }],
      });
      await recordUsage(feature, model, res.usage);
      if (res.stop_reason === 'refusal') throw new RefusalError();
      return res.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
    } catch (e) {
      lastError = e;
      console.error(`[Claude] completeText ${model} başarısız:`, e instanceof Error ? e.message : 'bilinmeyen hata');
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Yapay zekâ isteği başarısız');
}
