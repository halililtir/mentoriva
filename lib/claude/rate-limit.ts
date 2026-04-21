/**
 * Rate Limiting — dakika bazlı + günlük limit.
 *
 * Strateji:
 * 1. Dakika limiti: spam'i önler (3 respond/dk, 10 chat/dk)
 * 2. Günlük limit: maliyeti kontrol eder (15 API çağrısı/gün/IP)
 *
 * Günlük limit = en kritik koruma. 15 çağrı/gün × $0.006 = $0.09/gün/kullanıcı.
 * 100 kullanıcı × 30 gün = ~$27/ay — 10 dolarlık bakiye ile ~11 gün.
 *
 * KV yoksa (local dev) tüm limitler atlanır.
 */

import { FEATURES, RATE_LIMITS } from '@/lib/features';

export type RateLimitScope = 'respond' | 'chat';

export interface RateLimitResult {
  allowed: boolean;
  message: string;
  remaining: number;
}

async function getRateLimitKV() {
  const { getKV } = await import('@/lib/kv');
  return getKV();
}

const SCOPE_CONFIG: Record<RateLimitScope, { limit: number; windowSeconds: number }> = {
  respond: { limit: RATE_LIMITS.RESPOND_PER_MINUTE, windowSeconds: 60 },
  chat: { limit: RATE_LIMITS.CHAT_PER_MINUTE, windowSeconds: 60 },
};

const DAILY_MESSAGES = [
  'Bugün yeterince düşündün. Yarın devam et.',
  'Zihnin dinlenmeyi hak ediyor. Yarın yeni perspektiflerle gel.',
  'Düşünce meclisi bugünlük kapandı. Yarın tekrar buluşalım.',
];

/**
 * Dakika + günlük limit kontrolü.
 */
export async function checkRateLimit(
  ip: string,
  scope: RateLimitScope,
): Promise<RateLimitResult> {
  if (!FEATURES.RATE_LIMITING_ENABLED) {
    return { allowed: true, message: '', remaining: 999 };
  }

  if (!process.env['KV_REST_API_URL']) {
    return { allowed: true, message: '', remaining: 999 };
  }

  const kv = await getRateLimitKV();
  if (!kv) return { allowed: true, message: '', remaining: 999 };

  try {
    // 1. Günlük limit kontrolü (en önemli)
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const dailyKey = `daily:${ip}:${today}`;
    const dailyCount = await kv.incr(dailyKey);

    // İlk çağrıda TTL set et (gece yarısında sıfırlansın)
    if (dailyCount === 1) {
      await kv.expire(dailyKey, 86400); // 24 saat
    }

    if (dailyCount > RATE_LIMITS.DAILY_LIMIT) {
      const msg = DAILY_MESSAGES[Math.floor(Math.random() * DAILY_MESSAGES.length)] ?? DAILY_MESSAGES[0]!;
      return {
        allowed: false,
        message: msg,
        remaining: 0,
      };
    }

    // 2. Dakika limiti kontrolü
    const config = SCOPE_CONFIG[scope];
    const now = Math.floor(Date.now() / 1000);
    const windowKey = Math.floor(now / config.windowSeconds);
    const minuteKey = `rl:${scope}:${ip}:${windowKey}`;

    const minuteCount = await kv.incr(minuteKey);
    if (minuteCount === 1) {
      await kv.expire(minuteKey, config.windowSeconds);
    }

    if (minuteCount > config.limit) {
      return {
        allowed: false,
        message: 'Biraz yavaşla. Birkaç saniye sonra tekrar dene.',
        remaining: RATE_LIMITS.DAILY_LIMIT - dailyCount,
      };
    }

    return {
      allowed: true,
      message: '',
      remaining: Math.max(0, RATE_LIMITS.DAILY_LIMIT - dailyCount),
    };
  } catch (error) {
    // KV hatası → fail open
    console.error('[RateLimit] KV hatası, geçiriliyor:', error);
    return { allowed: true, message: '', remaining: 999 };
  }
}

/**
 * Request'ten IP çıkar.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0];
    if (first) return first.trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}
