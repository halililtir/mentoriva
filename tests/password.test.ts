import { describe, expect, it } from 'vitest';
import { hashPassword, validatePassword, verifyPassword } from '@/lib/auth/password';

describe('parola', () => {
  it('hash düz metni içermez ve doğrulanır', async () => {
    const hash = await hashPassword('dogru-sifre-123');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(hash).not.toContain('dogru-sifre-123');
    expect(await verifyPassword('dogru-sifre-123', hash)).toEqual({ ok: true, needsRehash: false });
    expect((await verifyPassword('yanlis', hash)).ok).toBe(false);
  });

  it('aynı parola her seferinde farklı hash üretir (tuz)', async () => {
    expect(await hashPassword('ayni')).not.toBe(await hashPassword('ayni'));
  });

  it('eski düz metin kayıtları tanır ve yeniden hash istenir', async () => {
    expect(await verifyPassword('eski123', 'eski123')).toEqual({ ok: true, needsRehash: true });
    expect((await verifyPassword('baska', 'eski123')).ok).toBe(false);
  });

  it('kayıtlı parola yoksa reddeder', async () => {
    expect((await verifyPassword('x', undefined)).ok).toBe(false);
  });

  it('uzunluk kuralları', () => {
    expect(validatePassword('kisa')).not.toBeNull();
    expect(validatePassword('yeterince-uzun')).toBeNull();
  });
});
