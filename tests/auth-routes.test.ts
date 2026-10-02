import { beforeEach, describe, expect, it } from 'vitest';
import { _resetKVForTesting } from '@/lib/kv';
import { getUser, saveUser } from '@/lib/auth/users';
import { POST as login } from '@/app/api/v1/auth/login/route';
import { GET as me } from '@/app/api/v1/auth/me/route';
import { GET as listUsers } from '@/app/api/v1/users/route';
import { POST as respond } from '@/app/api/v1/mentors/respond/route';

const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.1', ...headers },
    body: JSON.stringify(body),
  });

const sessionCookie = (res: Response) => (res.headers.get('set-cookie') ?? '').split(';')[0]!;

beforeEach(async () => {
  _resetKVForTesting();
  // Eski sürümden kalmış, şifresi düz metin bir kullanıcı
  await saveUser({
    username: 'eski@kullanici.com',
    password: 'eski-sifre',
    questionLimit: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastSeen: null,
  });
});

describe('giriş', () => {
  it('eski düz metin şifreyle giriş yapılır ve şifre hash olarak yeniden kaydedilir', async () => {
    const res = await login(post('/api/v1/auth/login', { email: 'eski@kullanici.com', password: 'eski-sifre' }));
    expect(res.status).toBe(200);
    expect(sessionCookie(res)).toMatch(/^mentoriva_session=.+/);
    expect((await getUser('eski@kullanici.com'))!.password.startsWith('scrypt$')).toBe(true);

    const meRes = await me(new Request('http://localhost/api/v1/auth/me', { headers: { cookie: sessionCookie(res) } }));
    expect((await meRes.json()).user).toMatchObject({ username: 'eski@kullanici.com', remaining: 5 });
  });

  it('yanlış şifre 401 döner, yanıtta şifre sızmaz', async () => {
    const res = await login(post('/api/v1/auth/login', { email: 'eski@kullanici.com', password: 'yanlis' }));
    expect(res.status).toBe(401);
    expect(JSON.stringify(await res.json())).not.toContain('eski-sifre');
  });
});

describe('yetkilendirme', () => {
  it('admin uçları eski sabit anahtarı kabul etmez', async () => {
    const res = await listUsers(new Request('http://localhost/api/v1/users?key=121017'));
    expect(res.status).toBe(401);
  });

  it('mentor ucu sahte kullanıcı başlığıyla çalışmaz', async () => {
    const res = await respond(post('/api/v1/mentors/respond', { question: 'Hayatın anlamı nedir sence?' }, { 'x-mentoriva-user': 'admin' }));
    expect(res.status).toBe(401);
  });
});
