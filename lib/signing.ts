/**
 * Kısa ömürlü imzalı izinler (HMAC-SHA256, WebCrypto) — Node ve Edge'de çalışır.
 * İçerik şifrelenmez, yalnızca değiştirilemez hale gelir; gizli veri koyma.
 */

function secret(): string | null {
  const s = process.env['SHARE_CARD_SECRET'] || process.env['KV_REST_API_TOKEN'];
  if (s) return s;
  return process.env.NODE_ENV === 'production' ? null : 'mentoriva-dev-only-signing-secret';
}

const enc = new TextEncoder();

function toB64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmac(data: string, key: string): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(data)));
}

/** `purpose` farklı izin türlerinin birbirinin yerine kullanılmasını engeller. */
export async function signJson<T extends object>(purpose: string, payload: T, ttlMs: number): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  const body = toB64url(enc.encode(JSON.stringify({ ...payload, _p: purpose, exp: Date.now() + ttlMs })));
  return `${body}.${toB64url(await hmac(body, key))}`;
}

export async function verifyJson<T extends object>(purpose: string, token: string): Promise<(T & { exp: number }) | null> {
  const key = secret();
  const [body, sig] = token.split('.');
  if (!key || !body || !sig) return null;
  const expected = toB64url(await hmac(body, key));
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as T & { exp: number; _p?: string };
    return payload._p === purpose && payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}
