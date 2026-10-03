import { afterEach, describe, expect, it } from 'vitest';
import { parseSynthesis, synthesize } from '@/lib/mentors/synthesis';

describe('mentor sentezi', () => {
  afterEach(() => { delete process.env['MENTORIVA_MOCK_AI']; });

  it('eksik ya da biçimsiz çıktıyı reddeder, markdown temizler', () => {
    expect(parseSynthesis({ agree: 'x', differ: '', ask: 'y' })).toBeNull();
    expect(parseSynthesis('metin')).toBeNull();
    expect(parseSynthesis({ agree: '', differ: '**Jung** anlamaya çağırıyor', ask: 'Ne istiyorsun?' })).toEqual({
      agree: '',
      differ: 'Jung anlamaya çağırıyor',
      ask: 'Ne istiyorsun?',
    });
  });

  it('tek cevapta sentez yapılmaz; ikide üretilir', async () => {
    process.env['MENTORIVA_MOCK_AI'] = '1';
    expect(await synthesize('Soru?', [{ mentorId: 'jung', text: 'a' }])).toBeNull();
    const s = await synthesize('Soru?', [
      { mentorId: 'jung', text: 'Gölgene bak.' },
      { mentorId: 'seneca', text: 'Bu akşam bir saat ayır.\n\n“Öfkenin en büyük ilacı beklemektir.”\n— Seneca, Öfke Üzerine II.29' },
    ]);
    expect(s?.differ).toContain('Jung');
    expect(s?.ask).toMatch(/\?$/);
  });
});
