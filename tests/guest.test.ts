import { beforeEach, describe, expect, it } from 'vitest';
import { _resetKVForTesting } from '@/lib/kv';
import { GUEST_DAILY_CAP, GUEST_PER_IP, guestDeviceId, releaseGuest, reserveGuest } from '@/lib/auth/guest';
import { dailyLimitOf, type StoredUser } from '@/lib/auth/users';
import { DEFAULT_DAILY_LIMIT, LEGACY_DEFAULT_LIMIT } from '@/lib/auth/limits';
import { POST as respond } from '@/app/api/v1/mentors/respond/route';

beforeEach(() => {
  _resetKVForTesting();
});

describe('misafir denemesi', () => {
  it('cihaz başına günde bir; aynı Wi-Fi ağındaki başka cihaz deneyebilir; iade edilince tekrar', async () => {
    const r = await reserveGuest('cihaz-a', '1.2.3.4');
    expect(r.ok).toBe(true);
    expect(await reserveGuest('cihaz-a', '1.2.3.4')).toEqual({ ok: false, reason: 'used' });
    // Aynı ev bağlantısı, başka cihaz
    expect((await reserveGuest('cihaz-b', '1.2.3.4')).ok).toBe(true);
    if (r.ok) await releaseGuest(r);
    expect((await reserveGuest('cihaz-a', '1.2.3.4')).ok).toBe(true);
  });

  it('çerez silerek tekrar denemeye karşı bağlantı başına üst sınır var', async () => {
    for (let i = 0; i < GUEST_PER_IP; i++) expect((await reserveGuest(`c${i}`, '9.9.9.9')).ok).toBe(true);
    expect(await reserveGuest('yeni-cihaz', '9.9.9.9')).toEqual({ ok: false, reason: 'ip' });
    // Reddedilen cihaz başka bağlantıdan deneyebilir (sayaç geri alındı)
    expect((await reserveGuest('yeni-cihaz', '8.8.8.8')).ok).toBe(true);
  });

  it('günlük toplam sınırı aşılınca kapanır', async () => {
    for (let i = 0; i < GUEST_DAILY_CAP; i++) expect((await reserveGuest(`d${i}`, `10.0.${Math.floor(i / 250)}.${i % 250}`)).ok).toBe(true);
    expect(await reserveGuest('son', '99.99.99.99')).toEqual({ ok: false, reason: 'cap' });
  });

  it('çerezdeki kimlik doğrulanır, yoksa yenisi üretilir', () => {
    const fresh = guestDeviceId(null);
    expect(fresh.isNew).toBe(true);
    expect(fresh.id).toMatch(/^[a-f0-9]{32}$/);
    expect(guestDeviceId(fresh.id)).toEqual({ id: fresh.id, isNew: false });
    expect(guestDeviceId('<script>').isNew).toBe(true);
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
    expect((await reserveGuest('herhangi', '7.7.7.7')).ok).toBe(true);
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
