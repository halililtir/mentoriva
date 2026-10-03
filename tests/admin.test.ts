import { beforeEach, describe, expect, it } from 'vitest';
import { _resetKVForTesting, getKV, getMany, scanKeys } from '@/lib/kv';
import { getUser, saveUser } from '@/lib/auth/users';
import { getBonus } from '@/lib/auth/bonus';
import { POST as adminLogin } from '@/app/api/admin/login/route';
import { GET as overview } from '@/app/api/admin/overview/route';
import { GET as adminLog } from '@/app/api/admin/log/route';
import { DELETE as delUser, GET as listUsers, PUT as putUser } from '@/app/api/v1/users/route';
import { DELETE as delFeedback, GET as listFeedback, PATCH as patchFeedback, POST as sendFeedback } from '@/app/api/v1/feedback/route';
import { recordEvent } from '@/lib/admin/metrics';

const SECRET = 'test-admin-anahtari-123';
let cookie = '';

const req = (url: string, init: RequestInit = {}) =>
  new Request(`http://localhost${url}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.9', cookie, ...(init.headers ?? {}) },
  });

beforeEach(async () => {
  _resetKVForTesting();
  process.env['ADMIN_SECRET'] = SECRET;
  const res = await adminLogin(req('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: SECRET }) }));
  cookie = (res.headers.get('set-cookie') ?? '').split(';')[0]!;
  await saveUser({ username: 'uye@ornek.com', password: 'x', isActive: true, createdAt: new Date().toISOString(), lastSeen: null });
});

describe('KV yardımcıları', () => {
  it('scanKeys ve getMany desene uyan anahtarları toplu okur', async () => {
    await getKV().set('a:1', 1);
    await getKV().set('a:2', 2);
    await getKV().set('b:1', 3);
    const keys = (await scanKeys('a:*')).sort();
    expect(keys).toEqual(['a:1', 'a:2']);
    expect(await getMany(['a:1', 'yok', 'b:1'])).toEqual([1, null, 3]);
  });
});

describe('admin üye işlemleri', () => {
  it('admin çerezi olmadan 401', async () => {
    cookie = '';
    expect((await listUsers(req('/api/v1/users'))).status).toBe(401);
    expect((await overview(req('/api/admin/overview'))).status).toBe(401);
  });

  it('bonus ekler, işlem kaydına yazar; geçersiz bonusu reddeder', async () => {
    const ok = await putUser(req('/api/v1/users', { method: 'PUT', body: JSON.stringify({ username: 'uye@ornek.com', addBonus: 3 }) }));
    expect(ok.status).toBe(200);
    expect(await getBonus('uye@ornek.com')).toBe(3);

    const bad = await putUser(req('/api/v1/users', { method: 'PUT', body: JSON.stringify({ username: 'uye@ornek.com', addBonus: 0, dailyLimit: 50 }) }));
    expect(bad.status).toBe(400);
    // Hatalı istekte hiçbir alan yazılmamalı
    expect((await getUser('uye@ornek.com'))!.dailyLimit).toBeUndefined();

    const log = await (await adminLog(req('/api/admin/log'))).json();
    expect(log.entries[0]).toMatchObject({ action: 'Üye güncellendi', target: 'uye@ornek.com' });
  });

  it('liste parola içermez, bonus ve kullanım alanları gelir', async () => {
    const body = await (await listUsers(req('/api/v1/users'))).json();
    expect(body.users[0]).toMatchObject({ username: 'uye@ornek.com', bonus: 0, usedToday: 0, referrals: 0 });
    expect(JSON.stringify(body)).not.toContain('"password"');
  });

  it('olmayan üyeyi silmek 404', async () => {
    expect((await delUser(req('/api/v1/users?username=yok@ornek.com', { method: 'DELETE' }))).status).toBe(404);
  });
});

describe('genel bakış', () => {
  it('olay sayaçlarını ve üye özetini döner; son sorularda kullanıcı bilgisi yok', async () => {
    await recordEvent('question');
    await recordEvent('question');
    await getKV().lpush('stats:recent-questions', JSON.stringify({ q: 'Eski soru', mentors: ['jung'], user: 'gizli@ornek.com', at: new Date().toISOString() }));
    const body = await (await overview(req('/api/admin/overview'))).json();
    expect(body.series.question.at(-1)).toBe(2);
    expect(body.members.total).toBe(1);
    expect(JSON.stringify(body.recentQuestions)).not.toContain('gizli@ornek.com');
  });
});

describe('geri bildirim', () => {
  it('okundu işaretlenir ve silinir; geçersiz kimlik reddedilir', async () => {
    await sendFeedback(req('/api/v1/feedback', { method: 'POST', body: JSON.stringify({ name: 'Ali', email: 'ali@ornek.com', message: 'Harika bir site.' }) }));
    const list = await (await listFeedback(req('/api/v1/feedback'))).json();
    const id = list.feedbacks[0].id as string;
    expect(list.feedbacks[0].status).toBe('new');

    expect((await patchFeedback(req('/api/v1/feedback', { method: 'PATCH', body: JSON.stringify({ id, status: 'read' }) }))).status).toBe(200);
    expect((await (await listFeedback(req('/api/v1/feedback'))).json()).feedbacks[0].status).toBe('read');

    expect((await patchFeedback(req('/api/v1/feedback', { method: 'PATCH', body: JSON.stringify({ id: 'user:uye@ornek.com', status: 'read' }) }))).status).toBe(400);
    expect((await delFeedback(req(`/api/v1/feedback?id=${encodeURIComponent('user:uye@ornek.com')}`, { method: 'DELETE' }))).status).toBe(400);
    expect(await getUser('uye@ornek.com')).not.toBeNull();

    expect((await delFeedback(req(`/api/v1/feedback?id=${encodeURIComponent(id)}`, { method: 'DELETE' }))).status).toBe(200);
    expect((await (await listFeedback(req('/api/v1/feedback'))).json()).total).toBe(0);
  });
});
