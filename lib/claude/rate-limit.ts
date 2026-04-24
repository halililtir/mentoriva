import { getKV } from '@/lib/kv';

export type RateLimitScope = 'respond' | 'chat';
export interface RateLimitResult { allowed: boolean; message: string; remaining: number; }

const LIMITS = { respond: { max: 3, window: 60 }, chat: { max: 10, window: 60 } };
const DAILY_MAX = 15;

export async function checkRateLimit(ip: string, scope: RateLimitScope): Promise<RateLimitResult> {
  const kv = getKV();
  if (!kv) return { allowed: true, message: '', remaining: 999 };

  try {
    const cfg = LIMITS[scope];
    const minuteKey = `rl:${scope}:${ip}:${Math.floor(Date.now() / 1000 / cfg.window)}`;
    const dailyKey = `rl:daily:${ip}:${new Date().toISOString().slice(0, 10)}`;

    const [minuteCount, dailyCount] = await Promise.all([
      kv.incr(minuteKey),
      kv.incr(dailyKey),
    ]);

    // TTL ayarla (ilk kez oluşturulduysa)
    if (minuteCount === 1) await kv.expire(minuteKey, cfg.window);
    if (dailyCount === 1) await kv.expire(dailyKey, 86400);

    if (minuteCount > cfg.max) {
      return { allowed: false, message: 'Çok hızlı gidiyorsun. Biraz bekle.', remaining: 0 };
    }
    if (dailyCount > DAILY_MAX) {
      return { allowed: false, message: 'Bugün yeterince düşündün. Yarın devam et.', remaining: 0 };
    }

    return { allowed: true, message: '', remaining: DAILY_MAX - dailyCount };
  } catch {
    return { allowed: true, message: '', remaining: 999 };
  }
}
