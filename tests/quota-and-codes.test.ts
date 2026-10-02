import { beforeEach, describe, expect, it } from 'vitest';
import { _resetKVForTesting } from '@/lib/kv';
import { getUsedToday, releaseQuestion, reserveQuestion, resetUsageToday, type StoredUser } from '@/lib/auth/users';
import { consumeCode, issueCode } from '@/lib/auth/codes';
import { todayKey } from '@/lib/time';

const user = (dailyLimit: number): StoredUser => ({
  username: 'a@b.com',
  password: 'x',
  dailyLimit,
  isActive: true,
  createdAt: new Date().toISOString(),
  lastSeen: null,
});

beforeEach(() => _resetKVForTesting());

describe('günlük kota', () => {
  it('limit kadar hak verir, sonra reddeder', async () => {
    const u = user(2);
    expect(await reserveQuestion(u)).toEqual({ remaining: 1, fromBonus: false });
    expect(await reserveQuestion(u)).toEqual({ remaining: 0, fromBonus: false });
    expect(await reserveQuestion(u)).toBeNull();
    expect(await getUsedToday(u.username)).toBe(2);
  });

  it('başarısız cevapta hak iade edilir', async () => {
    const u = user(1);
    const r = await reserveQuestion(u);
    await releaseQuestion(u, r!);
    expect(await reserveQuestion(u)).toEqual({ remaining: 0, fromBonus: false });
  });

  it('admin sıfırlaması o günün sayacını temizler', async () => {
    const u = user(1);
    await reserveQuestion(u);
    await resetUsageToday(u.username);
    expect(await reserveQuestion(u)).not.toBeNull();
  });

  it('eski questionLimit alanı günlük limit olarak okunur', async () => {
    const legacy = { ...user(0), dailyLimit: undefined, questionLimit: 1 };
    expect(await reserveQuestion(legacy)).toEqual({ remaining: 0, fromBonus: false });
    expect(await reserveQuestion(legacy)).toBeNull();
  });
});

describe('gün anahtarı', () => {
  it('Türkiye saatine göre döner (UTC 21:30 = ertesi gün 00:30)', () => {
    expect(todayKey(new Date('2026-10-02T21:30:00Z'))).toBe('2026-10-03');
    expect(todayKey(new Date('2026-10-02T20:59:00Z'))).toBe('2026-10-02');
  });
});

describe('doğrulama kodları', () => {
  it('doğru kod bir kez kullanılabilir', async () => {
    const code = await issueCode('verify', 'a@b.com', { n: 1 });
    expect(code).toMatch(/^\d{6}$/);
    expect(await consumeCode('verify', 'a@b.com', code)).toEqual({ ok: true, payload: { n: 1 } });
    expect(await consumeCode('verify', 'a@b.com', code)).toEqual({ ok: false, reason: 'expired' });
  });

  it('5 yanlış denemeden sonra kod kilitlenir', async () => {
    const code = await issueCode('verify', 'a@b.com', null);
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 4; i++) {
      expect(await consumeCode('verify', 'a@b.com', wrong)).toEqual({ ok: false, reason: 'invalid' });
    }
    expect(await consumeCode('verify', 'a@b.com', wrong)).toEqual({ ok: false, reason: 'locked' });
    // Kilitlendikten sonra doğru kod da geçmez
    expect((await consumeCode('verify', 'a@b.com', code)).ok).toBe(false);
  });

  it('kayıt kodu şifre sıfırlamada geçmez', async () => {
    const code = await issueCode('verify', 'a@b.com', null);
    expect((await consumeCode('reset', 'a@b.com', code)).ok).toBe(false);
  });
});
