/**
 * KV — Upstash Redis bağlantısı.
 * Tüm projede tek giriş noktası.
 *
 * KV_REST_API_URL / KV_REST_API_TOKEN tanımlı değilse süreç içi bir bellek
 * deposuna düşer. Bu yalnızca yerel geliştirme ve testler içindir:
 * serverless ortamda her instance kendi belleğini tutar, veri kalıcı değildir.
 */

export interface KV {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  incrby(key: string, by: number): Promise<number>;
  decr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  lpush(key: string, ...values: string[]): Promise<number>;
  ltrim(key: string, start: number, stop: number): Promise<unknown>;
  lrange<T = string>(key: string, start: number, stop: number): Promise<T[]>;
  mget<T = unknown>(...keys: string[]): Promise<(T | null)[]>;
  scan(cursor: string | number, opts: { match: string; count?: number }): Promise<[string | number, string[]]>;
}

let instance: KV | null = null;

/**
 * Redis bağlantı bilgileri. Vercel'in Upstash entegrasyonu bunları iki farklı
 * isimle ekleyebiliyor: yeni bağlantılarda UPSTASH_REDIS_REST_*, eski Vercel KV
 * taşımalarında KV_REST_API_*. Yeni isim önceliklidir.
 */
export function kvCredentials(): { url: string; token: string; source: 'UPSTASH_REDIS_REST' | 'KV_REST_API' } | null {
  const up = { url: process.env['UPSTASH_REDIS_REST_URL'], token: process.env['UPSTASH_REDIS_REST_TOKEN'] };
  if (up.url && up.token) return { url: up.url, token: up.token, source: 'UPSTASH_REDIS_REST' };
  const kv = { url: process.env['KV_REST_API_URL'], token: process.env['KV_REST_API_TOKEN'] };
  if (kv.url && kv.token) return { url: kv.url, token: kv.token, source: 'KV_REST_API' };
  return null;
}

export function getKV(): KV {
  if (instance) return instance;

  const creds = kvCredentials();

  if (creds) {
    const { url, token } = creds;
    const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis');
    instance = new Redis({ url, token }) as unknown as KV;
  } else {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[KV] Redis bağlantı bilgisi yok — bellek deposu kullanılıyor, veri kalıcı DEĞİL.');
    }
    // Next.js her route'u ayrı paketler; modül değişkeni route başına ayrı
    // kopya olur. Verinin kendisi (Map) globalThis'te tutulur ki tüm route'lar
    // aynı veriyi görsün; metotlar her modül yüklenişinde yeniden kurulur,
    // böylece kod değişince (HMR) eski bir kopya yeni metotları kaçırmaz.
    instance = createMemoryKV(memoryStore());
  }
  return instance;
}

/**
 * Desene uyan tüm anahtarlar. KEYS yerine SCAN kullanır: Redis'i tek seferde
 * kilitlemez, anahtar sayısı büyüdükçe güvenle çalışır.
 */
export async function scanKeys(pattern: string, max = 10_000): Promise<string[]> {
  const kv = getKV();
  const found = new Set<string>();
  let cursor: string | number = 0;
  do {
    const [next, keys]: [string | number, string[]] = await kv.scan(cursor, { match: pattern, count: 500 });
    for (const k of keys) found.add(k);
    cursor = next;
  } while (String(cursor) !== '0' && found.size < max);
  return [...found];
}

/** Çok sayıda anahtarı tek istekte okur (100'lük parçalar hâlinde). */
export async function getMany<T>(keys: string[]): Promise<(T | null)[]> {
  const kv = getKV();
  const out: (T | null)[] = [];
  for (let i = 0; i < keys.length; i += 100) {
    const chunk = keys.slice(i, i + 100);
    if (chunk.length) out.push(...(await kv.mget<T>(...chunk)));
  }
  return out;
}

/** Yalnızca testler için: bellek deposunu sıfırlar. */
export function _resetKVForTesting(): void {
  memoryStore().clear();
  instance = createMemoryKV(memoryStore());
}

type MemoryStore = Map<string, { value: unknown; expiresAt: number | null }>;

function memoryStore(): MemoryStore {
  const g = globalThis as typeof globalThis & { __mentorivaMemoryStore?: MemoryStore };
  return (g.__mentorivaMemoryStore ??= new Map());
}

// -----------------------------------------------------------
// Bellek deposu (Upstash Redis'in kullandığımız alt kümesi)
// -----------------------------------------------------------

function createMemoryKV(store: MemoryStore): KV {

  const read = (key: string) => {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      store.delete(key);
      return undefined;
    }
    return entry;
  };

  // Upstash JSON string'leri otomatik parse eder; aynı davranışı taklit et.
  const decode = (value: unknown) => {
    if (typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch { return value; }
  };

  const addNumber = (key: string, delta: number) => {
    const entry = read(key);
    const next = Number(entry?.value ?? 0) + delta;
    store.set(key, { value: next, expiresAt: entry?.expiresAt ?? null });
    return next;
  };

  const list = (key: string): string[] => {
    const entry = read(key);
    return Array.isArray(entry?.value) ? (entry!.value as string[]) : [];
  };

  return {
    async get<T>(key: string) {
      const entry = read(key);
      return entry ? (decode(entry.value) as T) : null;
    },
    async set(key, value, opts) {
      store.set(key, { value, expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : null });
      return 'OK';
    },
    async del(...keys) {
      let n = 0;
      for (const k of keys) if (store.delete(k)) n++;
      return n;
    },
    async incr(key) { return addNumber(key, 1); },
    async incrby(key, by) { return addNumber(key, by); },
    async decr(key) { return addNumber(key, -1); },
    async expire(key, seconds) {
      const entry = read(key);
      if (!entry) return 0;
      entry.expiresAt = Date.now() + seconds * 1000;
      return 1;
    },
    async keys(pattern) {
      const re = new RegExp('^' + pattern.split('*').map(escapeRegex).join('.*') + '$');
      return [...store.keys()].filter((k) => read(k) && re.test(k));
    },
    async lpush(key, ...values) {
      const next = [...values.reverse(), ...list(key)];
      store.set(key, { value: next, expiresAt: read(key)?.expiresAt ?? null });
      return next.length;
    },
    async ltrim(key, start, stop) {
      const entry = read(key);
      if (entry) entry.value = list(key).slice(start, stop + 1);
      return 'OK';
    },
    async mget<T>(...keys: string[]) {
      return keys.map((k) => {
        const entry = read(k);
        return entry ? (decode(entry.value) as T) : null;
      });
    },
    async scan(_cursor, opts) {
      const re = new RegExp('^' + opts.match.split('*').map(escapeRegex).join('.*') + '$');
      return [0, [...store.keys()].filter((k) => read(k) && re.test(k))] as [number, string[]];
    },
    async lrange<T>(key: string, start: number, stop: number) {
      const items = list(key);
      return items.slice(start, stop < 0 ? items.length + stop + 1 : stop + 1).map(decode) as T[];
    },
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
