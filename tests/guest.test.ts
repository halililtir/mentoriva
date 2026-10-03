import { beforeEach, describe, expect, it } from 'vitest';
import { _resetKVForTesting } from '@/lib/kv';
import { GUEST_DAILY_CAP, releaseGuest, reserveGuest } from '@/lib/auth/guest';
import { dailyLimitOf, type StoredUser } from '@/lib/auth/users';
import { DEFAULT_DAILY_LIMIT, LEGACY_DEFAULT_LIMIT } from '@/lib/auth/limits';
import { POST as respond } from '@/app/api/v1/mentors/respond/route';

beforeEach(() => {
  _resetKVForTesting();
});

describe('misafir denemesi', () => {
  it('IP başına günde bir; iade edilince tekrar kullanılabilir', async () => {
    const r = await reserveGuest('1.2.3.4');
    expect(r.ok).toBe(true);
    expect(await reserveGuest('1.2.3.4')).toEqual({ ok: false, reason: 'used' });
    expect((await reserveGuest('5.6.7.8')).ok).toBe(true);
    if (r.ok) await releaseGuest(r);
    expect((await reserveGuest('1.2.3.4')).ok).toBe(true);
  });

  it('günlük toplam sınırı aşılınca kapanır', async () => {
    for (let i = 0; i < GUEST_DAILY_CAP; i++) expect((await reserveGuest(`10.0.${Math.floor(i / 250)}.${i % 250}`)).ok).toBe(true);
    expect(await reserveGuest('99.99.99.99')).toEqual({ ok: false, reason: 'cap' });
  });

  const ask = (body: Record<string, unknown>) =>
    respond(new Request('http://localhost/api/v1/mentors/respond', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '7.7.7.7' },
      body: JSON.stringify({ question: 'Neden hep aynı hataları yapıyorum?', ...body }),
    }));

  it('onay vermeyen ya da ikiden fazla mentor seçen misafir reddedilir', async () => {
    const noConsent = await ask({ mentorIds: ['jung'] });
    expect(noConsent.status).toBe(403);
    expect((await noConsent.json()).error.code).toBe('CONSENT_REQUIRED');
    const tooMany = await ask({ mentorIds: ['jung', 'seneca', 'marcus'], consent: true });
    expect(tooMany.status).toBe(403);
    expect((await tooMany.json()).error.code).toBe('MENTOR_NOT_ALLOWED');
    // Reddedilen istekler deneme hakkını yemez
    expect((await reserveGuest('7.7.7.7')).ok).toBe(true);
  });
});

describe('günlük hak', () => {
  const base: StoredUser = { username: 'a@b.c', password: 'x', isActive: true, createdAt: '2026-01-01', lastSeen: null };
  it('eski otomatik 5 yeni varsayılana döner, admin limiti korunur', () => {
    expect(DEFAULT_DAILY_LIMIT).toBe(10);
    expect(dailyLimitOf(base)).toBe(DEFAULT_DAILY_LIMIT);
    expect(dailyLimitOf({ ...base, dailyLimit: LEGACY_DEFAULT_LIMIT })).toBe(DEFAULT_DAILY_LIMIT);
    expect(dailyLimitOf({ ...base, dailyLimit: LEGACY_DEFAULT_LIMIT, limitByAdmin: true })).toBe(5);
    expect(dailyLimitOf({ ...base, dailyLimit: 25 })).toBe(25);
    expect(dailyLimitOf({ ...base, dailyLimit: 0, limitByAdmin: true })).toBe(0);
  });
});
