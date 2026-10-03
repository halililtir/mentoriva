import { beforeEach, describe, expect, it } from 'vitest';
import { _resetKVForTesting } from '@/lib/kv';
import { saveUser, toPublicUser } from '@/lib/auth/users';
import { giveBadge } from '@/lib/badges';
import { perksFromBadges } from '@/lib/badges-public';
import { canUseMentor, checkMentorSelection, maxMentorsFor } from '@/lib/mentors/access';
import { getEarlyMentors, setEarlyMentors } from '@/lib/mentors/access-server';
import { startUserSession } from '@/lib/auth/session';
import { POST as respond } from '@/app/api/v1/mentors/respond/route';
import { NextResponse } from 'next/server';

const U = 'uye@ornek.com';

async function cookieFor(username: string) {
  const res = NextResponse.json({});
  await startUserSession(res, username);
  return (res.headers.get('set-cookie') ?? '').split(';')[0]!;
}

const ask = (cookie: string, mentorIds: string[]) =>
  respond(new Request('http://localhost/api/v1/mentors/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie, 'x-forwarded-for': '10.0.0.5' },
    body: JSON.stringify({ question: 'Hayatın anlamı nedir sence?', mentorIds }),
  }));

beforeEach(async () => {
  _resetKVForTesting();
  await saveUser({ username: U, password: 'x', isActive: true, createdAt: new Date().toISOString(), lastSeen: null });
});

describe('ayrıcalıklar', () => {
  it('işaretlerden doğru türetilir', () => {
    expect(perksFromBadges(['cok-sesli'])).toEqual(['tam-meclis']);
    expect(perksFromBadges(['kurucu']).sort()).toEqual(['erken-erisim', 'gunluk-arti-bir']);
    expect(perksFromBadges(['ilk-adim'])).toEqual([]);
  });

  it('oturum bilgisinde görünür', async () => {
    await giveBadge(U, 'derinlesen', 'auto');
    expect((await toPublicUser({ username: U, password: 'x', isActive: true, createdAt: '', lastSeen: null })).perks).toEqual(['sohbet-indir']);
  });
});

describe('mentor seçimi', () => {
  it('varsayılan en fazla 4; Tam meclis ile hepsi', () => {
    expect(maxMentorsFor([])).toBe(4);
    expect(maxMentorsFor(['tam-meclis'])).toBe(5);
    expect(checkMentorSelection(['jung', 'nietzsche', 'mevlana', 'marcus', 'seneca'], [], [])).toMatch(/en fazla 4/);
    expect(checkMentorSelection(['jung', 'nietzsche', 'mevlana', 'marcus', 'seneca'], ['tam-meclis'], [])).toBeNull();
  });

  it('erken erişim mentoru yalnızca ayrıcalıklıya açık', () => {
    expect(canUseMentor('seneca', [], ['seneca'])).toBe(false);
    expect(canUseMentor('seneca', ['erken-erisim'], ['seneca'])).toBe(true);
    expect(canUseMentor('jung', [], ['seneca'])).toBe(true);
  });

  it('sunucu 5 mentoru ayrıcalıksız reddeder', async () => {
    const res = await ask(await cookieFor(U), ['jung', 'nietzsche', 'mevlana', 'marcus', 'seneca']);
    expect(res.status).toBe(403);
  });

  it('sunucu erken erişim mentorunu ayrıcalıksız reddeder', async () => {
    await setEarlyMentors(['seneca']);
    expect((await ask(await cookieFor(U), ['seneca'])).status).toBe(403);
  });

  it('erken erişim listesi hepsini kapatamaz', async () => {
    expect(await setEarlyMentors(['jung', 'nietzsche', 'mevlana', 'marcus', 'seneca'])).toBeNull();
    expect(await setEarlyMentors(['seneca', 'yok'])).toEqual(['seneca']);
    expect(await getEarlyMentors()).toEqual(['seneca']);
  });
});
