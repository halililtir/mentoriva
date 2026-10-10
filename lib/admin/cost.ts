/**
 * Yapay zekâ kullanımı ve tahmini maliyet.
 *
 * Her Anthropic çağrısının token kullanımı (client.ts) buraya yazılır:
 *   stats:cost:<gün>:<özellik>     mikro-dolar (1 USD = 1_000_000), INCRBY
 *   stats:calls:<gün>:<özellik>    çağrı sayısı
 *   stats:tokens:<gün>:<tür>       in | out | cache_write | cache_read
 * 120 gün TTL. Fiyatlar tahminidir; Anthropic fiyat değiştirirse PRICES güncellenir.
 */

import { getKV, getMany } from '@/lib/kv';
import { todayKey } from '@/lib/time';

/** USD / 1M token. https://www.anthropic.com/pricing */
export const PRICES: Record<string, { in: number; out: number; cacheWrite: number; cacheRead: number }> = {
  'claude-sonnet-5-5': { in: 2, out: 10, cacheWrite: 2.5, cacheRead: 0.2 },
  'claude-sonnet-4-6': { in: 3, out: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  'claude-haiku-4-5-20251001': { in: 1, out: 5, cacheWrite: 1.25, cacheRead: 0.1 },
};
/** Bilinmeyen model için temkinli varsayım (Sonnet fiyatı). */
const FALLBACK_PRICE = { in: 3, out: 15, cacheWrite: 3.75, cacheRead: 0.3 };

export const COST_FEATURES = {
  answer: 'Soru cevapları',
  chat: 'Sohbet',
  daily: 'Günün sorusu',
  journey: 'Kendine Yolculuk',
  synthesis: 'Ayrışma özeti',
  perspective: 'Başka bir bakış',
  recommend: 'Mentor önerisi',
  feelings: 'İçimde ne var?',
  prepare: 'Söyleyeceğimi hazırla',
  memory: 'Not önerisi',
  other: 'Diğer',
} as const;
export type CostFeature = keyof typeof COST_FEATURES;

export interface TokenUsage {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

const TTL = 60 * 60 * 24 * 120;
const n = (v: number | null | undefined) => (typeof v === 'number' && v > 0 ? v : 0);

/** Mikro-dolar cinsinden maliyet. */
export function costMicros(model: string, u: TokenUsage): number {
  const p = PRICES[model] ?? FALLBACK_PRICE;
  // fiyat USD/1M token → token başına mikro-dolar = fiyat
  return Math.round(n(u.input_tokens) * p.in + n(u.output_tokens) * p.out + n(u.cache_creation_input_tokens) * p.cacheWrite + n(u.cache_read_input_tokens) * p.cacheRead);
}

/** Hata fırlatmaz. */
export async function recordUsage(feature: CostFeature, model: string, usage: TokenUsage): Promise<void> {
  try {
    const kv = getKV();
    const day = todayKey();
    const bump = async (key: string, by: number) => {
      if (by <= 0) return;
      const v = await kv.incrby(key, by);
      if (v === by) await kv.expire(key, TTL);
    };
    await Promise.all([
      bump(`stats:cost:${day}:${feature}`, costMicros(model, usage)),
      bump(`stats:calls:${day}:${feature}`, 1),
      bump(`stats:tokens:${day}:in`, n(usage.input_tokens)),
      bump(`stats:tokens:${day}:out`, n(usage.output_tokens)),
      bump(`stats:tokens:${day}:cache_write`, n(usage.cache_creation_input_tokens)),
      bump(`stats:tokens:${day}:cache_read`, n(usage.cache_read_input_tokens)),
    ]);
  } catch (e) {
    console.error('[cost] yazılamadı:', e instanceof Error ? e.message : e);
  }
}

export interface CostSummary {
  /** Gün gün toplam USD. */
  daily: number[];
  /** Seçilen aralıkta özellik başına USD ve çağrı sayısı. */
  features: Array<{ id: CostFeature; label: string; usd: number; calls: number }>;
  tokens: { in: number; out: number; cache_write: number; cache_read: number };
  totalUsd: number;
}

export async function costSummary(dates: string[]): Promise<CostSummary> {
  const feats = Object.keys(COST_FEATURES) as CostFeature[];
  const kinds = ['in', 'out', 'cache_write', 'cache_read'] as const;
  const [cost, calls, tokens] = await Promise.all([
    getMany<number | string>(feats.flatMap((f) => dates.map((d) => `stats:cost:${d}:${f}`))),
    getMany<number | string>(feats.flatMap((f) => dates.map((d) => `stats:calls:${d}:${f}`))),
    getMany<number | string>(kinds.flatMap((k) => dates.map((d) => `stats:tokens:${d}:${k}`))),
  ]);
  const at = (arr: (number | string | null)[], i: number) => Number(arr[i]) || 0;

  const daily = dates.map((_, di) => feats.reduce((s, _f, fi) => s + at(cost, fi * dates.length + di), 0) / 1_000_000);
  const features = feats
    .map((id, fi) => ({
      id,
      label: COST_FEATURES[id],
      usd: dates.reduce((s, _, di) => s + at(cost, fi * dates.length + di), 0) / 1_000_000,
      calls: dates.reduce((s, _, di) => s + at(calls, fi * dates.length + di), 0),
    }))
    .sort((a, b) => b.usd - a.usd);
  const tok = Object.fromEntries(kinds.map((k, ki) => [k, dates.reduce((s, _, di) => s + at(tokens, ki * dates.length + di), 0)])) as CostSummary['tokens'];

  return { daily, features, tokens: tok, totalUsd: daily.reduce((a, b) => a + b, 0) };
}
