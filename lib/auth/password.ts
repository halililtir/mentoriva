/**
 * Parola hash'leme — Node'un yerleşik scrypt'i, ek bağımlılık yok.
 *
 * Saklama formatı: `scrypt$<saltHex>$<hashHex>`
 * Eski kayıtlar düz metin tutuyordu; verifyPassword bunları da tanır ve
 * `needsRehash: true` döner, giriş sırasında hash'e çevrilir.
 */

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const KEY_LEN = 64;
const PREFIX = 'scrypt$';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(plain, salt, KEY_LEN);
  return `${PREFIX}${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(
  plain: string,
  stored: string | undefined | null,
): Promise<{ ok: boolean; needsRehash: boolean }> {
  if (!stored) return { ok: false, needsRehash: false };

  if (!stored.startsWith(PREFIX)) {
    // Eski düz metin kayıt
    return { ok: safeEqual(Buffer.from(plain), Buffer.from(stored)), needsRehash: true };
  }

  const [, saltHex, hashHex] = stored.split('$');
  if (!saltHex || !hashHex) return { ok: false, needsRehash: false };
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(plain, Buffer.from(saltHex, 'hex'), expected.length);
  return { ok: safeEqual(actual, expected), needsRehash: false };
}

export function validatePassword(plain: string): string | null {
  if (plain.length < PASSWORD_MIN_LENGTH) return `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalı`;
  if (plain.length > PASSWORD_MAX_LENGTH) return 'Şifre çok uzun';
  return null;
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}
