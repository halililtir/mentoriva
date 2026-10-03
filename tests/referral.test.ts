import { beforeEach, describe, expect, it } from 'vitest';
import { _resetKVForTesting } from '@/lib/kv';
import { getUser, releaseQuestion, reserveQuestion, saveUser, toPublicUser, type StoredUser } from '@/lib/auth/users';
import { addBonus, getBonus } from '@/lib/auth/bonus';
import {
  MAX_REWARDED_REFERRALS,
  NEW_USER_BONUS,
  REFERRER_BONUS,
  applyReferral,
  getOrCreateReferralCode,
  normalizeReferralCode,
} from '@/lib/auth/referral';

const mk = async (username: string, dailyLimit = 1): Promise<StoredUser> => {
  const u: StoredUser = { username, password: 'x', dailyLimit, isActive: true, createdAt: new Date().toISOString(), lastSeen: null };
  await saveUser(u);
  return u;
};

beforeEach(() => _resetKVForTesting());

describe('bonus haklar', () => {
  it('günlük hak bitince bonus kullanılır, sonra reddedilir', async () => {
    const u = await mk('a@b.com', 1);
    await addBonus(u.username, 1);
    expect(await reserveQuestion(u)).toEqual({ remaining: 1, fromBonus: false });
    expect(await reserveQuestion(u)).toEqual({ remaining: 0, fromBonus: true });
    expect(await reserveQuestion(u)).toBeNull();
  });

  it('bonustan düşülen hak bonusa iade edilir', async () => {
    const u = await mk('a@b.com', 0);
    await addBonus(u.username, 1);
    const r = await reserveQuestion(u);
    expect(r?.fromBonus).toBe(true);
    await releaseQuestion(u, r!);
    expect(await getBonus(u.username)).toBe(1);
  });

  it('kalan hak, günlük kalan ile bonusun toplamıdır', async () => {
    const u = await mk('a@b.com', 7);
    await addBonus(u.username, 3);
    expect((await toPublicUser(u)).remaining).toBe(10);
  });
});

describe('davet', () => {
  it('davet eden ve yeni üye bonus alır', async () => {
    const ref = await mk('davet@eden.com');
    const code = await getOrCreateReferralCode(ref);
    expect(normalizeReferralCode(code.toLowerCase())).toBe(code);
    await mk('yeni@uye.com');
    expect(await applyReferral(code, 'yeni@uye.com')).toBe(true);
    expect(await getBonus('davet@eden.com')).toBe(REFERRER_BONUS);
    expect(await getBonus('yeni@uye.com')).toBe(NEW_USER_BONUS);
    expect((await getUser('yeni@uye.com'))?.referredBy).toBe('davet@eden.com');
  });

  it('kendi kendini davet edemez', async () => {
    const ref = await mk('ben@ben.com');
    const code = await getOrCreateReferralCode(ref);
    expect(await applyReferral(code, 'ben@ben.com')).toBe(false);
    expect(await getBonus('ben@ben.com')).toBe(0);
  });

  it('ödüllü davet sayısı sınırlıdır', async () => {
    const ref = await mk('cok@davet.com');
    const code = await getOrCreateReferralCode(ref);
    for (let i = 0; i < MAX_REWARDED_REFERRALS + 3; i++) {
      await mk(`u${i}@x.com`);
      await applyReferral(code, `u${i}@x.com`);
    }
    expect(await getBonus('cok@davet.com')).toBe(REFERRER_BONUS * MAX_REWARDED_REFERRALS);
  });

  it('geçersiz kodları reddeder', () => {
    expect(normalizeReferralCode('kısa')).toBeNull();
    expect(normalizeReferralCode('ABCD1OIL')).toBeNull();
    expect(normalizeReferralCode(42)).toBeNull();
  });
});
