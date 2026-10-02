/**
 * POST /api/v1/share/image  { token } → PNG paylaşım kartı.
 *
 * Yalnızca /api/v1/share/card ucunun imzaladığı, süresi dolmamış izinle
 * çalışır; içeriği kendisi doğrulamaz, imzaya güvenir.
 */

import { renderShareCard } from '@/lib/share/card';
import { verifyCard } from '@/lib/share/token';
import { getActiveMentor, isActiveMentor } from '@/lib/mentors/metadata';

export const runtime = 'edge';

export async function POST(req: Request) {
  let token = '';
  try {
    const body = (await req.json()) as { token?: unknown };
    token = typeof body.token === 'string' ? body.token : '';
  } catch {}

  const payload = token ? await verifyCard(token) : null;
  if (!payload || !isActiveMentor(payload.mentorId)) {
    return Response.json({ error: 'Kart izninin süresi dolmuş. Tekrar dene.' }, { status: 403 });
  }

  const image = await renderShareCard({
    mentor: getActiveMentor(payload.mentorId),
    question: payload.question,
    highlight: payload.highlight,
    quote: payload.quote,
    label: payload.label,
    origin: new URL(req.url).origin,
  });
  image.headers.set('Cache-Control', 'no-store');
  return image;
}
