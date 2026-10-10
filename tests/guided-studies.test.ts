import { describe, expect, it } from 'vitest';
import { GUIDED_STUDIES, STUDY_MAX_QUESTIONS, turnsToQuestion } from '@/lib/studies/guided-content';
import { parseFinish, parseNext } from '@/lib/studies/guided';
import { sanitizeTurns, signStudy, verifyStudy } from '@/lib/studies/guided-server';
import { addDays, getReminder, sendDueReminders, setReminder } from '@/lib/reminders';
import { saveStep, updateStepStatus } from '@/lib/journey/store';
import { todayKey } from '@/lib/time';

const u = () => `calisma-${Math.random().toString(36).slice(2)}@example.test`;

describe('rehberli çalışmalar', () => {
  it('tanımlar benzersiz ve açılış sorusu var', () => {
    expect(new Set(GUIDED_STUDIES.map((s) => s.id)).size).toBe(GUIDED_STUDIES.length);
    for (const s of GUIDED_STUDIES) expect(s.opening.length).toBeGreaterThan(10);
  });

  it('sonraki adım çıktısını ayrıştırır', () => {
    expect(parseNext({ crisis: true })).toEqual({ crisis: true });
    expect(parseNext({ reflect: 'a', question: 'Ne ağır basıyor?', done: false })).toEqual({ crisis: false, reflect: 'a', question: 'Ne ağır basıyor?', done: false });
    expect(parseNext({ question: '', done: true })?.crisis).toBe(false);
    expect(parseNext({ question: '' })).toBeNull();
  });

  it('bitiş çıktısını ayrıştırır, en fazla iki adım', () => {
    const r = parseFinish({ summary: 'Özet', open: 'Soru?', steps: ['a', 'b', 'c', ''] });
    expect(r && !r.crisis && r.steps).toEqual(['a', 'b']);
    expect(parseFinish({ summary: '' })).toBeNull();
  });

  it('soru-cevapları sınırlar', () => {
    const turn = { q: 'Soru', a: 'Cevap' };
    expect(sanitizeTurns([turn])).toEqual([turn]);
    expect(sanitizeTurns(Array(STUDY_MAX_QUESTIONS + 2).fill(turn))).toBeNull();
    expect(sanitizeTurns([{ q: 'Soru', a: 'x'.repeat(900) }])).toBeNull();
    expect(sanitizeTurns([{ q: 'Soru', a: '' }])).toBeNull();
  });

  it('izin yalnızca sahibine ve geçerli çalışmaya çalışır', async () => {
    const token = await signStudy({ id: 'x', s: 'karar', u: 'a@example.test' });
    expect(await verifyStudy(token, 'a@example.test')).not.toBeNull();
    expect(await verifyStudy(token, 'b@example.test')).toBeNull();
    const bad = await signStudy({ id: 'x', s: 'yok', u: 'a@example.test' });
    expect(await verifyStudy(bad, 'a@example.test')).toBeNull();
  });

  it('mentora geçiş taslağı soru sınırını aşmaz', () => {
    const q = turnsToQuestion('Karar vermek', [{ q: 'S', a: 'c'.repeat(800) }, { q: 'S2', a: 'd'.repeat(800) }], 1000);
    expect(q.length).toBeLessThanOrEqual(1000);
    expect(q.startsWith('"Karar vermek"')).toBe(true);
  });
});

describe('adım ve hatırlatma', () => {
  it('serbest metinli adım kendi cümlesiyle kaydedilir', async () => {
    const user = u();
    const s = await saveStep(user, { stepId: 'ozel', customLabel: 'Pazartesi patronumla konuşmak', detail: '', topic: '', mentorId: 'marcus' });
    expect(s.label).toBe('Pazartesi patronumla konuşmak');
  });

  it('adım yoksa hatırlatma kurulmaz; varsa vakti gelince bir kez gönderilir', async () => {
    const user = u();
    expect(await setReminder(user, 3)).toBeNull();
    await saveStep(user, { stepId: 'konusma', detail: '', topic: '', mentorId: 'marcus' });
    const r = await setReminder(user, 3);
    expect(r?.date).toBe(addDays(todayKey(), 3));
    // Kullanıcı kaydı yok: e-posta gitmez ama hatırlatma tüketilir
    const res = await sendDueReminders(r!.date);
    expect(res.sent).toBe(0);
    expect(await getReminder(user)).toBeNull();
  });

  it('adım tamamlandıysa hatırlatma gönderilmez', async () => {
    const user = u();
    await saveStep(user, { stepId: 'sinir', detail: '', topic: '', mentorId: 'marcus' });
    const r = await setReminder(user, 7);
    await updateStepStatus(user, 'done');
    expect((await sendDueReminders(r!.date)).sent).toBe(0);
  });

  it('tarih aritmetiği ay ve yıl sınırını geçer', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});
