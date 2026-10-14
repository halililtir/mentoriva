/**
 * ESKİ mentor talimatları — 2026-10-05 dürüstlük katmanından önceki hâl
 * (commit fb128a5), yalnızca admin "Eski / Yeni" körlemesine karşılaştırması için
 * (`/api/admin/lab/compare`). Canlı cevaplarda KULLANILMAZ.
 *
 * Neden duruyor: 2026-10-05 sonrası eklenen yasaklar uydurmayı azalttı ama sesi
 * robotlaştırdı. Yeni talimatların eski sıcaklığı yakalayıp yakalamadığını ürün
 * sahibi bu karşılaştırmayla değerlendirir. Karar verilince bu klasör silinebilir.
 * Sokrates o tarihte yoktu; karşılaştırmada yer almaz.
 */

import type { MentorId } from '@/types';
import type { MentorPromptBundle } from './types';
import { JUNG_PROMPT } from './jung';
import { NIETZSCHE_PROMPT } from './nietzsche';
import { MEVLANA_PROMPT } from './mevlana';
import { MARCUS_PROMPT } from './marcus';
import { SENECA_PROMPT } from './seneca';

export const LEGACY_PROMPTS: Partial<Record<MentorId, MentorPromptBundle>> = {
  jung: JUNG_PROMPT,
  nietzsche: NIETZSCHE_PROMPT,
  mevlana: MEVLANA_PROMPT,
  marcus: MARCUS_PROMPT,
  seneca: SENECA_PROMPT,
};
