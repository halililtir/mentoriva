import { beforeEach, describe, expect, it } from 'vitest';
import { _resetKVForTesting } from '@/lib/kv';
import { POST as rate } from '@/app/api/v1/rate/route';
import { POST as clientError } from '@/app/api/v1/errors/route';
import { GET as weeklyCron } from '@/app/api/cron/weekly-report/route';
import { ratingSummary } from '@/lib/admin/ratings';
import { readErrors, scrub } from '@/lib/admin/errors';
import { buildWeeklyReport, renderWeeklyReport } from '@/lib/admin/report';
import { recordEvent, lastDays } from '@/lib/admin/metrics';

const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.7', ...headers },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  _resetKVForTesting();
});

describe('cevap değerlendirme', () => {
  it('oy ve nedeni sayar; geçersiz girdiyi reddeder', async () => {
    expect((await rate(post('/api/v1/rate', { mentorId: 'jung', value: 'up' }))).status).toBe(200);
    expect((await rate(post('/api/v1/rate', { mentorId: 'jung', value: 'down' }))).status).toBe(200);
    expect((await rate(post('/api/v1/rate', { mentorId: 'jung', value: 'reason', reason: 'genel' }))).status).toBe(200);
    expect((await rate(post('/api/v1/rate', { mentorId: 'kimse', value: 'up' }))).status).toBe(400);
    expect((await rate(post('/api/v1/rate', { mentorId: 'jung', value: 'reason', reason: 'uydurma' }))).status).toBe(400);

    const s = await ratingSummary(lastDays(1));
    expect(s.mentors.find((m) => m.id === 'jung')).toMatchObject({ up: 1, down: 1 });
    expect(s.reasons.find((r) => r.id === 'genel')?.count).toBe(1);
  });
});

describe('hata kaydı', () => {
  it('kişisel ve gizli değerleri temizler', () => {
    const out = scrub('Hata ali@ornek.com sk-ant-abcdefghijklmnop /sayfa?token=123 ' + 'x'.repeat(40));
    expect(out).not.toContain('ali@ornek.com');
    expect(out).not.toContain('sk-ant');
    expect(out).not.toContain('token=123');
    expect(out).not.toContain('x'.repeat(40));
  });

  it('tarayıcı hatasını kaydeder', async () => {
    expect((await clientError(post('/api/v1/errors', { message: 'TypeError: x is undefined', where: 'window', path: '/test' }))).status).toBe(200);
    const [e] = await readErrors();
    expect(e).toMatchObject({ source: 'client', where: 'window', path: '/test' });
  });
});

describe('haftalık özet', () => {
  it('bu hafta ile önceki haftayı kıyaslar', async () => {
    await recordEvent('question');
    await recordEvent('question');
    const r = await buildWeeklyReport();
    expect(r.lines.find((l) => l.label === 'Soru')).toMatchObject({ now: 2, prev: 0 });
    const { subject, text, html } = renderWeeklyReport(r);
    expect(subject).toContain('haftalık özet');
    expect(text).toContain('Soru: 2');
    expect(html).toContain('Paneli aç');
  });

  it('cron ucu CRON_SECRET olmadan ya da yanlış anahtarla çalışmaz', async () => {
    delete process.env['CRON_SECRET'];
    expect((await weeklyCron(new Request('http://localhost/api/cron/weekly-report'))).status).toBe(503);
    process.env['CRON_SECRET'] = 'dogru-anahtar-123456';
    const bad = await weeklyCron(new Request('http://localhost/api/cron/weekly-report', { headers: { authorization: 'Bearer yanlis' } }));
    expect(bad.status).toBe(401);
    delete process.env['CRON_SECRET'];
  });
});
