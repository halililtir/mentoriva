/**
 * KV Helper — Upstash Redis üzerinden key-value işlemleri.
 *
 * Tüm API route'ları bu modülü kullanır.
 * KV_REST_API_URL ve KV_REST_API_TOKEN env variable'ları gerekir.
 * Yoksa null döner (fallback: in-memory veya skip).
 */

import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

export function getKV(): Redis | null {
  if (redis) return redis;

  const url = process.env['KV_REST_API_URL'];
  const token = process.env['KV_REST_API_TOKEN'];

  if (!url || !token) return null;

  redis = new Redis({ url, token });
  return redis;
}
