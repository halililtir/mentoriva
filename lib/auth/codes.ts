/**
 * E-postaya gönderilen 6 haneli tek kullanımlık kodlar (kayıt + şifre sıfırlama).
 *
 *   code:<purpose>:<email>           → { codeHash, payload } (TTL 10 dk)
 *   code-attempts:<purpose>:<email>  → yanlış deneme sayacı (atomik)
 *
 * Kod düz saklanmaz. RATE_LIMITS.CODE_MAX_ATTEMPTS yanlış denemeden sonra
 * kod geçersiz olur ve kullanıcı yeni kod istemek zorundadır.
 */

import { getKV } from '@/lib/kv';
import { RATE_LIMITS } from '@/lib/features';
import { digest, newVerificationCode } from '@/lib/auth/tokens';

export type CodePurpose = 'verify' | 'reset';

const CODE_TTL = 600;

interface StoredCode<T> {
  codeHash: string;
  payload: T;
}

const codeKey = (p: CodePurpose, email: string) => `code:${p}:${email}`;
const attemptsKey = (p: CodePurpose, email: string) => `code-attempts:${p}:${email}`;
const hashCode = (p: CodePurpose, email: string, code: string) => digest(`${p}:${email}:${code}`);

export async function issueCode<T>(purpose: CodePurpose, email: string, payload: T): Promise<string> {
  const kv = getKV();
  const code = newVerificationCode();
  const record: StoredCode<T> = { codeHash: hashCode(purpose, email, code), payload };
  await kv.set(codeKey(purpose, email), record, { ex: CODE_TTL });
  await kv.del(attemptsKey(purpose, email));
  return code;
}

export type ConsumeResult<T> =
  | { ok: true; payload: T }
  | { ok: false; reason: 'expired' | 'invalid' | 'locked' };

export async function consumeCode<T>(purpose: CodePurpose, email: string, code: string): Promise<ConsumeResult<T>> {
  const kv = getKV();
  const raw = await kv.get<StoredCode<T> | string>(codeKey(purpose, email));
  if (!raw) return { ok: false, reason: 'expired' };
  const record = (typeof raw === 'string' ? JSON.parse(raw) : raw) as StoredCode<T>;

  if (record.codeHash !== hashCode(purpose, email, code)) {
    const attempts = await kv.incr(attemptsKey(purpose, email));
    if (attempts === 1) await kv.expire(attemptsKey(purpose, email), CODE_TTL);
    if (attempts >= RATE_LIMITS.CODE_MAX_ATTEMPTS) {
      await kv.del(codeKey(purpose, email), attemptsKey(purpose, email));
      return { ok: false, reason: 'locked' };
    }
    return { ok: false, reason: 'invalid' };
  }

  await kv.del(codeKey(purpose, email), attemptsKey(purpose, email));
  return { ok: true, payload: record.payload };
}

export const CODE_ERROR_MESSAGES = {
  expired: 'Kodun süresi dolmuş. Lütfen yeni bir kod iste.',
  invalid: 'Kod hatalı. Tekrar dene.',
  locked: 'Çok fazla hatalı deneme yapıldı. Lütfen yeni bir kod iste.',
} as const;

/** Kayıt doğrulanana kadar kodla birlikte saklanan bilgiler. */
export interface PendingRegistration {
  name: string;
  passwordHash: string;
  /** Davet linkiyle geldiyse davet kodu. */
  ref?: string | null;
}
