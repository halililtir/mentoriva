import { createHash, randomBytes, randomInt } from 'node:crypto';

/** Oturum çerezi için tahmin edilemez token. */
export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Token'ı veritabanına düz yazmamak için SHA-256 özeti. */
export function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** 6 haneli doğrulama kodu (kriptografik rastgele). */
export function newVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}
