/**
 * KV — Upstash Redis bağlantısı.
 * Tüm projede tek giriş noktası.
 */

let instance: any = null;
let tried = false;

export function getKV(): any {
  if (instance) return instance;
  if (tried) return null;
  tried = true;

  const url = process.env['KV_REST_API_URL'];
  const token = process.env['KV_REST_API_TOKEN'];

  if (!url || !token) return null;

  try {
    const { Redis } = require('@upstash/redis');
    instance = new Redis({ url, token });
    return instance;
  } catch {
    return null;
  }
}
