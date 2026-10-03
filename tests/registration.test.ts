import { beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetKVForTesting } from '@/lib/kv';
import { getUser } from '@/lib/auth/users';
import { issueCode } from '@/lib/auth/codes';
import { getPending, listPending, savePending } from '@/lib/auth/registration';
import { POST as register } from '@/app/api/v1/auth/register/route';
import { POST as verify } from '@/app/api/v1/auth/verify/route';
import { POST as adminLogin } from '@/app/api/admin/login/route';
import { POST as pendingAction } from '@/app/api/admin/pending/route';
import { verifyPassword } from '@/lib/auth/password';

const SECRET = 'test-admin-anahtari-123';
const json = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://localhost${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.8', ...headers }, body: JSON.stringify(body) });
/** Kayıt formundaki zorunlu onaylar (yaş + şartlar, yurt dışı aktarım). */
const CONSENT = { adult: true, terms: true, transfer: true };

async function adminCookie() {
  process.env['ADMIN_SECRET'] = SECRET;
  const res = await adminLogin(json('/api/admin/login', { password: SECRET }));
  return (res.headers.get('set-cookie') ?? '').split(';')[0]!;
}

beforeEach(() => {
  _resetKVForTesting();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('kayıt ve doğrulama', () => {
  it('kayıt bekleyen kaydı saklar (parola özetiyle, düz değil)', async () => {
    const res = await register(json('/api/v1/auth/register', { name: 'Ayşe', email: 'Ayse@Ornek.com', password: 'guclu-sifre-1', ...CONSENT }));
    expect(res.status).toBe(200);
    const p = await getPending('ayse@ornek.com');
    expect(p?.name).toBe('Ayşe');
    expect(p?.consent).toMatchObject({ adult: true, terms: true, transfer: true });
    expect(p?.passwordHash).not.toContain('guclu-sifre-1');
    expect((await listPending())[0]).toMatchObject({ email: 'ayse@ornek.com', name: 'Ayşe' });
    expect(JSON.stringify(await listPending())).not.toContain('passwordHash');
  });

  it('kodla doğrulama hesabı açar ve bekleyen kaydı siler', async () => {
    const pending = { name: 'Ali', passwordHash: 'scrypt$x', ref: null };
    await savePending('ali@ornek.com', pending);
    const code = await issueCode('verify', 'ali@ornek.com', pending);
    const res = await verify(json('/api/v1/auth/verify', { email: 'ali@ornek.com', code }));
    expect(res.status).toBe(200);
    expect(await getUser('ali@ornek.com')).toMatchObject({ name: 'Ali', isVerified: true });
    expect(await getPending('ali@ornek.com')).toBeNull();
  });

  it('admin onayı hesabı kişinin kendi şifresiyle açar', async () => {
    await register(json('/api/v1/auth/register', { name: 'Can', email: 'can@ornek.com', password: 'can-sifresi-9', ...CONSENT }));
    const cookie = await adminCookie();
    const res = await pendingAction(json('/api/admin/pending', { email: 'can@ornek.com', action: 'approve' }, { cookie }));
    expect(res.status).toBe(200);
    const user = await getUser('can@ornek.com');
    expect(user?.notes).toBe('admin onayıyla kayıt');
    expect((await verifyPassword('can-sifresi-9', user!.password)).ok).toBe(true);
    expect(await getPending('can@ornek.com')).toBeNull();
    // ikinci onay: kayıt artık yok
    expect((await pendingAction(json('/api/admin/pending', { email: 'can@ornek.com', action: 'approve' }, { cookie }))).status).toBe(404);
  });

  it('admin çerezi olmadan onaylanamaz', async () => {
    await savePending('x@ornek.com', { name: 'X', passwordHash: 'scrypt$x' });
    expect((await pendingAction(json('/api/admin/pending', { email: 'x@ornek.com', action: 'approve' }))).status).toBe(401);
  });
});
