/**
 * Sabit pencereli rate limit (Redis INCR + EXPIRE).
 *
 * Mentor route'larında anahtar kullanıcıdır; giriş, kayıt ve geri bildirim
 * gibi oturumsuz uçlarda IP ve/veya e-posta kullanılır.
 */

import { getKV } from '@/lib/kv';
import { RATE_LIMITS } from '@/lib/features';

export interface Limit {
  max: number;
  windowSec: number;
}

/** true → izin var. KV hatasında isteği engellemez (fail-open) ama loglar. */
export async function hit(bucket: string, id: string, limit: Limit): Promise<boolean> {
  const window = Math.floor(Date.now() / 1000 / limit.windowSec);
  const key = `rl:${bucket}:${id}:${window}`;
  try {
    const kv = getKV();
    const count = await kv.incr(key);
    if (count === 1) await kv.expire(key, limit.windowSec);
    return count <= limit.max;
  } catch (e) {
    console.error('[RateLimit]', bucket, e);
    return true;
  }
}

/** Birden fazla limiti sırayla uygular; biri doluysa false. */
export async function hitAll(checks: Array<[bucket: string, id: string, limit: Limit]>): Promise<boolean> {
  for (const [bucket, id, limit] of checks) {
    if (!(await hit(bucket, id, limit))) return false;
  }
  return true;
}

export { RATE_LIMITS };
