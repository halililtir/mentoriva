/**
 * GET /api/v1/share/test-card?m=<mentor>&r=<mentor>-<yüzde>,…&s=<tohum>
 * → kişilik testi sonuç kartı (PNG, 1080×1920).
 *
 * Serbest metin almaz: mentor kimlikleri doğrulanır, yüzdeler 0–100 tamsayı,
 * cümle hazır havuzdan tohumla seçilir (sonuç sayfasındakiyle aynı cümle).
 */

import { renderTestCard } from '@/lib/share/test-card';
import { isActiveMentor } from '@/lib/mentors/metadata';
import { getRandomSlap } from '@/lib/mentors/slaps';
import type { MentorId } from '@/types';

export const runtime = 'edge';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const primary = url.searchParams.get('m') ?? '';
  const seed = Number(url.searchParams.get('s'));
  const results = (url.searchParams.get('r') ?? '')
    .split(',')
    .map((part) => {
      const [id, pct] = part.split('-');
      const n = Number(pct);
      return id && isActiveMentor(id) && Number.isInteger(n) && n >= 0 && n <= 100 ? { id: id as MentorId, pct: n } : null;
    })
    .filter((x): x is { id: MentorId; pct: number } => x !== null);

  // Sıra sonuç sayfasındakiyle aynı kalır (eşitlikte de); ilk sıradaki ana mentor olmalı
  const unique = [...new Map(results.map((r) => [r.id, r])).values()];
  const total = unique.reduce((s, r) => s + r.pct, 0);
  if (!isActiveMentor(primary) || !Number.isFinite(seed) || unique.length === 0 || total > 102 || unique[0]!.id !== primary) {
    return Response.json({ error: 'Geçersiz sonuç' }, { status: 400 });
  }

  const image = await renderTestCard({ primary, results: unique, slap: getRandomSlap(primary, seed), origin: url.origin });
  image.headers.set('Cache-Control', 'public, max-age=86400, immutable');
  return image;
}
