import { beforeEach, describe, expect, it } from 'vitest';
import { _resetKVForTesting } from '@/lib/kv';
import { awardBadges, getBadges, giveBadge, markBadgesSeen, unseenBadges } from '@/lib/badges';
import { effectiveDailyLimit, reserveQuestion, saveUser, type StoredUser } from '@/lib/auth/users';
import { costMicros, costSummary, recordUsage } from '@/lib/admin/cost';
import { lastDays } from '@/lib/admin/metrics';
import { cohorts, funnel } from '@/lib/admin/funnel';
import { POST as adminLogin } from '@/app/api/admin/login/route';
import { PUT as putUser } from '@/app/api/v1/users/route';

const U = 'uye@ornek.com';
const user = (over: Partial<StoredUser> = {}): StoredUser => ({
  username: U, password: 'x', isActive: true, createdAt: new Date().toISOString(), lastSeen: null, ...over,
});

beforeEach(async () => {
  _resetKVForTesting();
  await saveUser(user());
});

describe('işaretler', () => {
  it('ilk soru ve tüm mentorlar; aynı işaret iki kez verilmez', async () => {
    expect(await awardBadges(U, { type: 'answered', mentorIds: ['jung', 'marcus'] })).toEqual(['ilk-adim']);
    expect(await awardBadges(U, { type: 'answered', mentorIds: ['jung'] })).toEqual([]);
    expect(await awardBadges(U, { type: 'answered', mentorIds: ['nietzsche', 'mevlana', 'seneca'] })).toEqual(['cok-sesli']);
    expect((await getBadges(U)).map((b) => b.id)).toEqual(['ilk-adim', 'cok-sesli']);
  });

  it('derin sohbet beşinci kullanıcı mesajında gelir', async () => {
    expect(await awardBadges(U, { type: 'chat', mentorId: 'jung', userMessages: 4 })).toEqual([]);
    expect(await awardBadges(U, { type: 'chat', mentorId: 'jung', userMessages: 5 })).toEqual(['derinlesen']);
  });

  it('görülmemiş işaretler görüldü olarak işaretlenir', async () => {
    await awardBadges(U, { type: 'journey' });
    expect((await unseenBadges(U)).map((b) => b.id)).toEqual(['ice-bakis']);
    await markBadgesSeen(U);
    expect(await unseenBadges(U)).toEqual([]);
  });

  it('Kurucu Üye günlük hakka +1 ekler ve kotada geçerlidir', async () => {
    const u = user({ dailyLimit: 1 });
    expect(await effectiveDailyLimit(u)).toBe(1);
    await giveBadge(U, 'kurucu', 'admin');
    expect(await effectiveDailyLimit(u)).toBe(2);
    expect(await reserveQuestion(u)).not.toBeNull();
    expect(await reserveQuestion(u)).not.toBeNull();
    expect(await reserveQuestion(u)).toBeNull();
  });
});

describe('admin işaret işlemleri', () => {
  const SECRET = 'test-admin-anahtari-123';
  const call = async (fn: (r: Request) => Promise<Response>, url: string, method: string, body: unknown) => {
    process.env['ADMIN_SECRET'] = SECRET;
    const login = await adminLogin(new Request('http://localhost/api/admin/login', { method: 'POST', headers: { 'x-forwarded-for': '10.0.0.3' }, body: JSON.stringify({ password: SECRET }) }));
    const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]!;
    return fn(new Request(`http://localhost${url}`, { method, headers: { cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
  };

  it('otomatik işaret elle verilemez; elle verilen geri alınabilir', async () => {
    expect((await call(putUser, '/api/v1/users', 'PUT', { username: U, grantBadge: 'ilk-adim' })).status).toBe(400);
    expect((await call(putUser, '/api/v1/users', 'PUT', { username: U, grantBadge: 'destekci' })).status).toBe(200);
    expect((await getBadges(U)).map((b) => b.id)).toEqual(['destekci']);
    await call(putUser, '/api/v1/users', 'PUT', { username: U, revokeBadge: 'destekci' });
    expect(await getBadges(U)).toEqual([]);
  });
});

describe('maliyet', () => {
  it('liste fiyatıyla mikro-dolar hesaplar', () => {
    // 1M girdi × $3 + 1M çıktı × $15 = $18
    expect(costMicros('claude-sonnet-4-6', { input_tokens: 1_000_000, output_tokens: 1_000_000 })).toBe(18_000_000);
    expect(costMicros('claude-sonnet-5-5', { input_tokens: 1_000_000, output_tokens: 1_000_000 })).toBe(12_000_000);
    expect(costMicros('claude-haiku-4-5-20251001', { cache_read_input_tokens: 1_000_000 })).toBe(100_000);
  });

  it('kullanımı günlük ve özellik bazında toplar', async () => {
    await recordUsage('answer', 'claude-sonnet-4-6', { input_tokens: 1000, output_tokens: 500 });
    await recordUsage('chat', 'claude-sonnet-4-6', { input_tokens: 2000, output_tokens: 0 });
    const s = await costSummary(lastDays(1));
    // answer: 1000×3 + 500×15 = 10 500 µ$; chat: 2000×3 = 6 000 µ$
    expect(s.totalUsd).toBeCloseTo(0.0165, 6);
    expect(s.features.find((f) => f.id === 'answer')).toMatchObject({ calls: 1 });
    expect(s.tokens.in).toBe(3000);
  });
});

describe('huni', () => {
  it('adımları ve 7. gün uygunluğunu doğru sayar', () => {
    const now = Date.now();
    const day = 86_400_000;
    const users: StoredUser[] = [
      user({ username: 'a', createdAt: new Date(now - 10 * day).toISOString(), questionsUsed: 3, lastSeen: new Date(now - 1 * day).toISOString() }),
      user({ username: 'b', createdAt: new Date(now - 10 * day).toISOString(), questionsUsed: 1, lastSeen: new Date(now - 10 * day + 1000).toISOString() }),
      user({ username: 'c', createdAt: new Date(now - 2 * day).toISOString(), questionsUsed: 0 }),
    ];
    const f = funnel(users, 30, now);
    expect(f.map((s) => s.count)).toEqual([3, 2, 1, 1]);
    // 7. gün: uygun olanlar a ve b; yalnızca a kaldı
    expect(f[3]!.ofPrev).toBe(50);
    expect(cohorts(users, 8, now).reduce((s, c) => s + c.signups, 0)).toBe(3);
  });
});
